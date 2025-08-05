import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    const { data: quiz, error } = await supabase
      .from('lesson_quizzes')
      .select(`
        *,
        questions:quiz_questions(*),
        lesson:course_lessons(
          *,
          course:courses(
            title,
            is_published
          )
        )
      `)
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Quiz not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Проверяем, что курс опубликован
    if (!quiz.lesson?.course?.is_published) {
      return NextResponse.json(
        { error: 'Quiz not available' },
        { status: 403 }
      );
    }

    return NextResponse.json({ quiz });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quiz' },
      { status: 500 }
    );
  }
}