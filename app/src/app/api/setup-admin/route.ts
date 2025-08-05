import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Создаем пользователя без подтверждения email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || 'Admin',
        },
        emailRedirectTo: undefined, // Отключаем редирект
      },
    });

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    if (authData.user) {
      // Создаем запись в таблице users с ролью ADMIN
      const { error: insertError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: authData.user.email!,
          name: name || 'Admin',
          role: 'ADMIN',
        });

      if (insertError) {
        console.error('Error creating admin user:', insertError);
        return NextResponse.json(
          { error: 'Failed to create admin user record' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Admin user created successfully',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          role: 'ADMIN',
        },
      }, { status: 201 });
    }

    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}