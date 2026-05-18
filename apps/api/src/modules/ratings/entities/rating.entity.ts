import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('ratings')
export class RatingEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'session_id', unique: true }) sessionId: string;
  @Column({ name: 'user_id' }) userId: string;
  @Column({ name: 'provider_id' }) providerId: string;
  @Column({ type: 'int' }) score: number;
  @Column({ nullable: true, type: 'int' }) helpfulness: number | null;
  @Column({ nullable: true, type: 'int' }) appropriateness: number | null;
  @Column({ nullable: true, type: 'text' }) comment: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
