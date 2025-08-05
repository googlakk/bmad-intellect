'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BookOpen, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle, 
  Clock,
  HelpCircle,
  AlertCircle,
  Loader2,
  FileText
} from 'lucide-react';
import { QuizComponent } from '@/components/courses/QuizComponent';

interface CourseLesson {
  id: string;
  title: string;
  content: string;
  order_index: number;
  duration_minutes: number;
  has_quiz: boolean;
  course_id: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  lessons: CourseLesson[];
}

interface LessonProgress {
  is_completed: boolean;
  completed_at: string | null;
  quiz_score: number | null;
  quiz_attempts: number;
}

export default function LessonPage({ 
  params 
}: { 
  params: { id: string; lessonId: string } 
}) {
  const [course, setCourse] = useState<Course | null>(null);
  const [lesson, setLesson] = useState<CourseLesson | null>(null);
  const [progress, setProgress] = useState<LessonProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }
    
    fetchLessonData();
  }, [params.id, params.lessonId, isAuthenticated, router]);

  const fetchLessonData = async () => {
    try {
      setLoading(true);
      
      // Получаем данные курса и урока
      const courseResponse = await fetch(`/api/courses/${params.id}`);
      if (!courseResponse.ok) {
        throw new Error('Course not found');
      }
      
      const courseData = await courseResponse.json();
      setCourse(courseData.course);
      
      const currentLesson = courseData.course.lessons?.find(
        (l: CourseLesson) => l.id === params.lessonId
      );
      
      if (!currentLesson) {
        throw new Error('Lesson not found');
      }
      
      setLesson(currentLesson);
      
      // Получаем прогресс урока
      const progressResponse = await fetch(`/api/lessons/${params.lessonId}/progress`);
      if (progressResponse.ok) {
        const progressData = await progressResponse.json();
        setProgress(progressData.progress);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки урока');
    } finally {
      setLoading(false);
    }
  };

  const markLessonComplete = async () => {
    if (!lesson || progress?.is_completed) return;
    
    setMarkingComplete(true);
    try {
      const response = await fetch(`/api/lessons/${lesson.id}/complete`, {
        method: 'POST',
      });
      
      if (response.ok) {
        setProgress(prev => ({
          ...prev!,
          is_completed: true,
          completed_at: new Date().toISOString(),
        }));
      }
    } catch (err) {
      console.error('Error marking lesson complete:', err);
    } finally {
      setMarkingComplete(false);
    }
  };

  const getNextLesson = (): CourseLesson | null => {
    if (!course || !lesson) return null;
    
    const sortedLessons = course.lessons.sort((a, b) => a.order_index - b.order_index);
    const currentIndex = sortedLessons.findIndex(l => l.id === lesson.id);
    
    return currentIndex < sortedLessons.length - 1 
      ? sortedLessons[currentIndex + 1] 
      : null;
  };

  const getPreviousLesson = (): CourseLesson | null => {
    if (!course || !lesson) return null;
    
    const sortedLessons = course.lessons.sort((a, b) => a.order_index - b.order_index);
    const currentIndex = sortedLessons.findIndex(l => l.id === lesson.id);
    
    return currentIndex > 0 
      ? sortedLessons[currentIndex - 1] 
      : null;
  };

  const onQuizComplete = (score: number, passed: boolean) => {
    setProgress(prev => ({
      ...prev!,
      is_completed: passed,
      completed_at: passed ? new Date().toISOString() : prev?.completed_at || null,
      quiz_score: score,
      quiz_attempts: (prev?.quiz_attempts || 0) + 1,
    }));
    
    if (passed) {
      setShowQuiz(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка урока...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson || !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Урок не найден</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push(`/courses/${params.id}`)}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              К курсу
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextLesson = getNextLesson();
  const previousLesson = getPreviousLesson();
  const canProceed = !lesson.has_quiz || progress?.is_completed;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href={`/courses/${params.id}`} 
                className="text-blue-600 hover:underline"
              >
                <ArrowLeft className="h-4 w-4 mr-2 inline" />
                {course.title}
              </Link>
              <span className="text-gray-500">|</span>
              <h1 className="text-xl font-bold text-gray-900">{lesson.title}</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              {progress?.is_completed && (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Завершено
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Lesson Info */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{lesson.title}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {lesson.duration_minutes} мин
                      </div>
                      {lesson.has_quiz && (
                        <div className="flex items-center">
                          <HelpCircle className="h-3 w-3 mr-1" />
                          Тест
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Lesson Content */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Содержание урока
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {lesson.content}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quiz Section */}
          {lesson.has_quiz && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <HelpCircle className="h-5 w-5 mr-2" />
                  Тест по уроку
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progress?.is_completed ? (
                  <div className="text-center py-6">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Тест пройден успешно!
                    </h3>
                    <p className="text-gray-600 mb-2">
                      Ваш результат: {progress.quiz_score}%
                    </p>
                    <p className="text-sm text-gray-500">
                      Попыток: {progress.quiz_attempts}
                    </p>
                  </div>
                ) : showQuiz ? (
                  <QuizComponent 
                    lessonId={lesson.id}
                    onComplete={onQuizComplete}
                    onCancel={() => setShowQuiz(false)}
                  />
                ) : (
                  <div className="text-center py-6">
                    <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Готовы пройти тест?
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Для завершения урока необходимо пройти тест
                    </p>
                    {progress?.quiz_attempts && progress.quiz_attempts > 0 && (
                      <p className="text-sm text-gray-500 mb-4">
                        Попыток: {progress.quiz_attempts}
                      </p>
                    )}
                    <Button onClick={() => setShowQuiz(true)}>
                      Начать тест
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Mark Complete Section */}
          {!lesson.has_quiz && !progress?.is_completed && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <Button 
                    onClick={markLessonComplete}
                    disabled={markingComplete}
                    size="lg"
                  >
                    {markingComplete && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Отметить как завершенный
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <div>
              {previousLesson ? (
                <Button 
                  variant="outline" 
                  asChild
                >
                  <Link href={`/courses/${params.id}/lessons/${previousLesson.id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Предыдущий урок
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" asChild>
                  <Link href={`/courses/${params.id}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    К курсу
                  </Link>
                </Button>
              )}
            </div>

            <div>
              {nextLesson ? (
                <Button 
                  asChild
                  disabled={!canProceed}
                >
                  <Link href={`/courses/${params.id}/lessons/${nextLesson.id}`}>
                    Следующий урок
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : canProceed ? (
                <Button asChild>
                  <Link href={`/courses/${params.id}`}>
                    Завершить курс
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button disabled>
                  Пройдите тест
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}