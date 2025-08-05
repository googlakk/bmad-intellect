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
  is_mandatory BOOLEAN NOT NULL DEFAULT FALSE,
  mandatory_for_role TEXT DEFAULT 'USER' CHECK (mandatory_for_role IN ('USER', 'ADMIN', 'ALL')),
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
  has_quiz BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица квизов для уроков
CREATE TABLE IF NOT EXISTS public.lesson_quizzes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  passing_score INTEGER NOT NULL DEFAULT 80,
  time_limit_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица вопросов квиза
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.lesson_quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'single_choice', 'true_false', 'text')),
  options JSONB DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  explanation TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица результатов квизов
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.lesson_quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}',
  score INTEGER NOT NULL DEFAULT 0,
  passed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Таблица прогресса пользователей по урокам
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  quiz_score INTEGER,
  quiz_attempts INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Таблица прогресса пользователей по курсам
CREATE TABLE IF NOT EXISTS public.user_course_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  lessons_completed INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, course_id)
);

-- Таблица для отслеживания обязательных курсов пользователей
CREATE TABLE IF NOT EXISTS public.user_mandatory_courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
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
CREATE INDEX IF NOT EXISTS idx_courses_mandatory ON public.courses(is_mandatory);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_order ON public.course_lessons(course_id, order_index);
CREATE INDEX IF NOT EXISTS idx_lesson_quizzes_lesson_id ON public.lesson_quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON public.quiz_questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_order ON public.quiz_questions(quiz_id, order_index);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_user_id ON public.user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_lesson_id ON public.user_lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_user_lesson_progress_course_id ON public.user_lesson_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON public.user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON public.user_course_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_mandatory_courses_user_id ON public.user_mandatory_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_mandatory_courses_course_id ON public.user_mandatory_courses(course_id);
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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_lessons_updated_at BEFORE UPDATE ON public.course_lessons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lesson_quizzes_updated_at BEFORE UPDATE ON public.lesson_quizzes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_catalog_updated_at BEFORE UPDATE ON public.service_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Row Level Security) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_mandatory_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_catalog ENABLE ROW LEVEL SECURITY;

-- Политики для пользователей
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Политики для курсов
CREATE POLICY "Anyone can view published courses" ON public.courses
  FOR SELECT USING (is_published = true);

CREATE POLICY "Admins can manage all courses" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Политики для уроков курсов
CREATE POLICY "Anyone can view lessons of published courses" ON public.course_lessons
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.courses 
      WHERE id = course_lessons.course_id AND is_published = true
    )
  );

CREATE POLICY "Admins can manage all course lessons" ON public.course_lessons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Политики для прогресса пользователей
CREATE POLICY "Users can view their own progress" ON public.user_course_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_course_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress" ON public.user_course_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Политики для каталога сервисов
CREATE POLICY "Anyone can view active services" ON public.service_catalog
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all services" ON public.service_catalog
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Политики для квизов
CREATE POLICY "Anyone can view quizzes of published lessons" ON public.lesson_quizzes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.course_lessons cl
      JOIN public.courses c ON c.id = cl.course_id
      WHERE cl.id = lesson_quizzes.lesson_id AND c.is_published = true
    )
  );

CREATE POLICY "Admins can manage all quizzes" ON public.lesson_quizzes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Политики для вопросов квизов
CREATE POLICY "Anyone can view quiz questions" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.lesson_quizzes lq
      JOIN public.course_lessons cl ON cl.id = lq.lesson_id
      JOIN public.courses c ON c.id = cl.course_id
      WHERE lq.id = quiz_questions.quiz_id AND c.is_published = true
    )
  );

CREATE POLICY "Admins can manage all quiz questions" ON public.quiz_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Политики для попыток квизов
CREATE POLICY "Users can view their own quiz attempts" ON public.quiz_attempts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own quiz attempts" ON public.quiz_attempts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts" ON public.quiz_attempts
  FOR UPDATE USING (auth.uid() = user_id);

-- Политики для обязательных курсов
CREATE POLICY "Users can view their own mandatory courses" ON public.user_mandatory_courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage mandatory courses" ON public.user_mandatory_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );