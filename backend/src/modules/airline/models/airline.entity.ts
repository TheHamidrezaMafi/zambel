import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'airlines' }) 
export class Airline {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  code: string;

  @Column({ name: 'name_fa', nullable: true })
  name_fa: string;

  @Column({ name: 'name_en', nullable: true })
  name_en: string;

  @Column({ name: 'logo_url', nullable: true })
  logo_url: string;

  @CreateDateColumn({ name: 'created_at', nullable: true })
  created_at: Date;

  @UpdateDateColumn({ name: 'updated_at', nullable: true })
  updated_at: Date;

  // Aliases for backward compatibility
  get persian_name(): string { return this.name_fa; }
  get english_name(): string { return this.name_en; }
  get iata_code(): string { return this.code; }
}
