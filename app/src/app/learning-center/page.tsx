'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { BookOpen, Clock, Users, ArrowLeft, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  is_published: boolean;
}

export default function LearningCenterPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    
    fetchCourses();
  }, [isAuthenticated, router]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/courses');
      if (!response.ok) {
        throw new Error('Failed to fetch courses');
      }
      
      const data = await response.json();
      setCourses(data.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки курсов');
      console.error('Error fetching courses:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Загрузка курсов...</p>
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
              <Link href="/dashboard" className="text-blue-600 hover:underline">
                <ArrowLeft className="h-4 w-4 mr-2 inline" />
                Дашборд
              </Link>
              <span className="text-gray-500">|</span>
              <h1 className="text-2xl font-bold text-gray-900">Центр обучения</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchCourses}
                disabled={loading}
                className="flex items-center text-sm text-blue-600 hover:text-blue-800"
              >
                <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Обновить
              </button>
              <span className="text-sm text-gray-600">
                {user?.user_metadata?.name || user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Доступные курсы</h2>
          <p className="text-gray-600">
            Изучайте новые навыки и развивайтесь профессионально
          </p>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Курсы не найдены</h3>
            <p className="text-gray-600 mb-4">
              В данный момент нет доступных курсов для изучения
            </p>
            {user?.user_metadata?.role === 'ADMIN' && (
              <Link
                href="/admin/courses/create"
                className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 inline-block"
              >
                Создать первый курс
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 p-6"
              >
                <div className="flex items-center mb-3">
                  <BookOpen className="h-5 w-5 text-blue-600 mr-2" />
                  <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {course.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {course.description}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {Math.floor(course.duration_minutes / 60)}ч {course.duration_minutes % 60}м
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-1" />
                    Для всех
                  </div>
                </div>
                
                <Link
                  href={`/courses/${course.id}`}
                  className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-center"
                >
                  Начать курс
                </Link>
              </div>
            ))}
          </div>
        )}

        {user?.user_metadata?.role === 'ADMIN' && courses.length > 0 && (
          <div className="mt-12 text-center">
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Управление курсами
              </h2>
              <p className="text-gray-600 mb-6">
                Создавайте новые курсы и управляйте существующими
              </p>
              <Link
                href="/admin/courses"
                className="bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 transition-colors duration-200 inline-block"
              >
                Админ панель курсов
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}