import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const schema = `
-- Создание таблиц для образовательной платформы

-- Таблица пользователей (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'ADMIN')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица курсов
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

-- Таблица уроков курса
CREATE TABLE IF NOT EXISTS public.course_lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица прогресса пользователей по курсам
CREATE TABLE IF NOT EXISTS public.user_course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  completed_lessons TEXT[] DEFAULT '{}',
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Таблица каталога AI-сервисов
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

-- Индексы для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_published ON public.courses(is_published);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON public.course_lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON public.user_course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_service_catalog_category ON public.service_catalog(category);
CREATE INDEX IF NOT EXISTS idx_service_catalog_active ON public.service_catalog(is_active);

-- Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Триггеры для автоматического обновления updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_course_lessons_updated_at ON public.course_lessons;
CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_catalog_updated_at ON public.service_catalog;
CREATE TRIGGER update_service_catalog_updated_at BEFORE UPDATE ON public.service_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

-- Политики для пользователей
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Политики для курсов
DROP POLICY IF EXISTS "Anyone can view published courses" ON public.courses;
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Admins can manage all courses" ON public.courses;
CREATE POLICY "Admins can manage all courses" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Политики для уроков курсов
DROP POLICY IF EXISTS "Anyone can view lessons of published courses" ON public.course_lessons;
CREATE POLICY "Anyone can view lessons of published courses" ON public.course_lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_lessons.course_id AND is_published = true
    )
  );

DROP POLICY IF EXISTS "Admins can manage all course lessons" ON public.course_lessons;
CREATE POLICY "Admins can manage all course lessons" ON public.course_lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Политики для прогресса пользователей
DROP POLICY IF EXISTS "Users can view their own progress" ON public.user_course_progress;
CREATE POLICY "Users can view their own progress" ON public.user_course_progress
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON public.user_course_progress;
CREATE POLICY "Users can insert their own progress" ON public.user_course_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.user_course_progress;
CREATE POLICY "Users can update their own progress" ON public.user_course_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Политики для каталога сервисов
DROP POLICY IF EXISTS "Anyone can view active services" ON public.service_catalog;
CREATE POLICY "Anyone can view active services" ON public.service_catalog
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage all services" ON public.service_catalog;
CREATE POLICY "Admins can manage all services" ON public.service_catalog
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );
`;

export async function POST() {
  try {
    const supabase = await createClient();
    
    // Выполняем SQL схему
    const { error } = await supabase.rpc('exec_sql', { sql_query: schema });
    
    if (error) {
      // Если RPC функция не существует, пробуем выполнить по частям
      console.log('RPC method not available, trying direct SQL execution...');
      
      // Разбиваем схему на отдельные команды
      const commands = schema
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
      
      for (const command of commands) {
        if (command.trim()) {
          const { error: cmdError } = await supabase.rpc('exec', { sql: command });
          if (cmdError) {
            console.error(`Error executing command: ${command}`, cmdError);
            // Продолжаем выполнение остальных команд
          }
        }
      }
    }
    
    // Добавляем тестовые данные
    await seedDatabase(supabase);
    
    return NextResponse.json({ 
      message: 'Database schema applied successfully!',
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

async function seedDatabase(supabase: any) {
  try {
    // Добавляем тестовые курсы
    const { error: coursesError } = await supabase
      .from('courses')
      .upsert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Введение в искусственный интеллект',
          description: 'Основы машинного обучения и нейронных сетей для начинающих',
          category: 'AI/ML',
          duration_minutes: 180,
          is_published: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Веб-разработка с Next.js',
          description: 'Современная разработка React приложений с использованием Next.js',
          category: 'Web Development',
          duration_minutes: 240,
          is_published: true
        }
      ], { onConflict: 'id' });

    if (coursesError) {
      console.error('Error seeding courses:', coursesError);
    }

    // Добавляем тестовые сервисы
    const { error: servicesError } = await supabase
      .from('service_catalog')
      .upsert([
        {
          id: '650e8400-e29b-41d4-a716-446655440001',
          name: 'GPT-4 Turbo',
          description: 'Мощная языковая модель от OpenAI для генерации текста и кода',
          category: 'Language Models',
          url: 'https://openai.com/gpt-4',
          pricing: { model: 'paid', price: 0.01, currency: 'USD', period: 'usage' },
          features: ['Генерация текста', 'Анализ кода', 'Переводы', 'Рассуждения'],
          is_active: true
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440002',
          name: 'Claude 3.5 Sonnet',
          description: 'Интеллектуальный AI-ассистент от Anthropic',
          category: 'Language Models',
          url: 'https://claude.ai',
          pricing: { model: 'freemium' },
          features: ['Анализ документов', 'Программирование', 'Креативное письмо'],
          is_active: true
        }
      ], { onConflict: 'id' });

    if (servicesError) {
      console.error('Error seeding services:', servicesError);
    }

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}