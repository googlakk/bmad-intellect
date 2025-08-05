export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export type CreateUserInput = Omit<User, 'id' | 'created_at' | 'updated_at'>;
export type UpdateUserInput = Partial<CreateUserInput>;