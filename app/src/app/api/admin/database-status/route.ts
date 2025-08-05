import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Проверяем аутентификацию и права администратора
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userData?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Получаем статистику всех таблиц
    const statistics = {};

    // Пользователи
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Курсы
    const { count: coursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true });

    // Опубликованные курсы
    const { count: publishedCoursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_published', true);

    // Обязательные курсы
    const { count: mandatoryCoursesCount } = await supabase
      .from('courses')
      .select('*', { count: 'exact', head: true })
      .eq('is_mandatory', true);

    // Уроки
    const { count: lessonsCount } = await supabase
      .from('course_lessons')
      .select('*', { count: 'exact', head: true });

    // Тесты
    const { count: quizzesCount } = await supabase
      .from('lesson_quizzes')
      .select('*', { count: 'exact', head: true });

    // Прогресс курсов
    const { count: courseProgressCount } = await supabase
      .from('user_course_progress')
      .select('*', { count: 'exact', head: true });

    // Прогресс уроков
    const { count: lessonProgressCount } = await supabase
      .from('user_lesson_progress')
      .select('*', { count: 'exact', head: true });

    // Обязательные курсы пользователей
    const { count: mandatoryAssignmentsCount } = await supabase
      .from('user_mandatory_courses')
      .select('*', { count: 'exact', head: true });

    // Попытки тестов
    const { count: quizAttemptsCount } = await supabase
      .from('quiz_attempts')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      statistics: {
        users: usersCount || 0,
        courses: coursesCount || 0,
        publishedCourses: publishedCoursesCount || 0,
        mandatoryCourses: mandatoryCoursesCount || 0,
        lessons: lessonsCount || 0,
        quizzes: quizzesCount || 0,
        courseProgress: courseProgressCount || 0,
        lessonProgress: lessonProgressCount || 0,
        mandatoryAssignments: mandatoryAssignmentsCount || 0,
        quizAttempts: quizAttemptsCount || 0,
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch database status' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const supabase = await createClient();
    
    // Проверяем аутентификацию и права администратора
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userData?.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Очищаем данные в правильном порядке (с учетом foreign key constraints)
    const cleanupResults = {};

    // 1. Quiz attempts (зависят от quiz)
    const { error: quizAttemptsError } = await supabase
      .from('quiz_attempts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Удаляем все записи

    cleanupResults.quizAttempts = quizAttemptsError ? 'failed' : 'success';

    // 2. User lesson progress
    const { error: lessonProgressError } = await supabase
      .from('user_lesson_progress')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    cleanupResults.lessonProgress = lessonProgressError ? 'failed' : 'success';

    // 3. User course progress
    const { error: courseProgressError } = await supabase
      .from('user_course_progress')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    cleanupResults.courseProgress = courseProgressError ? 'failed' : 'success';

    // 4. User mandatory courses
    const { error: mandatoryError } = await supabase
      .from('user_mandatory_courses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    cleanupResults.mandatoryAssignments = mandatoryError ? 'failed' : 'success';

    // 5. Quiz questions (зависят от quiz)
    const { error: questionsError } = await supabase
      .from('quiz_questions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    cleanupResults.quizQuestions = questionsError ? 'failed' : 'success';

    // 6. Lesson quizzes (зависят от lessons)
    const { error: quizzesError } = await supabase
      .from('lesson_quizzes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    cleanupResults.quizzes = quizzesError ? 'failed' : 'success';

    // 7. Course lessons (зависят от courses)
    const { error: lessonsError } = await supabase
      .from('course_lessons')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    cleanupResults.lessons = lessonsError ? 'failed' : 'success';

    // 8. Courses
    const { error: coursesError } = await supabase
      .from('courses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    cleanupResults.courses = coursesError ? 'failed' : 'success';

    // НЕ удаляем пользователей, так как они нужны для работы системы

    return NextResponse.json({
      message: 'Database cleanup completed',
      results: cleanupResults
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup database' },
      { status: 500 }
    );
  }
}