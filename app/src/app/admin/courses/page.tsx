'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Plus, Search, Edit, Eye, Trash2, Users, CheckCircle, XCircle } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  is_published: boolean;
  is_mandatory: boolean;
  mandatory_for_role: string;
  created_at: string;
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.user_metadata?.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.user_metadata?.role === 'ADMIN') {
      fetchCourses();
    }
  }, [isAuthenticated, user]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/courses');
      
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePublished = async (courseId: string, isPublished: boolean) => {
    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_published: !isPublished }),
      });

      if (response.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error('Error updating course:', error);
    }
  };

  const deleteCourse = async (courseId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот курс?')) {
      return;
    }

    try {
      const response = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCourses();
      }
    } catch (error) {
      console.error('Error deleting course:', error);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              <h1 className="text-2xl font-bold text-gray-900">Управление курсами</h1>
            </div>
            
            <Button asChild>
              <Link href="/admin/courses/create">
                <Plus className="h-4 w-4 mr-2" />
                Создать курс
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Поиск курсов по названию или категории..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{courses.length}</p>
                  <p className="text-sm text-gray-600">Всего курсов</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.is_published).length}
                  </p>
                  <p className="text-sm text-gray-600">Опубликованных</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => c.is_mandatory).length}
                  </p>
                  <p className="text-sm text-gray-600">Обязательных</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <XCircle className="h-8 w-8 text-gray-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {courses.filter(c => !c.is_published).length}
                  </p>
                  <p className="text-sm text-gray-600">Черновиков</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Courses List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка курсов...</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle className="text-xl">{course.title}</CardTitle>
                        <div className="flex space-x-2">
                          {course.is_published ? (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              Опубликован
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                              Черновик
                            </span>
                          )}
                          {course.is_mandatory && (
                            <span className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                              Обязательный
                            </span>
                          )}
                        </div>
                      </div>
                      <CardDescription className="mb-2">
                        {course.description}
                      </CardDescription>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Категория: {course.category}</span>
                        <span>Длительность: {Math.floor(course.duration_minutes / 60)}ч {course.duration_minutes % 60}м</span>
                        {course.is_mandatory && (
                          <span>Для: {course.mandatory_for_role}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/courses/${course.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          Просмотр
                        </Link>
                      </Button>
                      
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/admin/courses/${course.id}/edit`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Редактировать
                        </Link>
                      </Button>
                      
                      <Button
                        size="sm"
                        variant={course.is_published ? "secondary" : "default"}
                        onClick={() => togglePublished(course.id, course.is_published)}
                      >
                        {course.is_published ? 'Скрыть' : 'Опубликовать'}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteCourse(course.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}

            {filteredCourses.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'Курсы не найдены' : 'Нет курсов'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm 
                      ? 'Попробуйте изменить поисковый запрос'
                      : 'Создайте первый курс для начала работы'
                    }
                  </p>
                  {!searchTerm && (
                    <Button asChild>
                      <Link href="/admin/courses/create">
                        <Plus className="h-4 w-4 mr-2" />
                        Создать курс
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}