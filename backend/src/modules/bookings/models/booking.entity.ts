import { Entity, Column, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from 'src/modules/users/models/user.entity';

@Entity()
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hotelName: string;

  @Column()
  flightNumber: string;

  @Column()
  date: Date;

  @ManyToOne(() => User, (user) => user.bookings)
  user: User;
}
