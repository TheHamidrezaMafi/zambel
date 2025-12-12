import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, Index } from 'typeorm';
import { TrackedFlight } from './tracked-flight.entity';

/**
 * LowestPriceSnapshot Entity
 * Stores the lowest price among all providers at each tracking cycle
 * This allows tracking how the best deal changes over time
 */
@Entity({ name: 'lowest_price_snapshots' })
@Index(['tracked_flight_id', 'scraped_at'])
@Index(['scraped_at'])
export class LowestPriceSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tracked_flight_id: string;

  @ManyToOne(() => TrackedFlight, flight => flight.lowest_price_snapshots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tracked_flight_id' })
  tracked_flight: TrackedFlight;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  lowest_price: number;

  @Column({ type: 'varchar', length: 50 })
  provider: string;

  @CreateDateColumn()
  scraped_at: Date;

  // Price comparison with previous lowest
  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  price_change_percentage: number;

  @Column({ type: 'decimal', precision: 12, scale: 0, nullable: true })
  price_change_amount: number;

  // Additional info
  @Column({ type: 'jsonb', nullable: true })
  comparison_data: {
    all_providers_prices?: { provider: string; price: number }[];
    second_lowest_price?: number;
    second_lowest_provider?: string;
    price_difference_from_second?: number;
  };
}
