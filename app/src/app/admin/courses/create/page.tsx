'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/stores/authStore';
import { courseSchema, type CourseFormData } from '@/lib/schemas/course';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  ArrowLeft, 
  Save, 
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Tag,
  Users
} from 'lucide-react';

export default function CreateCoursePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      duration_minutes: 60,
      is_published: false,
      is_mandatory: false,
      mandatory_for_role: 'USER',
    },
  });

  const onSubmit = async (data: CourseFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/admin/courses/${result.course.id}/edit`);
        }, 2000);
      } else {
        setError(result.error || 'Произошла ошибка при создании курса');
      }
    } catch (err) {
      setError('Произошла ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  // Проверка прав доступа
  if (!isAuthenticated || user?.user_metadata?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Доступ запрещен</h2>
            <p className="text-gray-600 mb-4">У вас нет прав для создания курсов</p>
            <Button onClick={() => router.push('/')}>
              На главную
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Курс создан успешно!
              </h2>
              <p className="text-gray-600 mb-4">
                Перенаправляем на страницу редактирования...
              </p>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin/courses" className="text-blue-600 hover:underline">
                <ArrowLeft className="h-4 w-4 mr-2 inline" />
                Курсы
              </Link>
              <span className="text-gray-500">|</span>
              <h1 className="text-2xl font-bold text-gray-900">Создание нового курса</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
                Основная информация о курсе
              </CardTitle>
              <CardDescription>
                Заполните основные данные для создания нового курса
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <div className="flex items-center">
                      <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}

                {/* Название курса */}
                <div className="space-y-2">
                  <label htmlFor="title" className="text-sm font-medium text-gray-900">
                    Название курса *
                  </label>
                  <Input
                    id="title"
                    placeholder="Введение в искусственный интеллект"
                    {...form.register('title')}
                    className={form.formState.errors.title ? 'border-red-500' : ''}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
                  )}
                </div>

                {/* Описание */}
                <div className="space-y-2">
                  <label htmlFor="description" className="text-sm font-medium text-gray-900">
                    Описание курса *
                  </label>
                  <textarea
                    id="description"
                    rows={4}
                    placeholder="Подробное описание содержания и целей курса..."
                    {...form.register('description')}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      form.formState.errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {form.formState.errors.description && (
                    <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Категория */}
                  <div className="space-y-2">
                    <label htmlFor="category" className="text-sm font-medium text-gray-900 flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      Категория *
                    </label>
                    <Input
                      id="category"
                      placeholder="Искусственный интеллект"
                      {...form.register('category')}
                      className={form.formState.errors.category ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.category && (
                      <p className="text-sm text-red-600">{form.formState.errors.category.message}</p>
                    )}
                  </div>

                  {/* Длительность */}
                  <div className="space-y-2">
                    <label htmlFor="duration_minutes" className="text-sm font-medium text-gray-900 flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      Длительность (минуты) *
                    </label>
                    <Input
                      id="duration_minutes"
                      type="number"
                      min="1"
                      placeholder="60"
                      {...form.register('duration_minutes', { valueAsNumber: true })}
                      className={form.formState.errors.duration_minutes ? 'border-red-500' : ''}
                    />
                    {form.formState.errors.duration_minutes && (
                      <p className="text-sm text-red-600">{form.formState.errors.duration_minutes.message}</p>
                    )}
                  </div>
                </div>

                {/* Статус публикации */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900">Настройки публикации</h3>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_published"
                      {...form.register('is_published')}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="is_published" className="text-sm text-gray-900">
                      Опубликовать курс сразу
                    </label>
                  </div>
                  
                  <p className="text-xs text-gray-500">
                    Неопубликованные курсы видны только администраторам
                  </p>
                </div>

                {/* Обязательный курс */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center">
                    <Users className="h-5 w-5 mr-2" />
                    Обязательный курс
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_mandatory"
                      {...form.register('is_mandatory')}
                      className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="is_mandatory" className="text-sm text-gray-900">
                      Сделать курс обязательным для прохождения
                    </label>
                  </div>

                  {form.watch('is_mandatory') && (
                    <div className="ml-6 space-y-2">
                      <label htmlFor="mandatory_for_role" className="text-sm font-medium text-gray-900">
                        Обязательный для роли:
                      </label>
                      <select
                        id="mandatory_for_role"
                        {...form.register('mandatory_for_role')}
                        className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USER">Пользователи</option>
                        <option value="ADMIN">Администраторы</option>
                        <option value="ALL">Все роли</option>
                      </select>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500">
                    Обязательные курсы блокируют доступ к AI каталогу до их завершения
                  </p>
                </div>

                {/* Предварительный просмотр */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Предварительный просмотр:</h4>
                  <div className="bg-white p-4 rounded border">
                    <div className="flex items-center space-x-2 mb-2">
                      <Badge variant="secondary">{form.watch('category') || 'Категория'}</Badge>
                      {form.watch('is_mandatory') && (
                        <Badge variant="destructive">Обязательный</Badge>
                      )}
                      {!form.watch('is_published') && (
                        <Badge variant="outline">Черновик</Badge>
                      )}
                    </div>
                    <h5 className="font-semibold text-lg text-gray-900 mb-1">
                      {form.watch('title') || 'Название курса'}
                    </h5>
                    <p className="text-gray-600 text-sm mb-2">
                      {form.watch('description') || 'Описание курса...'}
                    </p>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="h-3 w-3 mr-1" />
                      {Math.floor((form.watch('duration_minutes') || 0) / 60)}ч {(form.watch('duration_minutes') || 0) % 60}м
                    </div>
                  </div>
                </div>

                {/* Кнопки действий */}
                <div className="flex gap-4 pt-6 border-t">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Создать курс
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}