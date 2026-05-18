import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('payouts')
export class PayoutEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'provider_id' }) providerId: string;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) amount: number;
  @Column({ type: 'enum', enum: ['pending','processing','completed','failed'], default: 'pending' }) status: string;
  @Column({ name: 'bank_reference', type: 'varchar', nullable: true }) bankReference: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
  @Column({ name: 'processed_at', nullable: true, type: 'timestamptz' }) processedAt: Date | null;
}
