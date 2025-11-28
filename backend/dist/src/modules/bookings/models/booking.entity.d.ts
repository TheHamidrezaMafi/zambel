import { User } from 'src/modules/users/models/user.entity';
export declare class Booking {
    id: number;
    hotelName: string;
    flightNumber: string;
    date: Date;
    user: User;
}
