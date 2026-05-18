import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { UserRole } from '@connectify/types';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 15 })
  phone: string;

  @Column({ nullable: true, length: 100 })
  name: string | null;

  @Column({ name: 'avatar_url', nullable: true, type: 'text' })
  avatarUrl: string | null;

  @Column({ type: 'enum', enum: ['user', 'provider', 'admin'], default: 'user' })
  role: UserRole;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'is_banned', default: false })
  isBanned: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
