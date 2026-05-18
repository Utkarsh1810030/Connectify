export type UserRole = 'user' | 'provider' | 'admin';

export interface User {
  id: string;
  phone: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isVerified: boolean;
  isBanned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  phone: string;
  name?: string;
  role?: UserRole;
}

export interface UpdateUserDto {
  name?: string;
  avatarUrl?: string;
}
