'use client';

import { Brain, ExternalLink, Star, DollarSign } from 'lucide-react';
import { MandatoryCoursesCheck } from '@/components/courses/MandatoryCoursesCheck';

export function AICatalogContent() {
  // Временные данные для демонстрации
  const services = [
    {
      id: '1',
      name: 'GPT-4 Turbo',
      description: 'Мощная языковая модель от OpenAI для генерации текста и кода',
      category: 'Language Models',
      url: 'https://openai.com/gpt-4',
      pricing: { model: 'paid', price: 0.01, currency: 'USD', period: 'usage' },
      features: ['Генерация текста', 'Анализ кода', 'Переводы', 'Рассуждения'],
      is_active: true,
    },
    {
      id: '2',
      name: 'DALL-E 3',
      description: 'AI для генерации изображений по текстовому описанию',
      category: 'Image Generation',
      url: 'https://openai.com/dall-e-3',
      pricing: { model: 'paid', price: 0.040, currency: 'USD', period: 'usage' },
      features: ['Генерация изображений', 'Редактирование', 'Вариации'],
      is_active: true,
    },
    {
      id: '3',
      name: 'Claude 3.5 Sonnet',
      description: 'Интеллектуальный AI-ассистент от Anthropic',
      category: 'Language Models',
      url: 'https://claude.ai',
      pricing: { model: 'freemium' },
      features: ['Анализ документов', 'Программирование', 'Креативное письмо'],
      is_active: true,
    },
    {
      id: '4',
      name: 'Stable Diffusion',
      description: 'Open-source модель для генерации изображений',
      category: 'Image Generation',
      url: 'https://stability.ai',
      pricing: { model: 'free' },
      features: ['Генерация изображений', 'Inpainting', 'Upscaling'],
      is_active: true,
    },
    {
      id: '5',
      name: 'Whisper API',
      description: 'AI для распознавания и транскрипции речи',
      category: 'Audio Processing',
      url: 'https://openai.com/research/whisper',
      pricing: { model: 'paid', price: 0.006, currency: 'USD', period: 'usage' },
      features: ['Транскрипция', 'Перевод речи', 'Шумоподавление'],
      is_active: true,
    },
    {
      id: '6',
      name: 'Hugging Face Transformers',
      description: 'Библиотека для работы с предобученными моделями',
      category: 'ML Platform',
      url: 'https://huggingface.co',
      pricing: { model: 'freemium' },
      features: ['Готовые модели', 'Fine-tuning', 'Datasets'],
      is_active: true,
    },
  ];

  const categories = [...new Set(services.map(service => service.category))];

  const getPricingDisplay = (pricing: any) => {
    switch (pricing.model) {
      case 'free':
        return 'Бесплатно';
      case 'freemium':
        return 'Freemium';
      case 'paid':
        return `$${pricing.price}/${pricing.period === 'usage' ? 'запрос' : pricing.period}`;
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Уточняйте';
    }
  };

  return (
    <MandatoryCoursesCheck requireCompletion={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">AI Каталог</h1>
            <p className="text-xl text-gray-600">
              Каталог AI-сервисов и инструментов для вашей работы
            </p>
          </header>

          {/* Фильтры по категориям */}
          <div className="mb-8">
            <div className="flex flex-wrap gap-2">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
                Все
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Каталог сервисов */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Brain className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded">
                      {service.category}
                    </span>
                  </div>
                  <div className="flex items-center text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm text-gray-600 ml-1">4.8</span>
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {service.name}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {service.description}
                </p>
                
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {service.features.slice(0, 3).map((feature, index) => (
                      <span
                        key={index}
                        className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                    {service.features.length > 3 && (
                      <span className="text-xs text-gray-500">
                        +{service.features.length - 3} еще
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center text-green-600">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">
                      {getPricingDisplay(service.pricing)}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm">
                    Подробнее
                  </button>
                  <a
                    href={service.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200"
                  >
                    <ExternalLink className="h-4 w-4 text-gray-600" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Не нашли нужный сервис?
              </h2>
              <p className="text-gray-600 mb-6">
                Предложите новый AI-сервис для добавления в каталог
              </p>
              <button className="bg-green-600 text-white py-3 px-6 rounded-md hover:bg-green-700 transition-colors duration-200">
                Предложить сервис
              </button>
            </div>
          </div>
        </div>
      </div>
    </MandatoryCoursesCheck>
  );
}