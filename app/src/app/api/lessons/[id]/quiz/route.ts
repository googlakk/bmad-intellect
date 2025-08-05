import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
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

    // Получаем тест для урока
    const { data: quiz, error: quizError } = await supabase
      .from('lesson_quizzes')
      .select(`
        id,
        title,
        description,
        passing_score,
        time_limit_minutes,
        quiz_questions (
          id,
          question_text,
          question_type,
          options,
          correct_answer,
          order_index
        )
      `)
      .eq('lesson_id', params.id)
      .single();

    if (quizError) {
      if (quizError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Quiz not found for this lesson' },
          { status: 404 }
        );
      }
      throw quizError;
    }

    // Сортируем вопросы по порядку
    if (quiz.quiz_questions) {
      quiz.quiz_questions.sort((a: any, b: any) => a.order_index - b.order_index);
      
      // Убираем правильные ответы из ответа (для безопасности)
      quiz.quiz_questions = quiz.quiz_questions.map((q: any) => ({
        id: q.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        order_index: q.order_index,
        // correct_answer не включаем!
      }));
    }

    return NextResponse.json({ 
      quiz: {
        id: quiz.id,
        title: quiz.title,
        description: quiz.description,
        passing_score: quiz.passing_score,
        time_limit_minutes: quiz.time_limit_minutes,
        questions: quiz.quiz_questions || []
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}