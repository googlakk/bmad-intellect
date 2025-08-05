'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '@/stores/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Plus, 
  Search, 
  UserPlus, 
  Shield, 
  User, 
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  Loader2
} from 'lucide-react';

const createUserSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  name: z.string().min(1, 'Имя обязательно'),
  role: z.enum(['USER', 'ADMIN']).default('USER'),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  created_at: string;
  mandatoryCourses?: {
    total: number;
    completed: number;
  };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();

  const form = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      role: 'USER',
    },
  });

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.user_metadata?.role !== 'ADMIN')) {
      router.push('/');
    }
  }, [isAuthenticated, isLoading, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.user_metadata?.role === 'ADMIN') {
      fetchUsers();
    }
  }, [isAuthenticated, user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (data: CreateUserFormData) => {
    setCreateLoading(true);
    setCreateError(null);

    try {
      const response = await fetch('/api/admin/create-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setCreateSuccess(true);
        form.reset();
        fetchUsers(); // Обновляем список пользователей
        
        setTimeout(() => {
          setCreateSuccess(false);
          setShowCreateForm(false);
        }, 2000);
      } else {
        setCreateError(result.error || 'Произошла ошибка при создании пользователя');
      }
    } catch (err) {
      setCreateError('Произошла ошибка сети');
    } finally {
      setCreateLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading || !isAuthenticated || user?.user_metadata?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-blue-600 hover:underline">
                ← Админка
              </Link>
              <span className="text-gray-500">|</span>
              <h1 className="text-2xl font-bold text-gray-900">Управление пользователями</h1>
            </div>
            
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              className={showCreateForm ? 'bg-gray-600' : ''}
            >
              {showCreateForm ? (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Отмена
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Создать пользователя
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Create User Form */}
        {showCreateForm && (
          <Card className="mb-8 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserPlus className="h-5 w-5 mr-2 text-blue-600" />
                Создание нового пользователя
              </CardTitle>
              <CardDescription>
                Создайте аккаунт для нового пользователя системы
              </CardDescription>
            </CardHeader>
            <CardContent>
              {createSuccess ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-green-800 mb-2">
                    Пользователь создан успешно!
                  </h3>
                  <p className="text-green-600">
                    Теперь пользователь может войти в систему с указанными данными
                  </p>
                </div>
              ) : (
                <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
                  {createError && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <p className="text-sm text-red-800">{createError}</p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Имя пользователя
                      </label>
                      <Input
                        id="name"
                        placeholder="Иван Петров"
                        {...form.register('name')}
                        className={form.formState.errors.name ? 'border-red-500' : ''}
                      />
                      {form.formState.errors.name && (
                        <p className="text-sm text-red-600">{form.formState.errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="user@company.com"
                        {...form.register('email')}
                        className={form.formState.errors.email ? 'border-red-500' : ''}
                      />
                      {form.formState.errors.email && (
                        <p className="text-sm text-red-600">{form.formState.errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="password" className="text-sm font-medium">
                        Временный пароль
                      </label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Минимум 6 символов"
                        {...form.register('password')}
                        className={form.formState.errors.password ? 'border-red-500' : ''}
                      />
                      {form.formState.errors.password && (
                        <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="role" className="text-sm font-medium">
                        Роль
                      </label>
                      <select
                        id="role"
                        {...form.register('role')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="USER">Пользователь</option>
                        <option value="ADMIN">Администратор</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="submit" disabled={createLoading} className="flex-1">
                      {createLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Создать пользователя
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateForm(false)}
                    >
                      Отмена
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Поиск пользователей по имени или email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  <p className="text-sm text-gray-600">Всего пользователей</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <User className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'USER').length}
                  </p>
                  <p className="text-sm text-gray-600">Пользователей</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.role === 'ADMIN').length}
                  </p>
                  <p className="text-sm text-gray-600">Администраторов</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Загрузка пользователей...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        {user.role === 'ADMIN' ? (
                          <Shield className="h-6 w-6 text-purple-600" />
                        ) : (
                          <User className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {user.name || 'Без имени'}
                          </h3>
                          <Badge variant={user.role === 'ADMIN' ? 'destructive' : 'secondary'}>
                            {user.role === 'ADMIN' ? 'Администратор' : 'Пользователь'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(user.created_at).toLocaleDateString('ru-RU')}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm">
                        Редактировать
                      </Button>
                      <Button variant="outline" size="sm">
                        Прогресс
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredUsers.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm ? 'Пользователи не найдены' : 'Нет пользователей'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {searchTerm 
                      ? 'Попробуйте изменить поисковый запрос'
                      : 'Создайте первого пользователя для начала работы'
                    }
                  </p>
                  {!searchTerm && (
                    <Button onClick={() => setShowCreateForm(true)}>
                      <UserPlus className="h-4 w-4 mr-2" />
                      Создать пользователя
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}