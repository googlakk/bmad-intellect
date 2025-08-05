import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { courseSchema } from '@/lib/schemas/course';

export async function GET() {
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

    // Проверяем права пользователя
    let { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Если пользователя нет в таблице users, создаем запись на основе metadata
    if (!userData && session.user.user_metadata?.role === 'ADMIN') {
      const { error: insertError } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!,
          role: 'ADMIN',
        });

      if (!insertError) {
        userData = { role: 'ADMIN' };
      }
    }

    // Для админов показываем все курсы, для пользователей только опубликованные
    let query = supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (userData?.role !== 'ADMIN') {
      query = query.eq('is_published', true);
    }

    const { data: courses, error } = await query;

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

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
    let { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    // Если пользователя нет в таблице users, создаем запись на основе metadata
    if (!userData && session.user.user_metadata?.role === 'ADMIN') {
      const { error: insertError } = await supabase
        .from('users')
        .upsert({
          id: session.user.id,
          email: session.user.email!,
          name: session.user.user_metadata?.name || session.user.email!,
          role: 'ADMIN',
        });

      if (!insertError) {
        userData = { role: 'ADMIN' };
      }
    }

    if (userData?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);
    
    const validatedData = courseSchema.parse(body);
    console.log('Validated data:', validatedData);
    
    const { data: course, error } = await supabase
      .from('courses')
      .insert(validatedData)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      throw error;
    }

    console.log('Created course:', course);

    return NextResponse.json({ course }, { status: 201 });
  } catch (error: any) {
    console.error('API error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}