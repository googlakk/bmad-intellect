'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2, User } from 'lucide-react';

export default function ActivatePage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = async () => {
    if (!email) {
      setError('Введите email');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/confirm-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
      } else {
        setError(result.error || 'Произошла ошибка');
      }
    } catch (err) {
      setError('Ошибка сети');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Пользователь активирован!
              </h2>
              <p className="text-gray-600 mb-4">
                Теперь вы можете войти в систему как администратор
              </p>
              <Button onClick={() => window.location.href = '/auth/signin'}>
                Войти в систему
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <User className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-2xl text-center">Активация пользователя</CardTitle>
          <CardDescription className="text-center">
            Введите email для активации и назначения роли администратора
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email пользователя
              </label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button 
              onClick={handleActivate}
              className="w-full" 
              disabled={loading}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Активировать и сделать админом
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Эта страница активирует пользователя и назначает роль администратора
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}