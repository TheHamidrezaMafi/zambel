import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'airports' })
export class Airport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  iata_code: string;

  @Column({ nullable: true })
  icao_code: string;

  @Column({ nullable: true })
  persian_name: string;

  @Column({ nullable: true })
  english_name: string;

  @Column({ nullable: true })
  country_code: string;

  @Column({ nullable: true })
  time_zone: number;

  @Column({ nullable: true })
  latitude: number;

  @Column({ nullable: true })
  location_type_id: number;

  @Column({ nullable: true })
  altitude: number;

  @Column({ nullable: true })
  order_show: number;
}
