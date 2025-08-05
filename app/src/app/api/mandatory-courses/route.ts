import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Проверяем аутентификацию
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Получаем данные пользователя
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Получаем обязательные курсы для пользователя
    const { data: mandatoryCourses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_mandatory', true)
      .eq('is_published', true)
      .or(`mandatory_for_role.eq.${userData.role},mandatory_for_role.eq.ALL`);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Получаем прогресс пользователя по этим курсам отдельно
    let userProgress = [];
    if (mandatoryCourses && mandatoryCourses.length > 0) {
      const courseIds = mandatoryCourses.map(course => course.id);
      const { data: progressData } = await supabase
        .from('user_course_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .in('course_id', courseIds);
      
      userProgress = progressData || [];
    }

    // Объединяем курсы с прогрессом
    const coursesWithProgress = mandatoryCourses?.map(course => {
      const courseProgress = userProgress.find(p => p.course_id === course.id);
      return {
        ...course,
        user_progress: courseProgress || null
      };
    }) || [];

    // Проверяем, завершены ли все обязательные курсы
    const allCoursesCompleted = coursesWithProgress.every(course => 
      course.user_progress?.is_completed === true
    );

    // Получаем статистику
    const totalMandatoryCourses = coursesWithProgress.length;
    const completedMandatoryCourses = coursesWithProgress.filter(course => 
      course.user_progress?.is_completed === true
    ).length;

    return NextResponse.json({
      courses: coursesWithProgress,
      allCoursesCompleted,
      totalMandatoryCourses,
      completedMandatoryCourses,
      canAccessCatalog: allCoursesCompleted,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch mandatory courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { courseId, userIds } = body;

    if (!courseId || !Array.isArray(userIds)) {
      return NextResponse.json(
        { error: 'Course ID and user IDs are required' },
        { status: 400 }
      );
    }

    // Назначаем обязательный курс пользователям
    const assignments = userIds.map(userId => ({
      user_id: userId,
      course_id: courseId,
    }));

    const { data, error } = await supabase
      .from('user_mandatory_courses')
      .upsert(assignments, { onConflict: 'user_id,course_id' })
      .select();

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json({ assignments: data }, { status: 201 });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Failed to assign mandatory courses' },
      { status: 500 }
    );
  }
}