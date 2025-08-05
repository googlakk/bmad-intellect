'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, CheckCircle, Lock, ArrowRight, AlertCircle } from 'lucide-react';

interface MandatoryCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  user_progress?: {
    progress_percentage: number;
    is_completed: boolean;
    completed_at: string | null;
  } | null;
}

interface MandatoryCoursesData {
  courses: MandatoryCourse[];
  allCoursesCompleted: boolean;
  totalMandatoryCourses: number;
  completedMandatoryCourses: number;
  canAccessCatalog: boolean;
}

export default function MandatoryTrainingPage() {
  const [data, setData] = useState<MandatoryCoursesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    
    fetchMandatoryCourses();
  }, [isAuthenticated, router]);

  const fetchMandatoryCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mandatory-courses');
      
      if (!response.ok) {
        throw new Error('Failed to fetch mandatory courses');
      }

      const result = await response.json();
      setData(result);

      // Если все курсы завершены, перенаправляем на дашборд
      if (result.canAccessCatalog) {
        router.push('/dashboard');
      }
    } catch (err) {
      setError('Ошибка загрузки обязательных курсов');
      console.error('Error fetching mandatory courses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Загрузка...</h2>
          <p className="text-gray-600">Проверяем ваш прогресс</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Ошибка</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchMandatoryCourses}>
                Попробовать снова
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const completionPercentage = data ? Math.round((data.completedMandatoryCourses / data.totalMandatoryCourses) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Обязательное обучение</h1>
                <p className="text-sm text-gray-600">
                  Добро пожаловать, {user?.user_metadata?.name || user?.email}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Прогресс</p>
                <p className="text-lg font-semibold text-gray-900">
                  {data?.completedMandatoryCourses || 0} / {data?.totalMandatoryCourses || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lock className="h-6 w-6 text-orange-500" />
              <span>Требуется завершение обучения</span>
            </CardTitle>
            <CardDescription>
              Для доступа к каталогу AI-сервисов необходимо пройти все обязательные курсы
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Общий прогресс</span>
                  <span>{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-3" />
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{data?.totalMandatoryCourses || 0}</p>
                  <p className="text-sm text-gray-600">Всего курсов</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">{data?.completedMandatoryCourses || 0}</p>
                  <p className="text-sm text-gray-600">Завершено</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">
                    {(data?.totalMandatoryCourses || 0) - (data?.completedMandatoryCourses || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Осталось</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Courses List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">Обязательные курсы</h2>
          
          {data?.courses.map((course, index) => {
            const progress = course.user_progress;
            const isCompleted = progress?.is_completed;
            const progressPercentage = progress?.progress_percentage || 0;
            
            return (
              <Card key={course.id} className={`transition-all duration-200 ${
                isCompleted ? 'border-green-200 bg-green-50' : 'hover:shadow-md'
              }`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {isCompleted ? (
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                          </div>
                        )}
                        <CardTitle className={isCompleted ? 'text-green-800' : 'text-gray-900'}>
                          {course.title}
                        </CardTitle>
                      </div>
                      
                      <CardDescription className="mb-3">
                        {course.description}
                      </CardDescription>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Категория: {course.category}</span>
                        <span>Прогресс: {Math.round(progressPercentage)}%</span>
                      </div>
                      
                      {!isCompleted && progressPercentage > 0 && (
                        <div className="mt-3">
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <Button
                        onClick={() => router.push(`/courses/${course.id}`)}
                        variant={isCompleted ? "outline" : "default"}
                        className={isCompleted ? 'border-green-600 text-green-600 hover:bg-green-50' : ''}
                      >
                        {isCompleted ? (
                          'Просмотреть'
                        ) : progressPercentage > 0 ? (
                          <>
                            Продолжить
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        ) : (
                          <>
                            Начать курс
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* No courses message */}
        {!data?.courses.length && (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Нет обязательных курсов
              </h3>
              <p className="text-gray-600 mb-4">
                Для вас не назначены обязательные курсы
              </p>
              <Button onClick={() => router.push('/dashboard')}>
                Перейти в дашборд
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}