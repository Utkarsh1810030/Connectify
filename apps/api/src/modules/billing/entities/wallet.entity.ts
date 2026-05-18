import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';
@Entity('wallets')
export class WalletEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'user_id', unique: true }) userId: string;
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 }) balance: number;
  @Column({ default: 'INR' }) currency: string;
  @UpdateDateColumn({ name: 'updated_at' }) updatedAt: Date;
}
