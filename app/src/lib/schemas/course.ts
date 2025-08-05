import { z } from 'zod';

export const courseSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().min(1, 'Описание обязательно').max(1000),
  category: z.string().min(1, 'Категория обязательна'),
  duration_minutes: z.number().min(1).max(10000),
  is_published: z.boolean().default(false),
  is_mandatory: z.boolean().default(false),
  mandatory_for_role: z.enum(['USER', 'ADMIN', 'ALL']).default('USER'),
});

export const lessonSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(1, 'Название урока обязательно').max(200),
  content: z.string().min(1, 'Содержание урока обязательно'),
  order_index: z.number().min(0),
  duration_minutes: z.number().min(1).max(1000),
  has_quiz: z.boolean().default(false),
});

export const quizSchema = z.object({
  lesson_id: z.string().uuid(),
  title: z.string().min(1, 'Название квиза обязательно').max(200),
  description: z.string().optional(),
  passing_score: z.number().min(0).max(100).default(80),
});

export const quizQuestionSchema = z.object({
  quiz_id: z.string().uuid(),
  question: z.string().min(1, 'Вопрос обязателен'),
  question_type: z.enum(['multiple_choice', 'single_choice', 'true_false', 'text']),
  options: z.array(z.string()).default([]),
  correct_answers: z.array(z.string()),
  explanation: z.string().optional(),
  order_index: z.number().min(0),
});

export const quizAttemptSchema = z.object({
  user_id: z.string().uuid(),
  quiz_id: z.string().uuid(),
  answers: z.record(z.array(z.string())),
  score: z.number().min(0),
  max_score: z.number().min(1),
  passed: z.boolean(),
});

export type CourseFormData = z.infer<typeof courseSchema>;
export type LessonFormData = z.infer<typeof lessonSchema>;
export type QuizFormData = z.infer<typeof quizSchema>;
export type QuizQuestionFormData = z.infer<typeof quizQuestionSchema>;
export type QuizAttemptFormData = z.infer<typeof quizAttemptSchema>;

// Backward compatibility
export const courseLessonSchema = lessonSchema;
export type CourseLessonFormData = LessonFormData;