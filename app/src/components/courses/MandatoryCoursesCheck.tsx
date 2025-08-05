'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, BookOpen, CheckCircle, Lock } from 'lucide-react';

interface MandatoryCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  user_progress?: Array<{
    progress_percentage: number;
    all_quizzes_passed: boolean;
    completed_at: string | null;
  }>;
}

interface MandatoryCoursesData {
  courses: MandatoryCourse[];
  allCoursesCompleted: boolean;
  totalMandatoryCourses: number;
  completedMandatoryCourses: number;
  canAccessCatalog: boolean;
}

interface MandatoryCoursesCheckProps {
  children: React.ReactNode;
  requireCompletion?: boolean;
}

export function MandatoryCoursesCheck({ children, requireCompletion = false }: MandatoryCoursesCheckProps) {
  const [data, setData] = useState<MandatoryCoursesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setLoading(false);
      return;
    }

    fetchMandatoryCourses();
  }, [isAuthenticated, user]);

  const fetchMandatoryCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mandatory-courses');
      
      if (!response.ok) {
        throw new Error('Failed to fetch mandatory courses');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError('Ошибка загрузки обязательных курсов');
      console.error('Error fetching mandatory courses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
            <Button 
              onClick={fetchMandatoryCourses}
              className="w-full mt-4"
              variant="outline"
            >
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Если требуется завершение курсов и они не завершены
  if (requireCompletion && data && !data.canAccessCatalog) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-8">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <Lock className="h-12 w-12 text-orange-500" />
                </div>
                <CardTitle className="text-2xl">Доступ ограничен</CardTitle>
                <CardDescription>
                  Для доступа к AI каталогу необходимо завершить все обязательные курсы
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {data.completedMandatoryCourses} / {data.totalMandatoryCourses}
                  </div>
                  <div className="text-gray-600">Курсов завершено</div>
                </div>

                <div className="space-y-4">
                  {data.courses.map((course) => {
                    const progress = course.user_progress?.[0];
                    const isCompleted = progress?.completed_at;
                    
                    return (
                      <div
                        key={course.id}
                        className={`flex items-center justify-between p-4 rounded-lg border ${
                          isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <BookOpen className="h-5 w-5 text-gray-500" />
                          )}
                          <div>
                            <h3 className="font-medium text-gray-900">{course.title}</h3>
                            <p className="text-sm text-gray-600">{course.category}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {progress && (
                            <div className="text-sm text-gray-600">
                              {Math.round(progress.progress_percentage)}%
                            </div>
                          )}
                          <Button
                            onClick={() => router.push(`/courses/${course.id}`)}
                            size="sm"
                            variant={isCompleted ? "outline" : "default"}
                          >
                            {isCompleted ? 'Просмотреть' : 'Начать курс'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-8 text-center">
                  <Button
                    onClick={() => router.push('/learning-center')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Перейти к обучению
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Если есть незавершенные курсы, показываем уведомление
  if (data && !data.canAccessCatalog) {
    return (
      <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-orange-400 mr-3" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-orange-800">
              Обязательные курсы не завершены
            </h3>
            <p className="text-sm text-orange-700 mt-1">
              Завершите {data.totalMandatoryCourses - data.completedMandatoryCourses} из {data.totalMandatoryCourses} обязательных курсов для полного доступа к платформе.
            </p>
          </div>
          <Button
            onClick={() => router.push('/learning-center')}
            size="sm"
            className="ml-4"
          >
            Продолжить обучение
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}