import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['USER', 'ADMIN']),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Проверяем аутентификацию и права администратора
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
    const validatedData = createUserSchema.parse(body);

    // Создаем пользователя в Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
      options: {
        data: {
          name: validatedData.name,
        },
        emailRedirectTo: undefined, // Отключаем подтверждение email
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (authData.user) {
      // Создаем запись в таблице users
      const { error: insertError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: authData.user.email!,
          name: validatedData.name,
          role: validatedData.role,
        });

      if (insertError) {
        console.error('Error creating user record:', insertError);
        return NextResponse.json(
          { error: 'Failed to create user record' },
          { status: 500 }
        );
      }

      // Если пользователь обычный, назначаем ему обязательные курсы
      if (validatedData.role === 'USER') {
        await assignMandatoryCourses(supabase, authData.user.id);
      }

      return NextResponse.json({
        message: 'User created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          name: validatedData.name,
          role: validatedData.role,
        },
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  } catch (error: any) {
    console.error('API error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid data format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function assignMandatoryCourses(supabase: any, userId: string) {
  try {
    // Получаем все обязательные курсы для пользователей
    const { data: mandatoryCourses } = await supabase
      .from('courses')
      .select('id')
      .eq('is_mandatory', true)
      .eq('is_published', true)
      .or('mandatory_for_role.eq.USER,mandatory_for_role.eq.ALL');

    if (mandatoryCourses && mandatoryCourses.length > 0) {
      const assignments = mandatoryCourses.map(course => ({
        user_id: userId,
        course_id: course.id,
      }));

      await supabase
        .from('user_mandatory_courses')
        .upsert(assignments, { onConflict: 'user_id,course_id' });
    }
  } catch (error) {
    console.error('Error assigning mandatory courses:', error);
  }
}