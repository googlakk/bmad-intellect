export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  is_published: boolean;
  is_mandatory: boolean;
  mandatory_for_role: 'USER' | 'ADMIN' | 'ALL';
  created_at: string;
  updated_at: string;
}

export interface CourseLesson {
  id: string;
  course_id: string;
  title: string;
  content: string;
  order_index: number;
  duration_minutes: number;
  has_quiz: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCourseProgress {
  id: string;
  user_id: string;
  course_id: string;
  completed_lessons: string[];
  passed_quizzes: string[];
  progress_percentage: number;
  all_quizzes_passed: boolean;
  started_at: string;
  completed_at?: string;
}

export interface LessonQuiz {
  id: string;
  lesson_id: string;
  title: string;
  description?: string;
  passing_score: number;
  created_at: string;
  updated_at: string;
}

export type QuestionType = 'multiple_choice' | 'single_choice' | 'true_false' | 'text';

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question: string;
  question_type: QuestionType;
  options: string[];
  correct_answers: string[];
  explanation?: string;
  order_index: number;
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  answers: Record<string, string[]>;
  score: number;
  max_score: number;
  passed: boolean;
  completed_at: string;
}

export interface UserMandatoryCourse {
  id: string;
  user_id: string;
  course_id: string;
  assigned_at: string;
  completed_at?: string;
  is_completed: boolean;
}

export type CreateCourseInput = Omit<Course, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCourseInput = Partial<CreateCourseInput>;
export type CreateCourseLessonInput = Omit<CourseLesson, 'id' | 'created_at' | 'updated_at'>;
export type CreateQuizInput = Omit<LessonQuiz, 'id' | 'created_at' | 'updated_at'>;
export type CreateQuizQuestionInput = Omit<QuizQuestion, 'id' | 'created_at'>;
export type CreateQuizAttemptInput = Omit<QuizAttempt, 'id' | 'completed_at'>;