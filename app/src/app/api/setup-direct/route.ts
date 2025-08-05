import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    console.log('Starting database setup...');
    
    // Создаем таблицы по одной
    const tables = [
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            name TEXT,
            role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'courses',
        sql: `
          CREATE TABLE IF NOT EXISTS public.courses (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            duration_minutes INTEGER NOT NULL DEFAULT 60,
            is_published BOOLEAN NOT NULL DEFAULT FALSE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      },
      {
        name: 'service_catalog',
        sql: `
          CREATE TABLE IF NOT EXISTS public.service_catalog (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT NOT NULL,
            category TEXT NOT NULL,
            url TEXT,
            api_endpoint TEXT,
            pricing JSONB NOT NULL DEFAULT '{"model": "free"}',
            features TEXT[] DEFAULT '{}',
            is_active BOOLEAN NOT NULL DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      }
    ];

    const results = [];
    
    for (const table of tables) {
      try {
        console.log(`Creating table: ${table.name}`);
        
        // Используем fetch для прямого SQL запроса к Supabase REST API
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          },
          body: JSON.stringify({ sql: table.sql })
        });

        if (response.ok) {
          console.log(`✅ Table ${table.name} created successfully`);
          results.push({ table: table.name, status: 'success' });
        } else {
          const errorText = await response.text();
          console.log(`❌ Failed to create table ${table.name}:`, errorText);
          results.push({ table: table.name, status: 'error', error: errorText });
        }
      } catch (error: any) {
        console.log(`❌ Error creating table ${table.name}:`, error.message);
        results.push({ table: table.name, status: 'error', error: error.message });
      }
    }

    // Попробуем создать через прямой SQL с помощью Supabase клиента
    try {
      console.log('Trying direct SQL execution...');
      
      const { error: usersError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.users (
            id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
            email TEXT NOT NULL UNIQUE,
            name TEXT,
            role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (usersError) {
        console.log('exec_sql not available, trying alternative...');
        
        // Пробуем создать таблицы через insert (это создаст таблицу, если её нет)
        const { error: insertError } = await supabase
          .from('users')
          .select('id')
          .limit(1);

        console.log('Table check result:', insertError?.message || 'success');
      }

    } catch (error: any) {
      console.log('Direct SQL error:', error.message);
    }

    // Добавляем тестовые данные в courses
    try {
      const { error: coursesError } = await supabase
        .from('courses')
        .upsert([
          {
            title: 'Введение в искусственный интеллект',
            description: 'Основы машинного обучения и нейронных сетей для начинающих',
            category: 'AI/ML',
            duration_minutes: 180,
            is_published: true
          }
        ]);

      if (coursesError) {
        console.log('Courses insert error:', coursesError.message);
        results.push({ table: 'courses_data', status: 'error', error: coursesError.message });
      } else {
        console.log('✅ Test data inserted successfully');
        results.push({ table: 'courses_data', status: 'success' });
      }
    } catch (error: any) {
      console.log('Test data error:', error.message);
      results.push({ table: 'courses_data', status: 'error', error: error.message });
    }

    return NextResponse.json({ 
      message: 'Database setup completed',
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Failed to setup database', details: error.message },
      { status: 500 }
    );
  }
}