'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from "@/stores/authStore";
import { BookOpen, Users } from "lucide-react";

export default function Home() {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Если пользователь авторизован, перенаправляем на дашборд
        router.push('/dashboard');
      } else {
        // Если не авторизован, перенаправляем на страницу входа
        router.push('/auth/signin');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Показываем загрузку пока определяется статус авторизации
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Интеллект</h2>
          <p className="text-gray-600">Образовательная платформа</p>
        </div>
      </div>
    );
  }

  // Показываем краткую информацию во время редиректа
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center mb-6">
          <BookOpen className="h-16 w-16 text-blue-600 mr-4" />
          <Users className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Интеллект</h1>
        <p className="text-xl text-gray-600 mb-6">
          Образовательная платформа с AI-каталогом сервисов
        </p>
        <div className="animate-pulse bg-gray-200 h-2 rounded-full"></div>
      </div>
    </div>
  );
}
