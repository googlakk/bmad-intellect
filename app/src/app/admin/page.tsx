'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Brain, Users, BarChart3, Settings, Plus, Database } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.user_metadata?.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || user?.user_metadata?.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-xl font-bold text-blue-600">
                Интеллект
              </Link>
              <span className="text-gray-500">|</span>
              <h1 className="text-2xl font-bold text-gray-900">Администрирование</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button asChild variant="outline">
                <Link href="/dashboard">Дашборд</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Панель администратора
          </h2>
          <p className="text-gray-600">
            Управление курсами, пользователями и контентом платформы
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/courses">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <CardTitle>Управление курсами</CardTitle>
                </div>
                <CardDescription>
                  Создание, редактирование и управление обучающими курсами
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Создание и редактирование</span>
                  <Button size="sm" asChild>
                    <Link href="/admin/courses/create">
                      <Plus className="h-4 w-4 mr-1" />
                      Создать курс
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/users">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Users className="h-6 w-6 text-green-600" />
                  <CardTitle>Управление пользователями</CardTitle>
                </div>
                <CardDescription>
                  Просмотр и управление учетными записями пользователей
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Управление пользователями</span>
                  <span>Создание аккаунтов</span>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/services">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Brain className="h-6 w-6 text-purple-600" />
                  <CardTitle>AI Каталог</CardTitle>
                </div>
                <CardDescription>
                  Управление каталогом AI-сервисов и инструментов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>AI инструменты</span>
                  <span>Каталог сервисов</span>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/analytics">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                  <CardTitle>Аналитика и отчеты</CardTitle>
                </div>
                <CardDescription>
                  Статистика обучения и использования платформы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Прогресс обучения</span>
                  <span>Метрики использования</span>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/mandatory-courses">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Settings className="h-6 w-6 text-red-600" />
                  <CardTitle>Обязательные курсы</CardTitle>
                </div>
                <CardDescription>
                  Настройка и назначение обязательных курсов
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Назначение курсов</span>
                  <span>Отслеживание прогресса</span>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/admin/database">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Database className="h-6 w-6 text-gray-600" />
                  <CardTitle>База данных</CardTitle>
                </div>
                <CardDescription>
                  Статистика и управление базой данных
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Статистика</span>
                  <span>Очистка данных</span>
                </div>
              </CardContent>
            </Link>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Последняя активность</CardTitle>
            <CardDescription>
              Недавние действия пользователей и системные события
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Новый пользователь зарегистрировался</p>
                  <p className="text-xs text-gray-500">user@example.com • 15 минут назад</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Курс "Введение в AI" завершен</p>
                  <p className="text-xs text-gray-500">Иван Петров • 2 часа назад</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Новый AI-сервис добавлен в каталог</p>
                  <p className="text-xs text-gray-500">GPT-4 Turbo • 1 день назад</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}