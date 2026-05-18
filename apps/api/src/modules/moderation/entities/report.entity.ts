import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('reports')
export class ReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'reporter_id' })
  reporterId: string;

  @Column({ name: 'reported_user_id' })
  reportedUserId: string;

  @Column({ name: 'session_id', type: 'varchar', nullable: true })
  sessionId: string | null;

  @Column({ type: 'text' })
  reason: string;

  @Column({ nullable: true, type: 'text' })
  description: string | null;

  @Column({ type: 'enum', enum: ['open', 'reviewed', 'resolved', 'dismissed'], default: 'open' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
