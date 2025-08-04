# AI-PATTERNS.md

This file contains code patterns and examples for AI assistants to follow.
These patterns ensure consistency across the Next.js/React/Supabase codebase.

## Next.js App Router Patterns

### Page Component Pattern
```tsx
// app/courses/page.tsx
import { Metadata } from 'next';
import { CoursesContainer } from '@/components/courses/CoursesContainer';

export const metadata: Metadata = {
  title: 'Курсы | Интеллект',
  description: 'Обучающие курсы и материалы',
};

export default function CoursesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <CoursesContainer />
    </main>
  );
}
```

### Layout Pattern
```tsx
// app/layout.tsx
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
```

### API Route Pattern
```tsx
// app/api/courses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { courseSchema } from '@/lib/schemas/course';

export async function GET() {
  try {
    const supabase = createClient();
    
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ courses });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch courses' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = courseSchema.parse(body);
    
    const supabase = createClient();
    
    const { data: course, error } = await supabase
      .from('courses')
      .insert(validatedData)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ course }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create course' },
      { status: 500 }
    );
  }
}
```

## React Component Patterns

### Typed Component with Props
```tsx
// components/course/CourseCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Course } from '@/types/course';

interface CourseCardProps {
  course: Course;
  onEnroll?: (courseId: string) => void;
  className?: string;
}

export function CourseCard({ course, onEnroll, className }: CourseCardProps) {
  return (
    <Card className={`hover:shadow-lg transition-shadow ${className}`}>
      <CardHeader>
        <CardTitle className="line-clamp-2">{course.title}</CardTitle>
        <Badge variant="secondary">{course.category}</Badge>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-3 mb-4">
          {course.description}
        </p>
        {onEnroll && (
          <button
            onClick={() => onEnroll(course.id)}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md transition-colors"
          >
            Записаться на курс
          </button>
        )}
      </CardContent>
    </Card>
  );
}
```

### Container Component with Data Fetching
```tsx
// components/courses/CoursesContainer.tsx
'use client';

import { useCourses } from '@/hooks/useCourses';
import { CourseCard } from './CourseCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ErrorMessage } from '@/components/ui/error-message';

export function CoursesContainer() {
  const { data: courses, isLoading, error, refetch } = useCourses();

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage 
        title="Ошибка загрузки курсов"
        message="Попробуйте обновить страницу"
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Курсы</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses?.map((course) => (
          <CourseCard key={course.id} course={course} />
        ))}
      </div>
    </div>
  );
}
```

## React Query (TanStack Query) Patterns

### Custom Hook for Data Fetching
```tsx
// hooks/useCourses.ts
import { useQuery } from '@tanstack/react-query';
import { coursesApi } from '@/lib/api/courses';
import { Course } from '@/types/course';

export function useCourses() {
  return useQuery({
    queryKey: ['courses'],
    queryFn: coursesApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ['course', id],
    queryFn: () => coursesApi.getById(id),
    enabled: !!id,
  });
}
```

### Mutation Hook Pattern
```tsx
// hooks/useCreateCourse.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { coursesApi } from '@/lib/api/courses';
import { toast } from '@/hooks/use-toast';

export function useCreateCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: coursesApi.create,
    onSuccess: (newCourse) => {
      // Invalidate and refetch courses
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      
      toast({
        title: 'Успех',
        description: 'Курс создан успешно',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать курс',
        variant: 'destructive',
      });
    },
  });
}
```

## Supabase Integration Patterns

### Supabase Client Setup
```tsx
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server-side Supabase Client
```tsx
// lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
}
```

### API Layer Pattern
```tsx
// lib/api/courses.ts
import { createClient } from '@/lib/supabase/client';
import { Course, CreateCourseInput } from '@/types/course';

const supabase = createClient();

export const coursesApi = {
  async getAll(): Promise<Course[]> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getById(id: string): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(input: CreateCourseInput): Promise<Course> {
    const { data, error } = await supabase
      .from('courses')
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
```

## Zustand State Management Patterns

### Store Definition
```tsx
// stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,

      login: (user) => set({ user, isAuthenticated: true }),
      
      logout: () => set({ user: null, isAuthenticated: false }),
      
      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...updates } });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
```

## TypeScript Patterns

### Type Definitions
```tsx
// types/course.ts
export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  is_published: boolean;
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
}

export type CreateCourseInput = Omit<Course, 'id' | 'created_at' | 'updated_at'>;
export type UpdateCourseInput = Partial<CreateCourseInput>;
```

### Zod Schema Validation
```tsx
// lib/schemas/course.ts
import { z } from 'zod';

export const courseSchema = z.object({
  title: z.string().min(1, 'Название обязательно').max(200),
  description: z.string().min(1, 'Описание обязательно').max(1000),
  category: z.string().min(1, 'Категория обязательна'),
  duration_minutes: z.number().min(1).max(10000),
  is_published: z.boolean().default(false),
});

export type CourseFormData = z.infer<typeof courseSchema>;
```

## Tailwind CSS Patterns

### Responsive Component Styling
```tsx
// components/ui/button.tsx
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

## Error Handling Patterns

### Error Boundary
```tsx
// components/ErrorBoundary.tsx
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">
              Что-то пошло не так
            </h2>
            <p className="text-gray-600 text-center max-w-md">
              Произошла ошибка при загрузке содержимого. Попробуйте обновить страницу.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
            >
              Обновить страницу
            </Button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

## Form Patterns with React Hook Form

### Form Component Pattern
```tsx
// components/forms/CourseForm.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { courseSchema, type CourseFormData } from '@/lib/schemas/course';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface CourseFormProps {
  initialData?: Partial<CourseFormData>;
  onSubmit: (data: CourseFormData) => void;
  isLoading?: boolean;
}

export function CourseForm({ initialData, onSubmit, isLoading }: CourseFormProps) {
  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: '',
      description: '',
      category: '',
      duration_minutes: 60,
      is_published: false,
      ...initialData,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label className="text-sm font-medium">Название курса</label>
        <Input
          {...form.register('title')}
          placeholder="Введите название курса"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.title.message}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Описание</label>
        <Textarea
          {...form.register('description')}
          placeholder="Опишите содержание курса"
          rows={4}
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive mt-1">
            {form.formState.errors.description.message}
          </p>
        )}
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Сохранение...' : 'Сохранить курс'}
      </Button>
    </form>
  );
}
```

## MCP Supabase Direct Database Patterns

### Database Query Pattern
```tsx
// Using MCP Supabase for direct database operations
// AI assistants can now directly query Supabase without client code

// Example: Get all courses with lessons count
const courses = await mcp__supabase__query({
  table: 'courses',
  select: '*, lessons:course_lessons(count)',
  filter: 'is_published.eq.true',
  order: 'created_at.desc'
});

// Example: Create new course with validation
const newCourse = await mcp__supabase__insert({
  table: 'courses',
  data: {
    title: 'Введение в AI',
    description: 'Основы искусственного интеллекта',
    category: 'technology',
    duration_minutes: 120,
    is_published: false
  }
});
```

### Database Schema Operations
```tsx
// Check current schema
const schema = await mcp__supabase__describe_table('courses');

// Create migration for new column
const migration = await mcp__supabase__create_migration({
  name: 'add_difficulty_to_courses',
  up: `
    ALTER TABLE courses 
    ADD COLUMN difficulty TEXT DEFAULT 'beginner' 
    CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'));
  `,
  down: `
    ALTER TABLE courses DROP COLUMN difficulty;
  `
});
```

### Real-time Subscriptions Pattern
```tsx
// Set up real-time listener for course updates
const subscription = await mcp__supabase__subscribe({
  table: 'courses',
  event: '*', // INSERT, UPDATE, DELETE
  filter: 'is_published.eq.true',
  callback: (payload) => {
    console.log('Course updated:', payload);
    // Invalidate React Query cache
    queryClient.invalidateQueries(['courses']);
  }
});
```

### Admin Operations Pattern
```tsx
// Batch operations for admin tasks
const batchResult = await mcp__supabase__batch_operations([
  {
    operation: 'update',
    table: 'courses',
    filter: 'category.eq.outdated',
    data: { is_published: false }
  },
  {
    operation: 'insert',
    table: 'audit_log',
    data: {
      action: 'bulk_unpublish',
      table_name: 'courses',
      user_id: 'admin-user-id',
      details: 'Unpublished outdated courses'
    }
  }
]);
```

### Data Analytics Pattern
```tsx
// Complex analytics queries via MCP
const analytics = await mcp__supabase__raw_query(`
  SELECT 
    c.category,
    COUNT(*) as course_count,
    AVG(c.duration_minutes) as avg_duration,
    COUNT(DISTINCT ucp.user_id) as enrolled_users
  FROM courses c
  LEFT JOIN user_course_progress ucp ON c.id = ucp.course_id
  WHERE c.is_published = true
  GROUP BY c.category
  ORDER BY course_count DESC
`);
```

### Database Backup and Restore Pattern
```tsx
// Create backup before major operations
const backup = await mcp__supabase__create_backup({
  tables: ['courses', 'course_lessons', 'user_course_progress'],
  name: 'pre_migration_backup',
  description: 'Backup before schema changes'
});

// Restore from backup if needed
const restore = await mcp__supabase__restore_backup({
  backup_id: backup.id,
  tables: ['courses']
});
```

---
*This file is part of the AI Context system. Update it when patterns change.*