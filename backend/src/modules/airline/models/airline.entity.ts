import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'airlines' }) 
export class Airline {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable:true })
  persian_name: string;

  @Column({ nullable:true })
  english_name: string;

  @Column({ nullable:true })
  iata_code: string;

  @Column({ nullable:true })
  country_code: string;

  @Column({ nullable:true })
  digit_code: string;

  @Column({ nullable:true })
  logo_url: string;
}
