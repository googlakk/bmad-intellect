import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    console.log('Starting database seeding...');
    
    // Добавляем тестовые курсы
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .upsert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          title: 'Введение в искусственный интеллект',
          description: 'Основы машинного обучения и нейронных сетей для начинающих. Изучите ключевые концепции AI, алгоритмы машинного обучения и практические применения.',
          category: 'AI/ML',
          duration_minutes: 180,
          is_published: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'Веб-разработка с Next.js',
          description: 'Современная разработка React приложений с использованием Next.js. Изучите App Router, Server Components и лучшие практики.',
          category: 'Web Development',
          duration_minutes: 240,
          is_published: true
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          title: 'Основы работы с базами данных',
          description: 'PostgreSQL и оптимизация запросов. Научитесь проектировать эффективные схемы БД и писать оптимальные SQL запросы.',
          category: 'Database',
          duration_minutes: 120,
          is_published: true
        }
      ], { onConflict: 'id' })
      .select();

    if (coursesError) {
      console.error('Error seeding courses:', coursesError);
      return NextResponse.json(
        { error: 'Failed to seed courses', details: coursesError.message },
        { status: 500 }
      );
    }

    // Добавляем тестовые AI-сервисы
    const { data: services, error: servicesError } = await supabase
      .from('service_catalog')
      .upsert([
        {
          id: '650e8400-e29b-41d4-a716-446655440001',
          name: 'GPT-4 Turbo',
          description: 'Мощная языковая модель от OpenAI для генерации текста, кода и анализа данных',
          category: 'Language Models',
          url: 'https://openai.com/gpt-4',
          pricing: { model: 'paid', price: 0.01, currency: 'USD', period: 'usage' },
          features: ['Генерация текста', 'Анализ кода', 'Переводы', 'Рассуждения'],
          is_active: true
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440002',
          name: 'Claude 3.5 Sonnet',
          description: 'Интеллектуальный AI-ассистент от Anthropic для сложных задач',
          category: 'Language Models',
          url: 'https://claude.ai',
          pricing: { model: 'freemium' },
          features: ['Анализ документов', 'Программирование', 'Креативное письмо'],
          is_active: true
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440003',
          name: 'DALL-E 3',
          description: 'AI для генерации изображений по текстовому описанию',
          category: 'Image Generation',
          url: 'https://openai.com/dall-e-3',
          pricing: { model: 'paid', price: 0.040, currency: 'USD', period: 'usage' },
          features: ['Генерация изображений', 'Редактирование', 'Вариации'],
          is_active: true
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440004',
          name: 'Stable Diffusion',
          description: 'Open-source модель для генерации изображений',
          category: 'Image Generation',
          url: 'https://stability.ai',
          pricing: { model: 'free' },
          features: ['Генерация изображений', 'Inpainting', 'Upscaling'],
          is_active: true
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440005',
          name: 'Whisper API',
          description: 'AI для распознавания и транскрипции речи',
          category: 'Audio Processing',
          url: 'https://openai.com/research/whisper',
          pricing: { model: 'paid', price: 0.006, currency: 'USD', period: 'usage' },
          features: ['Транскрипция', 'Перевод речи', 'Шумоподавление'],
          is_active: true
        },
        {
          id: '650e8400-e29b-41d4-a716-446655440006',
          name: 'Hugging Face Transformers',
          description: 'Библиотека для работы с предобученными моделями',
          category: 'ML Platform',
          url: 'https://huggingface.co',
          pricing: { model: 'freemium' },
          features: ['Готовые модели', 'Fine-tuning', 'Datasets'],
          is_active: true
        }
      ], { onConflict: 'id' })
      .select();

    if (servicesError) {
      console.error('Error seeding services:', servicesError);
      return NextResponse.json(
        { error: 'Failed to seed services', details: servicesError.message },
        { status: 500 }
      );
    }

    console.log('Database seeded successfully!');
    console.log(`Added ${courses?.length || 0} courses`);
    console.log(`Added ${services?.length || 0} services`);

    return NextResponse.json({ 
      message: 'Database seeded successfully!',
      data: {
        courses: courses?.length || 0,
        services: services?.length || 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed database', details: error.message },
      { status: 500 }
    );
  }
}