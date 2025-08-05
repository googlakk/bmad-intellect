import { Course, CreateCourseInput, UpdateCourseInput } from '@/types/course';

const API_BASE = '/api';

export const coursesApi = {
  async getAll(): Promise<Course[]> {
    const response = await fetch(`${API_BASE}/courses`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.courses;
  },

  async getById(id: string): Promise<Course> {
    const response = await fetch(`${API_BASE}/courses/${id}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Course not found');
      }
      throw new Error(`Failed to fetch course: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.course;
  },

  async create(input: CreateCourseInput): Promise<Course> {
    const response = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create course: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.course;
  },

  async update(id: string, input: UpdateCourseInput): Promise<Course> {
    const response = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update course: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.course;
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to delete course: ${response.statusText}`);
    }
  },
};