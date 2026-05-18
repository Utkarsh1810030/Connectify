import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
@Entity('transactions')
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'wallet_id' }) walletId: string;
  @Column({ type: 'enum', enum: ['topup','debit','earning','payout','refund'] }) type: string;
  @Column({ type: 'decimal', precision: 12, scale: 2 }) amount: number;
  @Column({ name: 'balance_after', type: 'decimal', precision: 12, scale: 2 }) balanceAfter: number;
  @Column({ name: 'reference_type', type: 'varchar', nullable: true }) referenceType: string | null;
  @Column({ name: 'reference_id', type: 'varchar', nullable: true }) referenceId: string | null;
  @Column({ nullable: true, type: 'text' }) description: string | null;
  @CreateDateColumn({ name: 'created_at' }) createdAt: Date;
}
