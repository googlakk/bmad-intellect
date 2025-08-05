import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { lessonSchema } from '@/lib/schemas/course';

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
    const validatedData = lessonSchema.parse(body);
    
    const { data: lesson, error } = await supabase
      .from('course_lessons')
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json({ lesson }, { status: 201 });
  } catch (error: any) {
    console.error('API error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create lesson' },
      { status: 500 }
    );
  }
}