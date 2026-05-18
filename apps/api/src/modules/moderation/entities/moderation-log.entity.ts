import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('moderation_logs')
export class ModerationLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'session_id', nullable: true })
  sessionId: string | null;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ type: 'enum', enum: ['keyword_match', 'phone_detected', 'handle_detected', 'manual_report', 'ai_flag'] })
  type: string;

  @Column({ nullable: true, type: 'text' })
  content: string | null;

  @Column({ name: 'action_taken', type: 'enum', enum: ['warned', 'blocked', 'session_ended', 'banned'] })
  actionTaken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
