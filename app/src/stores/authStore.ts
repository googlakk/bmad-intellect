import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/types/user';

interface AuthUser extends User {
  user_metadata?: {
    name?: string;
    role?: UserRole;
  };
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  updateUser: (updates: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      signIn: async (email: string, password: string) => {
        try {
          const supabase = createClient();
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            return { error: error.message };
          }

          if (data.user) {
            // Получаем дополнительную информацию о пользователе из нашей таблицы
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', data.user.id)
              .single();

            const userWithMetadata = {
              ...data.user,
              user_metadata: {
                ...data.user.user_metadata,
                name: userData?.name || data.user.user_metadata?.name,
                role: userData?.role || UserRole.USER,
              },
            };

            set({ 
              user: userWithMetadata, 
              isAuthenticated: true,
              isLoading: false,
            });
          }

          return {};
        } catch (error) {
          console.error('Ошибка входа:', error);
          return { error: 'Произошла ошибка при входе' };
        }
      },

      signUp: async (email: string, password: string, name?: string) => {
        try {
          const supabase = createClient();
          
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name: name || '',
              },
            },
          });

          if (error) {
            return { error: error.message };
          }

          if (data.user) {
            // Создаем запись в нашей таблице users
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email!,
                name: name || null,
                role: UserRole.USER,
              });

            if (insertError) {
              console.error('Ошибка создания пользователя:', insertError);
            }

            const userWithMetadata = {
              ...data.user,
              user_metadata: {
                ...data.user.user_metadata,
                name: name,
                role: UserRole.USER,
              },
            };

            set({ 
              user: userWithMetadata, 
              isAuthenticated: true,
              isLoading: false,
            });
          }

          return {};
        } catch (error) {
          console.error('Ошибка регистрации:', error);
          return { error: 'Произошла ошибка при регистрации' };
        }
      },

      signOut: async () => {
        try {
          const supabase = createClient();
          await supabase.auth.signOut();
          
          set({ 
            user: null, 
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error('Ошибка выхода:', error);
        }
      },

      initialize: async () => {
        try {
          const supabase = createClient();
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user) {
            // Получаем дополнительную информацию о пользователе
            const { data: userData } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            const userWithMetadata = {
              ...session.user,
              user_metadata: {
                ...session.user.user_metadata,
                name: userData?.name || session.user.user_metadata?.name,
                role: userData?.role || UserRole.USER,
              },
            };

            set({ 
              user: userWithMetadata, 
              isAuthenticated: true,
              isLoading: false,
            });
          } else {
            set({ 
              user: null, 
              isAuthenticated: false,
              isLoading: false,
            });
          }

          // Подписываемся на изменения состояния аутентификации
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              const { data: userData } = await supabase
                .from('users')
                .select('*')
                .eq('id', session.user.id)
                .single();

              const userWithMetadata = {
                ...session.user,
                user_metadata: {
                  ...session.user.user_metadata,
                  name: userData?.name || session.user.user_metadata?.name,
                  role: userData?.role || UserRole.USER,
                },
              };

              set({ 
                user: userWithMetadata, 
                isAuthenticated: true,
                isLoading: false,
              });
            } else if (event === 'SIGNED_OUT') {
              set({ 
                user: null, 
                isAuthenticated: false,
                isLoading: false,
              });
            }
          });

        } catch (error) {
          console.error('Ошибка инициализации auth:', error);
          set({ 
            user: null, 
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ 
            user: { 
              ...currentUser, 
              ...updates,
              user_metadata: {
                ...currentUser.user_metadata,
                ...updates.user_metadata,
              },
            } 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);