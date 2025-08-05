import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Проверяем аутентификацию
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Получаем прогресс пользователя по курсу
    const { data: progress, error } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('course_id', params.courseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Database error:', error);
      throw error;
    }

    // Если прогресса нет, создаем пустой
    if (!progress) {
      const { data: newProgress, error: createError } = await supabase
        .from('user_course_progress')
        .insert({
          user_id: session.user.id,
          course_id: params.courseId,
          completed_lessons: [],
          passed_quizzes: [],
          progress_percentage: 0,
          all_quizzes_passed: false,
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating progress:', createError);
        throw createError;
      }

      return NextResponse.json({ progress: newProgress });
    }

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user progress' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const supabase = await createClient();
    
    // Проверяем аутентификацию
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { lessonId, quizId, action } = body;

    // Получаем текущий прогресс
    let { data: progress } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('course_id', params.courseId)
      .single();

    if (!progress) {
      // Создаем новый прогресс если его нет
      const { data: newProgress, error: createError } = await supabase
        .from('user_course_progress')
        .insert({
          user_id: session.user.id,
          course_id: params.courseId,
          completed_lessons: [],
          passed_quizzes: [],
          progress_percentage: 0,
          all_quizzes_passed: false,
        })
        .select()
        .single();

      if (createError) throw createError;
      progress = newProgress;
    }

    let updatedProgress = { ...progress };

    // Обновляем прогресс в зависимости от действия
    if (action === 'complete_lesson' && lessonId) {
      if (!updatedProgress.completed_lessons.includes(lessonId)) {
        updatedProgress.completed_lessons = [...updatedProgress.completed_lessons, lessonId];
      }
    } else if (action === 'pass_quiz' && quizId) {
      if (!updatedProgress.passed_quizzes.includes(quizId)) {
        updatedProgress.passed_quizzes = [...updatedProgress.passed_quizzes, quizId];
      }
    }

    // Получаем информацию о курсе для расчета прогресса
    const { data: course } = await supabase
      .from('courses')
      .select(`
        *,
        lessons:course_lessons(
          id,
          has_quiz,
          quizzes:lesson_quizzes(id)
        )
      `)
      .eq('id', params.courseId)
      .single();

    if (course) {
      // Рассчитываем процент прогресса
      const totalLessons = course.lessons.length;
      const completedLessons = updatedProgress.completed_lessons.length;
      
      // Считаем обязательные квизы
      const requiredQuizzes = course.lessons.filter((lesson: any) => lesson.has_quiz);
      const passedRequiredQuizzes = requiredQuizzes.filter((lesson: any) => 
        lesson.quizzes.some((quiz: any) => updatedProgress.passed_quizzes.includes(quiz.id))
      );

      const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
      const allQuizzesPassed = requiredQuizzes.length === 0 || passedRequiredQuizzes.length === requiredQuizzes.length;
      
      updatedProgress.progress_percentage = progressPercentage;
      updatedProgress.all_quizzes_passed = allQuizzesPassed;
      
      // Если все уроки пройдены и все квизы сданы, курс завершен
      if (completedLessons === totalLessons && allQuizzesPassed) {
        updatedProgress.completed_at = new Date().toISOString();
      }
    }

    // Сохраняем обновленный прогресс
    const { data: finalProgress, error: updateError } = await supabase
      .from('user_course_progress')
      .update(updatedProgress)
      .eq('user_id', session.user.id)
      .eq('course_id', params.courseId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ progress: finalProgress });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to update user progress' },
      { status: 500 }
    );
  }
}