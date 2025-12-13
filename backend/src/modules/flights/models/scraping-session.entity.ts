import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('scraping_sessions')
export class ScrapingSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, default: 'manual' })
  trigger_type: 'cron' | 'manual' | 'api'; // How the session was started

  @Column({ type: 'varchar', length: 20 })
  status: 'running' | 'paused' | 'completed' | 'stopped' | 'failed';

  @CreateDateColumn()
  started_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  paused_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  resumed_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  completed_at: Date | null;

  @Column({ type: 'int', default: 0 })
  total_routes: number;

  @Column({ type: 'int', default: 0 })
  completed_routes: number;

  @Column({ type: 'int', default: 0 })
  failed_routes: number;

  @Column({ type: 'int', default: 0 })
  total_flights_found: number;

  @Column({ type: 'int', default: 0 })
  total_flights_saved: number;

  @Column({ type: 'int', default: 0 })
  total_errors: number;

  @Column({ type: 'jsonb', nullable: true })
  route_details: Array<{
    route: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    flights_found: number;
    flights_saved: number;
    errors: number;
    started_at?: string;
    completed_at?: string;
  }> | null;

  @Column({ type: 'text', nullable: true })
  error_message: string | null;

  @Column({ type: 'int', default: 0 })
  duration_seconds: number; // Total active duration (excluding pause time)

  @Column({ type: 'int', default: 0 })
  pause_duration_seconds: number; // Total time spent paused

  @UpdateDateColumn()
  updated_at: Date;
}
