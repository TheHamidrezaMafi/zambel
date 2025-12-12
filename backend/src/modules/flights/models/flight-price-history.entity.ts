import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { TrackedFlight } from './tracked-flight.entity';

/**
 * FlightPriceHistory Entity
 * Stores every price snapshot for each tracked flight
 * Records are never deleted to maintain complete historical data
 */
@Entity({ name: 'flight_price_history' })
@Index(['tracked_flight_id', 'scraped_at'])
@Index(['scraped_at'])
@Index(['provider'])
export class FlightPriceHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tracked_flight_id: string;

  @ManyToOne(() => TrackedFlight, flight => flight.price_history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tracked_flight_id' })
  tracked_flight: TrackedFlight;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  adult_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 0, nullable: true })
  child_price: number;

  @Column({ type: 'decimal', precision: 12, scale: 0, nullable: true })
  infant_price: number;

  @Column({ type: 'integer', nullable: true })
  available_seats: number;

  @CreateDateColumn()
  scraped_at: Date;

  @Column({ type: 'boolean', default: true })
  is_available: boolean;

  // Store raw provider response for debugging/auditing
  @Column({ type: 'jsonb', nullable: true })
  raw_data: {
    rules?: string;
    capacity?: number;
    departure_date_time?: string;
    arrival_date_time?: string;
    original_provider_data?: any;
  };

  // Price comparison flags (calculated on insert)
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  price_change_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 0, nullable: true })
  price_change_amount: number;
}
