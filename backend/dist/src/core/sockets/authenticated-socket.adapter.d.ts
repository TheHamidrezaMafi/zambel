import { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { Server } from 'socket.io';
export declare class AuthenticatedSocketAdapter extends IoAdapter {
    private app;
    constructor(app: INestApplicationContext);
    createIOServer(port: number, options?: any): Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
}
