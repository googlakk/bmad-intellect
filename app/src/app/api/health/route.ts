import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Простой запрос для проверки подключения к БД
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { 
          status: 'error', 
          database: 'disconnected',
          message: error.message 
        },
        { status: 500 }
      );
    }

    // Проверяем статус аутентификации
    const { data: { session } } = await supabase.auth.getSession();

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      auth: session ? 'authenticated' : 'unauthenticated',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error.message || 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}