import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Получаем пользователя из auth.users через admin API
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

    if (listError) {
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Подтверждаем пользователя
    const { data, error: confirmError } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirm: true }
    );

    if (confirmError) {
      return NextResponse.json(
        { error: 'Failed to confirm user' },
        { status: 500 }
      );
    }

    // Также обновляем роль на ADMIN
    const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        email: user.email!,
        name: user.user_metadata?.name || 'Admin',
        role: 'ADMIN',
      });

    if (updateError) {
      console.error('Error updating user role:', updateError);
    }

    return NextResponse.json({
      message: `User ${email} confirmed and made admin`,
      user: {
        id: user.id,
        email: user.email,
        confirmed: true,
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