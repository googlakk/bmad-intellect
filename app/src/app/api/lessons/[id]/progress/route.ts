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

    // Получаем прогресс урока для текущего пользователя
    const { data: progress, error } = await supabase
      .from('user_lesson_progress')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('lesson_id', params.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    const progressData = progress || {
      is_completed: false,
      completed_at: null,
      quiz_score: null,
      quiz_attempts: 0,
    };

    return NextResponse.json({ progress: progressData });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lesson progress' },
      { status: 500 }
    );
  }
}