'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Brain, User, LogOut, Settings } from 'lucide-react';

interface CourseStats {
  totalCourses: number;
  completedCourses: number;
  averageProgress: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut } = useAuthStore();
  const [courseStats, setCourseStats] = useState<CourseStats>({
    totalCourses: 0,
    completedCourses: 0,
    averageProgress: 0
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/signin');
    }
  }, [isAuthenticated, isLoading, router]);

  // Проверяем обязательные курсы и загружаем статистику
  useEffect(() => {
    if (isAuthenticated && user) {
      checkMandatoryCourses();
      fetchCourseStats();
    }
  }, [isAuthenticated, user]);

  const checkMandatoryCourses = async () => {
    try {
      const response = await fetch('/api/mandatory-courses');
      if (response.ok) {
        const data = await response.json();
        // Если есть незавершенные обязательные курсы, перенаправляем на обучение
        if (!data.canAccessCatalog && data.totalMandatoryCourses > 0) {
          router.push('/mandatory-training');
          return;
        }
      }
    } catch (error) {
      console.error('Error checking mandatory courses:', error);
    }
  };

  const fetchCourseStats = async () => {
    try {
      // Получаем все курсы
      const coursesResponse = await fetch('/api/courses');
      if (!coursesResponse.ok) return;
      
      const coursesData = await coursesResponse.json();
      const totalCourses = coursesData.courses?.length || 0;

      if (totalCourses === 0) {
        setCourseStats({
          totalCourses: 0,
          completedCourses: 0,
          averageProgress: 0
        });
        return;
      }

      // Получаем прогресс пользователя по всем курсам
      let completedCourses = 0;
      let totalProgress = 0;

      for (const course of coursesData.courses) {
        try {
          const progressResponse = await fetch(`/api/courses/${course.id}/progress`);
          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            if (progressData.progress?.is_completed) {
              completedCourses++;
            }
            totalProgress += progressData.progress?.progress_percentage || 0;
          }
        } catch (error) {
          console.error(`Error fetching progress for course ${course.id}:`, error);
        }
      }

      const averageProgress = totalCourses > 0 ? Math.round(totalProgress / totalCourses) : 0;

      setCourseStats({
        totalCourses,
        completedCourses,
        averageProgress
      });
    } catch (error) {
      console.error('Error fetching course stats:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

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

  if (!isAuthenticated || !user) {
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
              <span className="text-gray-700">Дашборд</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  {user.user_metadata?.name || user.email}
                </span>
                {user.user_metadata?.role === 'ADMIN' && (
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
                    Админ
                  </span>
                )}
              </div>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  fetchCourseStats();
                  checkMandatoryCourses();
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                Обновить
              </Button>
              
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Добро пожаловать, {user.user_metadata?.name || 'пользователь'}!
          </h1>
          <p className="text-gray-600">
            Управляйте своим обучением и исследуйте AI-сервисы
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/learning-center">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                  <CardTitle>Мои курсы</CardTitle>
                </div>
                <CardDescription>
                  Продолжить обучение и изучать новые материалы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{courseStats.totalCourses} активных курса</span>
                  <span>{courseStats.averageProgress}% прогресс</span>
                </div>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <Link href="/ai-catalog">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Brain className="h-6 w-6 text-green-600" />
                  <CardTitle>AI Каталог</CardTitle>
                </div>
                <CardDescription>
                  Исследовать новые AI-инструменты и сервисы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>50+ сервисов</span>
                  <span>15 избранных</span>
                </div>
              </CardContent>
            </Link>
          </Card>

          {user.user_metadata?.role === 'ADMIN' && (
            <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <Link href="/admin">
                <CardHeader>
                  <div className="flex items-center space-x-2">
                    <Settings className="h-6 w-6 text-purple-600" />
                    <CardTitle>Админ панель</CardTitle>
                  </div>
                  <CardDescription>
                    Управление курсами и сервисами
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Контент</span>
                    <span>Пользователи</span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          )}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Последняя активность</CardTitle>
            <CardDescription>
              Ваши недавние действия на платформе
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Завершен урок "Основы ML"</p>
                  <p className="text-xs text-gray-500">2 часа назад</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <Brain className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Добавлен сервис в избранное</p>
                  <p className="text-xs text-gray-500">1 день назад</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <User className="h-5 w-5 text-gray-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Профиль обновлен</p>
                  <p className="text-xs text-gray-500">3 дня назад</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}