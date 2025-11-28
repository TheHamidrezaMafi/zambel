import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
export declare class UsersService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    createUser(userData: Partial<User>): Promise<User>;
    findUserById(id: number): Promise<User>;
}
