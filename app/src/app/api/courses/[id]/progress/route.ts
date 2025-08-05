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

    // Получаем общий прогресс курса
    const { data: courseProgress, error: courseError } = await supabase
      .from('user_course_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('course_id', params.id)
      .single();

    // Получаем прогресс по урокам
    const { data: lessonProgress, error: lessonError } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('course_id', params.id);

    if (courseError && courseError.code !== 'PGRST116') {
      throw courseError;
    }

    if (lessonError) {
      throw lessonError;
    }

    // Если нет прогресса курса, создаем базовый объект
    const progress = courseProgress || {
      progress_percentage: 0,
      is_completed: false,
      lessons_completed: 0,
      total_lessons: 0,
      completed_at: null,
    };

    // Добавляем прогресс по урокам
    progress.lesson_progress = lessonProgress || [];

    return NextResponse.json({ progress });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course progress' },
      { status: 500 }
    );
  }
}