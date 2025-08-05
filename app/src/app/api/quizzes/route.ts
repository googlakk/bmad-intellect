import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { quizSchema } from '@/lib/schemas/course';

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

    // Проверяем права администратора
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userData?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = quizSchema.parse(body);
    
    const { data: quiz, error } = await supabase
      .from('lesson_quizzes')
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json({ quiz }, { status: 201 });
  } catch (error: any) {
    console.error('API error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create quiz' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const lessonId = searchParams.get('lesson_id');

    if (!lessonId) {
      return NextResponse.json(
        { error: 'Lesson ID is required' },
        { status: 400 }
      );
    }

    const { data: quizzes, error } = await supabase
      .from('lesson_quizzes')
      .select(`
        *,
        questions:quiz_questions(*)
      `)
      .eq('lesson_id', lessonId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json({ quizzes });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quizzes' },
      { status: 500 }
    );
  }
}