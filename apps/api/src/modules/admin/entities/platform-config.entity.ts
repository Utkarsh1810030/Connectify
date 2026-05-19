import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('platform_config')
export class PlatformConfigEntity {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  key: string;

  @Column({ type: 'jsonb' })
  value: any;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
