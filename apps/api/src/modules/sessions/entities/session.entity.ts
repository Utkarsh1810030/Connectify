import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('sessions')
export class SessionEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id' }) userId: string;
  @Column({ name: 'provider_id' }) providerId: string;
  @Column({ type: 'enum', enum: ['chat', 'voice', 'video'] }) type: string;
  @Column({ type: 'enum', enum: ['pending', 'active', 'paused', 'completed', 'cancelled', 'failed'], default: 'pending' }) status: string;
  @Column({ name: 'rate_per_min', type: 'decimal', precision: 10, scale: 2 }) ratePerMin: number;
  @Column({ name: 'total_duration_sec', default: 0 }) totalDurationSec: number;
  @Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 }) totalAmount: number;
  @Column({ name: 'platform_fee', type: 'decimal', precision: 12, scale: 2, default: 0 }) platformFee: number;
  @Column({ name: 'provider_earning', type: 'decimal', precision: 12, scale: 2, default: 0 }) providerEarning: number;
  @Column({ name: 'started_at', nullable: true, type: 'timestamptz' }) startedAt: Date | null;
  @Column({ name: 'ended_at', nullable: true, type: 'timestamptz' }) endedAt: Date | null;
  @Column({ name: 'end_reason', type: 'varchar', nullable: true }) endReason: string | null;
  @Column({ name: 'agora_channel_id', type: 'varchar', nullable: true }) agoraChannelId: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
