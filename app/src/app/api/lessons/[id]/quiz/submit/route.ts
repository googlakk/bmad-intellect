import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const submitQuizSchema = z.object({
  answers: z.array(z.object({
    question_id: z.string(),
    user_answer: z.union([z.string(), z.array(z.string())]),
  }))
});

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

    const body = await request.json();
    const { answers } = submitQuizSchema.parse(body);

    // Получаем тест с правильными ответами
    const { data: quiz, error: quizError } = await supabase
      .from('lesson_quizzes')
      .select(`
        id,
        passing_score,
        lesson_id,
        quiz_questions (
          id,
          question_text,
          question_type,
          correct_answer
        )
      `)
      .eq('lesson_id', params.id)
      .single();

    if (quizError) {
      return NextResponse.json(
        { error: 'Quiz not found' },
        { status: 404 }
      );
    }

    // Получаем курс для урока
    const { data: lesson } = await supabase
      .from('course_lessons')
      .select('course_id')
      .eq('id', params.id)
      .single();

    if (!lesson) {
      return NextResponse.json(
        { error: 'Lesson not found' },
        { status: 404 }
      );
    }

    // Проверяем ответы и вычисляем результат
    let correctAnswers = 0;
    const totalQuestions = quiz.quiz_questions.length;
    const questionResults: any[] = [];

    for (const question of quiz.quiz_questions) {
      const userAnswer = answers.find(a => a.question_id === question.id);
      let isCorrect = false;

      if (userAnswer) {
        const userAnswerValue = userAnswer.user_answer;
        const correctAnswer = question.correct_answer;

        if (question.question_type === 'multiple_choice') {
          // Для множественного выбора сравниваем массивы
          if (Array.isArray(userAnswerValue)) {
            const sortedUserAnswer = [...userAnswerValue].sort();
            const sortedCorrectAnswer = JSON.parse(correctAnswer).sort();
            isCorrect = JSON.stringify(sortedUserAnswer) === JSON.stringify(sortedCorrectAnswer);
          }
        } else {
          // Для остальных типов сравниваем строки
          isCorrect = String(userAnswerValue).toLowerCase().trim() === correctAnswer.toLowerCase().trim();
        }
      }

      if (isCorrect) {
        correctAnswers++;
      }

      questionResults.push({
        question_id: question.id,
        user_answer: userAnswer?.user_answer || '',
        is_correct: isCorrect,
      });
    }

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= quiz.passing_score;

    // Записываем попытку прохождения теста
    const { error: attemptError } = await supabase
      .from('quiz_attempts')
      .insert({
        user_id: session.user.id,
        quiz_id: quiz.id,
        score: score,
        passed: passed,
        answers: questionResults,
      });

    if (attemptError) {
      console.error('Error saving quiz attempt:', attemptError);
    }

    // Если тест пройден, обновляем прогресс урока
    if (passed) {
      // Получаем текущее количество попыток
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('quiz_id', quiz.id);

      const attemptCount = attempts?.length || 1;

      await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: session.user.id,
          lesson_id: params.id,
          course_id: lesson.course_id,
          is_completed: true,
          completed_at: new Date().toISOString(),
          quiz_score: score,
          quiz_attempts: attemptCount,
        }, {
          onConflict: 'user_id,lesson_id'
        });

      // Обновляем общий прогресс курса
      await updateCourseProgress(supabase, session.user.id, lesson.course_id);
    } else {
      // Если не пройден, все равно обновляем количество попыток
      const { data: attempts } = await supabase
        .from('quiz_attempts')
        .select('id')
        .eq('user_id', session.user.id)
        .eq('quiz_id', quiz.id);

      const attemptCount = attempts?.length || 1;

      await supabase
        .from('user_lesson_progress')
        .upsert({
          user_id: session.user.id,
          lesson_id: params.id,
          course_id: lesson.course_id,
          is_completed: false,
          quiz_score: score,
          quiz_attempts: attemptCount,
        }, {
          onConflict: 'user_id,lesson_id'
        });
    }

    return NextResponse.json({
      score,
      passed,
      correct_answers: correctAnswers,
      total_questions: totalQuestions,
      passing_score: quiz.passing_score,
    });

  } catch (error: any) {
    console.error('API error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to submit quiz' },
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