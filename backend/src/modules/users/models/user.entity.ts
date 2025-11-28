import { Booking } from 'src/modules/bookings/models/booking.entity';
import { Chat } from '../../chats/schema/chat.schema';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings: Booking[];
}
