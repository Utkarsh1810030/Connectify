import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('provider_profiles')
export class ProviderProfileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'display_name', length: 100 })
  displayName: string;

  @Column({ nullable: true, type: 'text' })
  bio: string | null;

  @Column({ type: 'text', array: true, default: [] })
  categories: string[];

  @Column({ type: 'text', array: true, default: [] })
  languages: string[];

  @Column({ name: 'chat_rate_per_min', type: 'decimal', precision: 10, scale: 2 })
  chatRatePerMin: number;

  @Column({ name: 'voice_rate_per_min', type: 'decimal', precision: 10, scale: 2 })
  voiceRatePerMin: number;

  @Column({ name: 'video_rate_per_min', type: 'decimal', precision: 10, scale: 2 })
  videoRatePerMin: number;

  @Column({ name: 'avg_rating', type: 'decimal', precision: 3, scale: 2, default: 0 })
  avgRating: number;

  @Column({ name: 'total_ratings', default: 0 })
  totalRatings: number;

  @Column({ name: 'total_sessions', default: 0 })
  totalSessions: number;

  @Column({ name: 'total_minutes', default: 0 })
  totalMinutes: number;

  @Column({ name: 'is_online', default: false })
  isOnline: boolean;

  @Column({ name: 'is_approved', default: false })
  isApproved: boolean;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 4, default: 0.15 })
  commissionRate: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
