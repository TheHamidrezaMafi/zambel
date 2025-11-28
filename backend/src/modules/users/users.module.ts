import { Module } from '@nestjs/common';
import { UsersService } from './services/users.service';
import { usersProviders } from './providers/users.provider';

@Module({
    providers:[UsersService,...usersProviders],
    controllers:[],
    exports:[UsersService]
})
export class UsersModule {}
