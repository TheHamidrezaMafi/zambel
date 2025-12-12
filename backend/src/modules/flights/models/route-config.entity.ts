import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

/**
 * RouteConfig Entity
 * Stores configuration for automated route tracking
 * Defines which routes should be monitored automatically
 */
@Entity({ name: 'route_configs' })
@Index(['origin', 'destination'], { unique: true })
export class RouteConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 3 })
  origin: string;

  @Column({ type: 'varchar', length: 3 })
  destination: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  origin_name_fa: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  destination_name_fa: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'integer', default: 7 })
  days_ahead: number; // Number of days to track ahead

  @Column({ type: 'integer', default: 60 })
  tracking_interval_minutes: number; // How often to check prices

  @Column({ type: 'timestamp', nullable: true })
  last_tracked_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @Column({ type: 'jsonb', nullable: true })
  tracking_settings: {
    preferred_providers?: string[];
    price_alert_threshold?: number;
    notify_on_price_drop?: boolean;
  };
}
