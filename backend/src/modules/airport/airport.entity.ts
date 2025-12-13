import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'airports' })
export class Airport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'code', nullable: true })
  code: string;

  @Column({ name: 'name_en', nullable: true })
  name_en: string;

  @Column({ name: 'name_fa', nullable: true })
  name_fa: string;

  @Column({ name: 'city_code', nullable: true })
  city_code: string;

  @Column({ name: 'city_name_en', nullable: true })
  city_name_en: string;

  @Column({ name: 'city_name_fa', nullable: true })
  city_name_fa: string;

  @Column({ name: 'country', nullable: true })
  country: string;

  @Column({ name: 'created_at', nullable: true })
  created_at: Date;

  // Aliases for backward compatibility
  get iata_code(): string { return this.code; }
  get icao_code(): string { return this.code; }
  get persian_name(): string { return this.name_fa; }
  get english_name(): string { return this.name_en; }
  get country_code(): string { return this.country; }
}
