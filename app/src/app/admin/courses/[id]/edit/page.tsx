'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/stores/authStore';
import { courseSchema, lessonSchema, type CourseFormData, type LessonFormData } from '@/lib/schemas/course';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  ArrowLeft, 
  Save, 
  Loader2,
  Plus,
  Edit,
  Trash2,
  GripVertical,
  FileText,
  HelpCircle,
  Eye,
  EyeOff
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  is_published: boolean;
  is_mandatory: boolean;
  mandatory_for_role: string;
}

interface CourseLesson {
  id: string;
  title: string;
  content: string;
  order_index: number;
  duration_minutes: number;
  has_quiz: boolean;
}

export default function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const courseForm = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
  });

  const lessonForm = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      course_id: resolvedParams.id,
      title: '',
      content: '',
      order_index: 0,
      duration_minutes: 30,
      has_quiz: false,
    },
  });

  useEffect(() => {
    if (!isAuthenticated || user?.user_metadata?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
    
    fetchCourse();
  }, [resolvedParams.id, isAuthenticated, user, router]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/courses/${resolvedParams.id}`);
      if (!response.ok) {
        throw new Error('Course not found');
      }
      
      const data = await response.json();
      setCourse(data.course);
      setLessons(data.course.lessons || []);
      
      // Заполняем форму данными курса
      courseForm.reset({
        title: data.course.title,
        description: data.course.description,
        category: data.course.category,
        duration_minutes: data.course.duration_minutes,
        is_published: data.course.is_published,
        is_mandatory: data.course.is_mandatory,
        mandatory_for_role: data.course.mandatory_for_role as 'USER' | 'ADMIN' | 'ALL',
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки курса');
    } finally {
      setLoading(false);
    }
  };

  const saveCourse = async (data: CourseFormData) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/courses/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchCourse(); // Обновляем данные
      } else {
        const result = await response.json();
        setError(result.error || 'Ошибка сохранения курса');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setSaving(false);
    }
  };

  const saveLesson = async (data: LessonFormData) => {
    try {
      const method = editingLesson ? 'PUT' : 'POST';
      const url = editingLesson 
        ? `/api/lessons/${editingLesson.id}` 
        : '/api/lessons';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          order_index: editingLesson ? editingLesson.order_index : lessons.length,
        }),
      });

      if (response.ok) {
        fetchCourse(); // Обновляем данные
        setShowLessonForm(false);
        setEditingLesson(null);
        lessonForm.reset();
      } else {
        const result = await response.json();
        setError(result.error || 'Ошибка сохранения урока');
      }
    } catch (err) {
      setError('Ошибка сети');
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот урок?')) {
      return;
    }

    try {
      const response = await fetch(`/api/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchCourse(); // Обновляем данные
      } else {
        const result = await response.json();
        setError(result.error || 'Ошибка удаления урока');
      }
    } catch (err) {
      setError('Ошибка сети');
    }
  };

  const startEditLesson = (lesson: CourseLesson) => {
    setEditingLesson(lesson);
    lessonForm.reset({
      course_id: resolvedParams.id,
      title: lesson.title,
      content: lesson.content,
      order_index: lesson.order_index,
      duration_minutes: lesson.duration_minutes,
      has_quiz: lesson.has_quiz,
    });
    setShowLessonForm(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка курса...</p>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Курс не найден</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Назад
            </Button>
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
              <h1 className="text-2xl font-bold text-gray-900">Редактирование курса</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="outline" asChild>
                <Link href={`/courses/${resolvedParams.id}`}>
                  <Eye className="h-4 w-4 mr-2" />
                  Просмотр
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setError(null)}
                className="mt-2"
              >
                Закрыть
              </Button>
            </div>
          )}

          {/* Course Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
                Основная информация
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={courseForm.handleSubmit(saveCourse)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Название курса</label>
                    <Input {...courseForm.register('title')} />
                    {courseForm.formState.errors.title && (
                      <p className="text-sm text-red-600">{courseForm.formState.errors.title.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Категория</label>
                    <Input {...courseForm.register('category')} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Описание</label>
                  <textarea
                    rows={3}
                    {...courseForm.register('description')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Длительность (мин)</label>
                    <Input 
                      type="number" 
                      {...courseForm.register('duration_minutes', { valueAsNumber: true })} 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Статус</label>
                    <div className="flex items-center space-x-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...courseForm.register('is_published')}
                          className="mr-2"
                        />
                        Опубликован
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          {...courseForm.register('is_mandatory')}
                          className="mr-2"
                        />
                        Обязательный
                      </label>
                    </div>
                  </div>

                  {courseForm.watch('is_mandatory') && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Для роли</label>
                      <select
                        {...courseForm.register('mandatory_for_role')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="USER">Пользователи</option>
                        <option value="ADMIN">Администраторы</option>
                        <option value="ALL">Все роли</option>
                      </select>
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Save className="mr-2 h-4 w-4" />
                  Сохранить курс
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lessons */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <FileText className="h-6 w-6 mr-2 text-green-600" />
                  Уроки курса ({lessons.length})
                </CardTitle>
                <Button 
                  onClick={() => {
                    setEditingLesson(null);
                    lessonForm.reset({
                      course_id: resolvedParams.id,
                      title: '',
                      content: '',
                      order_index: lessons.length,
                      duration_minutes: 30,
                      has_quiz: false,
                    });
                    setShowLessonForm(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить урок
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Lesson Form */}
              {showLessonForm && (
                <Card className="mb-6 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {editingLesson ? 'Редактирование урока' : 'Новый урок'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={lessonForm.handleSubmit(saveLesson)} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Название урока</label>
                          <Input {...lessonForm.register('title')} />
                          {lessonForm.formState.errors.title && (
                            <p className="text-sm text-red-600">{lessonForm.formState.errors.title.message}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Длительность (мин)</label>
                          <Input 
                            type="number" 
                            {...lessonForm.register('duration_minutes', { valueAsNumber: true })} 
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Содержание урока</label>
                        <textarea
                          rows={6}
                          placeholder="Введите содержание урока (поддерживается Markdown)"
                          {...lessonForm.register('content')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {lessonForm.formState.errors.content && (
                          <p className="text-sm text-red-600">{lessonForm.formState.errors.content.message}</p>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          {...lessonForm.register('has_quiz')}
                          className="rounded border-gray-300"
                        />
                        <label className="text-sm font-medium">Добавить тест к уроку</label>
                      </div>

                      <div className="flex gap-4">
                        <Button type="submit">
                          <Save className="mr-2 h-4 w-4" />
                          {editingLesson ? 'Обновить урок' : 'Создать урок'}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowLessonForm(false);
                            setEditingLesson(null);
                            lessonForm.reset();
                          }}
                        >
                          Отмена
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              {/* Lessons List */}
              {lessons.length > 0 ? (
                <div className="space-y-3">
                  {lessons
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-3">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{lesson.title}</h4>
                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                              <span>{lesson.duration_minutes} мин</span>
                              {lesson.has_quiz && (
                                <div className="flex items-center">
                                  <HelpCircle className="h-3 w-3 mr-1" />
                                  <span>Тест</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => startEditLesson(lesson)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteLesson(lesson.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Нет уроков</h3>
                  <p className="text-gray-600 mb-4">Добавьте первый урок для этого курса</p>
                  <Button onClick={() => setShowLessonForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Добавить урок
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}