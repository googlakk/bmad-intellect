'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Trash2, 
  RefreshCw, 
  AlertTriangle,
  Users,
  BookOpen,
  FileText,
  HelpCircle,
  TrendingUp,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface DatabaseStats {
  users: number;
  courses: number;
  publishedCourses: number;
  mandatoryCourses: number;
  lessons: number;
  quizzes: number;
  courseProgress: number;
  lessonProgress: number;
  mandatoryAssignments: number;
  quizAttempts: number;
}

export default function DatabaseStatusPage() {
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.user_metadata?.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.user_metadata?.role === 'ADMIN') {
      fetchStats();
    }
  }, [isAuthenticated, user]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/database-status');
      if (response.ok) {
        const data = await response.json();
        setStats(data.statistics);
      } else {
        throw new Error('Failed to fetch database statistics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки статистики');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    if (!confirm('Вы уверены, что хотите очистить базу данных? Это действие нельзя отменить!')) {
      return;
    }

    setCleaning(true);
    setCleanupResults(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/database-status', {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        setCleanupResults(data.results);
        
        // Обновляем статистику после очистки
        setTimeout(() => {
          fetchStats();
        }, 1000);
      } else {
        throw new Error('Failed to cleanup database');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка очистки базы данных');
    } finally {
      setCleaning(false);
    }
  };

  if (isLoading || !isAuthenticated || user?.user_metadata?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
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
              <Link href="/admin" className="text-blue-600 hover:underline">
                ← Админка
              </Link>
              <span className="text-gray-500">|</span>
              <h1 className="text-2xl font-bold text-gray-900">База данных</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={fetchStats}
                disabled={loading}
                variant="outline"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </Button>
              
              <Button 
                onClick={handleCleanup}
                disabled={cleaning || loading}
                variant="destructive"
              >
                {cleaning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Trash2 className="h-4 w-4 mr-2" />
                Очистить данные
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          )}

          {cleanupResults && (
            <Card className="border-green-200">
              <CardHeader>
                <CardTitle className="text-green-800">Результаты очистки</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(cleanupResults).map(([key, status]) => (
                    <div key={key} className="flex items-center space-x-2">
                      {status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm">{key}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Database Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-6 w-6 mr-2 text-blue-600" />
                Статистика базы данных
              </CardTitle>
              <CardDescription>
                Текущее состояние всех таблиц в базе данных
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading || !stats ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Загрузка статистики...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* Пользователи */}
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-blue-800">{stats.users}</p>
                    <p className="text-sm text-blue-600">Пользователи</p>
                  </div>

                  {/* Курсы */}
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <BookOpen className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-800">{stats.courses}</p>
                    <p className="text-sm text-green-600">Все курсы</p>
                  </div>

                  {/* Опубликованные курсы */}
                  <div className="text-center p-4 bg-emerald-50 rounded-lg">
                    <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-emerald-800">{stats.publishedCourses}</p>
                    <p className="text-sm text-emerald-600">Опубликованы</p>
                  </div>

                  {/* Обязательные курсы */}
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-800">{stats.mandatoryCourses}</p>
                    <p className="text-sm text-red-600">Обязательные</p>
                  </div>

                  {/* Уроки */}
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-purple-800">{stats.lessons}</p>
                    <p className="text-sm text-purple-600">Уроки</p>
                  </div>

                  {/* Тесты */}
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <HelpCircle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-orange-800">{stats.quizzes}</p>
                    <p className="text-sm text-orange-600">Тесты</p>
                  </div>

                  {/* Прогресс курсов */}
                  <div className="text-center p-4 bg-cyan-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-cyan-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-cyan-800">{stats.courseProgress}</p>
                    <p className="text-sm text-cyan-600">Прогресс курсов</p>
                  </div>

                  {/* Прогресс уроков */}
                  <div className="text-center p-4 bg-indigo-50 rounded-lg">
                    <TrendingUp className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-indigo-800">{stats.lessonProgress}</p>
                    <p className="text-sm text-indigo-600">Прогресс уроков</p>
                  </div>

                  {/* Назначения */}
                  <div className="text-center p-4 bg-pink-50 rounded-lg">
                    <Users className="h-8 w-8 text-pink-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-pink-800">{stats.mandatoryAssignments}</p>
                    <p className="text-sm text-pink-600">Назначения</p>
                  </div>

                  {/* Попытки тестов */}
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <HelpCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-yellow-800">{stats.quizAttempts}</p>
                    <p className="text-sm text-yellow-600">Попытки тестов</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Warning */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-yellow-800 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Внимание
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-yellow-800">
                <p>• Очистка данных удаляет ВСЕ курсы, уроки, тесты и прогресс пользователей</p>
                <p>• Пользовательские аккаунты НЕ удаляются</p>
                <p>• Это действие нельзя отменить</p>
                <p>• Используйте только для отладки или сброса системы</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}