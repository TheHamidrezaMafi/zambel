import { Entity, Column, PrimaryGeneratedColumn, Index, CreateDateColumn, OneToMany } from 'typeorm';

/**
 * TrackedFlight Entity
 * Stores unique flights identified by flight number, date, origin, and destination
 * This table maintains a record of all flights being tracked without duplication
 */
@Entity({ name: 'tracked_flights' })
@Index(['flight_number', 'flight_date', 'origin', 'destination'], { unique: true })
@Index(['flight_date'])
@Index(['origin', 'destination'])
export class TrackedFlight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10 })
  flight_number: string;

  @Column({ type: 'date' })
  flight_date: Date;

  @Column({ type: 'varchar', length: 3 })
  origin: string;

  @Column({ type: 'varchar', length: 3 })
  destination: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  airline_name_fa: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  airline_name_en: string;

  @Column({ type: 'timestamp', nullable: true })
  departure_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  arrival_time: Date;

  @CreateDateColumn()
  created_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  last_tracked_at: Date;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  // Current lowest price information (updated on each tracking cycle)
  @Column({ type: 'decimal', precision: 12, scale: 0, nullable: true })
  current_lowest_price: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  current_lowest_price_provider: string;

  @Column({ type: 'timestamp', nullable: true })
  current_lowest_price_updated_at: Date;

  // Relation to price history (lazy loaded to avoid circular dependency issues)
  @OneToMany('FlightPriceHistory', 'tracked_flight', { cascade: true })
  price_history: any[];

  // Relation to lowest price snapshots
  @OneToMany('LowestPriceSnapshot', 'tracked_flight', { cascade: true })
  lowest_price_snapshots: any[];

  // Additional metadata for tracking
  @Column({ type: 'jsonb', nullable: true })
  metadata: {
    aircraft_type?: string;
    cabin_class?: string;
    original_flight_number?: string;
  };
}
