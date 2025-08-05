import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { quizAttemptSchema } from '@/lib/schemas/course';

export async function POST(request: NextRequest) {
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
    
    // Проверяем, что пользователь отправляет свои результаты
    if (body.user_id !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const validatedData = quizAttemptSchema.parse(body);
    
    // Получаем квиз и вопросы для проверки ответов
    const { data: quiz, error: quizError } = await supabase
      .from('lesson_quizzes')
      .select(`
        *,
        questions:quiz_questions(*)
      `)
      .eq('id', validatedData.quiz_id)
      .single();

    if (quizError || !quiz) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Вычисляем правильные ответы и оценку
    let correctAnswers = 0;
    const totalQuestions = quiz.questions.length;

    quiz.questions.forEach((question: any) => {
      const userAnswer = validatedData.answers[question.id] || [];
      const correctAnswer = question.correct_answers;
      
      // Сравниваем ответы (упрощенная логика)
      if (JSON.stringify(userAnswer.sort()) === JSON.stringify(correctAnswer.sort())) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= quiz.passing_score;

    // Сохраняем результат
    const attemptData = {
      ...validatedData,
      score,
      max_score: 100,
      passed,
    };

    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .upsert(attemptData, { onConflict: 'user_id,quiz_id' })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Если квиз пройден, обновляем прогресс курса
    if (passed) {
      await updateCourseProgress(supabase, session.user.id, quiz.lesson_id, quiz.id);
    }

    return NextResponse.json({ 
      attempt,
      score,
      passed,
      correctAnswers,
      totalQuestions
    }, { status: 201 });
  } catch (error: any) {
    console.error('API error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit quiz attempt' },
      { status: 500 }
    );
  }
}

async function updateCourseProgress(supabase: any, userId: string, lessonId: string, quizId: string) {
  try {
    // Получаем информацию о курсе и уроке
    const { data: lesson } = await supabase
      .from('course_lessons')
      .select('course_id')
      .eq('id', lessonId)
      .single();

    if (!lesson) return;

    // Получаем или создаем запись прогресса
    const { data: existingProgress } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', lesson.course_id)
      .single();

    const passedQuizzes = existingProgress?.passed_quizzes || [];
    if (!passedQuizzes.includes(quizId)) {
      passedQuizzes.push(quizId);
    }

    // Получаем все квизы курса для проверки завершения
    const { data: allQuizzes } = await supabase
      .from('lesson_quizzes')
      .select('id')
      .in('lesson_id', 
        await supabase
          .from('course_lessons')
          .select('id')
          .eq('course_id', lesson.course_id)
          .then((res: any) => res.data?.map((l: any) => l.id) || [])
      );

    const allQuizzesPassed = allQuizzes?.every((quiz: any) => 
      passedQuizzes.includes(quiz.id)
    ) || false;

    const progressData = {
      user_id: userId,
      course_id: lesson.course_id,
      passed_quizzes: passedQuizzes,
      all_quizzes_passed: allQuizzesPassed,
      completed_at: allQuizzesPassed ? new Date().toISOString() : null,
    };

    await supabase
      .from('user_course_progress')
      .upsert(progressData, { onConflict: 'user_id,course_id' });

  } catch (error) {
    console.error('Failed to update course progress:', error);
  }
}