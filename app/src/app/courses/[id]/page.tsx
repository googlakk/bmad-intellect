'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  Play, 
  CheckCircle, 
  Lock, 
  Clock, 
  ArrowLeft, 
  ArrowRight,
  FileText,
  HelpCircle
} from 'lucide-react';

interface CourseLesson {
  id: string;
  title: string;
  content: string;
  order_index: number;
  duration_minutes: number;
  has_quiz: boolean;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  is_published: boolean;
  is_mandatory: boolean;
  lessons: CourseLesson[];
}

interface LessonProgress {
  lesson_id: string;
  is_completed: boolean;
  quiz_score: number | null;
  quiz_attempts: number;
}

interface UserProgress {
  progress_percentage: number;
  is_completed: boolean;
  lessons_completed: number;
  total_lessons: number;
  completed_at: string | null;
  lesson_progress: LessonProgress[];
}

export default function CoursePage({ params }: { params: { id: string } }) {
  const [course, setCourse] = useState<Course | null>(null);
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    
    fetchCourse();
  }, [params.id, isAuthenticated, router]);

  const fetchCourse = async () => {
    try {
      setLoading(true);
      
      // Получаем информацию о курсе
      const courseResponse = await fetch(`/api/courses/${params.id}`);
      if (!courseResponse.ok) {
        throw new Error('Course not found');
      }
      
      const courseData = await courseResponse.json();
      setCourse(courseData.course);

      // Получаем прогресс пользователя
      const progressResponse = await fetch(`/api/courses/${params.id}/progress`);
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setUserProgress(progressData.progress);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки курса');
    } finally {
      setLoading(false);
    }
  };

  const isLessonCompleted = (lessonId: string) => {
    const lessonProgress = userProgress?.lesson_progress.find(p => p.lesson_id === lessonId);
    return lessonProgress?.is_completed || false;
  };

  const getLessonProgress = (lessonId: string) => {
    return userProgress?.lesson_progress.find(p => p.lesson_id === lessonId);
  };

  const getNextIncompleteLesson = () => {
    if (!course) return null;
    
    const sortedLessons = [...course.lessons].sort((a, b) => a.order_index - b.order_index);
    
    for (const lesson of sortedLessons) {
      if (!isLessonCompleted(lesson.id)) {
        return lesson;
      }
    }
    
    return null;
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

  if (error || !course) {
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

  const totalLessons = course.lessons.length;
  const completedLessons = userProgress?.lessons_completed || 0;
  const progressPercentage = userProgress?.progress_percentage || 0;
  const nextLesson = getNextIncompleteLesson();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                <p className="text-sm text-gray-600">{course.category}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {course.is_mandatory && (
                <Badge variant="destructive">Обязательный</Badge>
              )}
              <div className="text-right">
                <p className="text-sm text-gray-600">Прогресс</p>
                <p className="text-lg font-semibold text-gray-900">
                  {completedLessons} / {totalLessons}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Info */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>О курсе</CardTitle>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {Math.floor(course.duration_minutes / 60)}ч {course.duration_minutes % 60}м
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {totalLessons} уроков
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Прогресс курса</span>
                    <span>{Math.round(progressPercentage)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>
              </CardContent>
            </Card>

            {/* Continue Learning */}
            {nextLesson && (
              <Card className="mb-6 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-800">Продолжить обучение</CardTitle>
                  <CardDescription className="text-blue-600">
                    Следующий урок: {nextLesson.title}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    onClick={() => router.push(`/courses/${course.id}/lessons/${nextLesson.id}`)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Начать урок
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Lessons List */}
            <Card>
              <CardHeader>
                <CardTitle>Уроки курса</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {course.lessons
                    .sort((a, b) => a.order_index - b.order_index)
                    .map((lesson, index) => {
                      const isCompleted = isLessonCompleted(lesson.id);
                      const lessonProgress = getLessonProgress(lesson.id);
                      const sortedLessons = [...course.lessons].sort((a, b) => a.order_index - b.order_index);
                      const canAccess = index === 0 || isLessonCompleted(sortedLessons[index - 1]?.id);

                      return (
                        <div
                          key={lesson.id}
                          className={`flex items-center justify-between p-4 rounded-lg border ${
                            isCompleted
                              ? 'border-green-200 bg-green-50'
                              : canAccess
                              ? 'border-gray-200 bg-white hover:bg-gray-50'
                              : 'border-gray-100 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full">
                              {isCompleted ? (
                                <CheckCircle className="h-6 w-6 text-green-600" />
                              ) : !canAccess ? (
                                <Lock className="h-5 w-5 text-gray-400" />
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">{index + 1}</span>
                                </div>
                              )}
                            </div>
                            
                            <div className="flex-1">
                              <h3 className={`font-medium ${
                                !canAccess ? 'text-gray-400' : isCompleted ? 'text-green-800' : 'text-gray-900'
                              }`}>
                                {lesson.title}
                              </h3>
                              <div className="flex items-center space-x-3 text-sm text-gray-500">
                                <span>{lesson.duration_minutes} мин</span>
                                {lesson.has_quiz && (
                                  <div className="flex items-center">
                                    <HelpCircle className="h-3 w-3 mr-1" />
                                    <span>Тест</span>
                                    {lessonProgress?.quiz_score && (
                                      <span className="ml-1">({lessonProgress.quiz_score}%)</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <Button
                            variant={isCompleted ? "outline" : "default"}
                            size="sm"
                            disabled={!canAccess}
                            onClick={() => router.push(`/courses/${course.id}/lessons/${lesson.id}`)}
                          >
                            {isCompleted ? 'Повторить' : canAccess ? 'Начать' : 'Заблокировано'}
                            {canAccess && <ArrowRight className="ml-2 h-4 w-4" />}
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-blue-600">{Math.round(progressPercentage)}%</p>
                    <p className="text-sm text-gray-600">Завершено</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{completedLessons}</p>
                      <p className="text-xs text-gray-600">Уроков пройдено</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{totalLessons - completedLessons}</p>
                      <p className="text-xs text-gray-600">Осталось</p>
                    </div>
                  </div>

                  {userProgress?.completed_at && (
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-green-800">Курс завершен!</p>
                      <p className="text-xs text-green-600">
                        {new Date(userProgress.completed_at).toLocaleDateString('ru-RU')}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}