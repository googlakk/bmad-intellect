import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    // Получаем информацию об уроке
    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('id, course_id, has_quiz')
      .eq('id', params.id)
      .single();

    if (lessonError) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Если у урока есть тест, не разрешаем отмечать как завершенный без прохождения теста
    if (lesson.has_quiz) {
      return NextResponse.json(
        { error: 'Cannot complete lesson with quiz without passing the quiz' },
        { status: 400 }
      );
    }

    // Отмечаем урок как завершенный
    const { error: upsertError } = await supabase
      .from('user_lesson_progress')
      .upsert({
        user_id: session.user.id,
        lesson_id: params.id,
        course_id: lesson.course_id,
        is_completed: true,
        completed_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,lesson_id'
      });

    if (upsertError) {
      throw upsertError;
    }

    // Обновляем общий прогресс курса
    await updateCourseProgress(supabase, session.user.id, lesson.course_id);

    return NextResponse.json({ 
      message: 'Lesson marked as complete',
      completed_at: new Date().toISOString()
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to complete lesson' },
      { status: 500 }
    );
  }
}

async function updateCourseProgress(supabase: any, userId: string, courseId: string) {
  try {
    // Получаем все уроки курса
    const { data: lessons } = await supabase
      .from('course_lessons')
      .select('id')
      .eq('course_id', courseId);

    if (!lessons || lessons.length === 0) return;

    // Получаем завершенные уроки пользователя
    const { data: completedLessons } = await supabase
      .from('user_lesson_progress')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('is_completed', true);

    const totalLessons = lessons.length;
    const completedCount = completedLessons?.length || 0;
    const progressPercentage = Math.round((completedCount / totalLessons) * 100);
    const isCompleted = completedCount === totalLessons;

    // Обновляем прогресс курса
    await supabase
      .from('user_course_progress')
      .upsert({
        user_id: userId,
        course_id: courseId,
        progress_percentage: progressPercentage,
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
        lessons_completed: completedCount,
        total_lessons: totalLessons,
      }, {
        onConflict: 'user_id,course_id'
      });

  } catch (error) {
    console.error('Error updating course progress:', error);
  }
}