'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';

export default function TestCoursePage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuthStore();

  const testCreateCourse = async () => {
    setLoading(true);
    setResult('');

    try {
      const courseData = {
        title: 'Тестовый курс',
        description: 'Описание тестового курса',
        category: 'Тест',
        duration_minutes: 60,
        is_published: true,
        is_mandatory: false,
        mandatory_for_role: 'USER'
      };

      console.log('Sending course data:', courseData);

      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(courseData),
      });

      const responseData = await response.json();
      console.log('Response:', responseData);

      if (response.ok) {
        setResult(`Успех! Курс создан: ${JSON.stringify(responseData, null, 2)}`);
      } else {
        setResult(`Ошибка ${response.status}: ${JSON.stringify(responseData, null, 2)}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setResult(`Ошибка: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testGetCourses = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/courses');
      const data = await response.json();

      if (response.ok) {
        setResult(`Курсы: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`Ошибка ${response.status}: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setResult(`Ошибка: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testUserData = async () => {
    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/admin/users');
      const data = await response.json();

      if (response.ok) {
        setResult(`Пользователи: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`Ошибка ${response.status}: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (error) {
      console.error('Error:', error);
      setResult(`Ошибка: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Тестирование API</h1>
      
      <div className="mb-4">
        <p>Текущий пользователь: {user?.email}</p>
        <p>Роль: {user?.user_metadata?.role}</p>
        <p>ID: {user?.id}</p>
      </div>

      <div className="space-y-4">
        <button
          onClick={testCreateCourse}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-4"
        >
          Создать тестовый курс
        </button>

        <button
          onClick={testGetCourses}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded mr-4"
        >
          Получить курсы
        </button>

        <button
          onClick={testUserData}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Получить пользователей
        </button>
      </div>

      {loading && <p className="mt-4">Загрузка...</p>}

      {result && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Результат:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}