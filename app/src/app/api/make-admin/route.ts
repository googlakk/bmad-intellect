import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Временный endpoint для превращения пользователя в админа
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Находим пользователя по email и обновляем его роль
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (findError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Обновляем роль на ADMIN
    const { error: updateError } = await supabase
      .from('users')
      .update({ role: 'ADMIN' })
      .eq('email', email);

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update user role' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `User ${email} is now an admin`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: 'ADMIN',
      },
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}