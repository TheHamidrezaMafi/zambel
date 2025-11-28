// import {
//     WebSocketGateway,
//     WebSocketServer,
//     SubscribeMessage,
//     MessageBody,
//     ConnectedSocket,
//   } from '@nestjs/websockets';
//   import { Server, Socket } from 'socket.io';
//   import { ChatbotService } from '../services/chatbot.service';

//   @WebSocketGateway()
//   export class ChatGateway {
//     @WebSocketServer()
//     server: Server;

//     constructor(private chatbotService: ChatbotService) {}

//     @SubscribeMessage('message')
//     async handleMessage(
//       @MessageBody() data: { userId: number; message: string },
//       @ConnectedSocket() client: Socket,
//     ) {
//       const { userId, message } = data;

//       // پردازش پیام با استفاده از ChatbotService
//       const response = await this.chatbotService.handleMessage(userId, message);

//       // ارسال پاسخ به کلاینت
//       client.emit('message', { userId, message: response });

//       // ارسال درخواست به ربات اسکرپر (در صورت نیاز)
//       if (this.chatbotService.isTravelInfo(message)) {
//         const travelInfo = this.chatbotService.extractTravelInfo(message);
//         this.server.emit('scrapeRequest', travelInfo);
//       }
//     }
//   }

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { ChatbotService } from '../services/chatbot.service';

@WebSocketGateway(Number(process.env.SOCKET_PORT), {
  cors: {
    origin: '*',
  },
})
@Injectable()
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  constructor(private chatbotService: ChatbotService) {}

  @SubscribeMessage('message')
  async handleMessage(
    @MessageBody() data: { userId: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { userId, message } = data;

    // پردازش پیام کاربر با استفاده از ChatbotService
    const response = await this.chatbotService.handleMessage({
      userId: Number(userId),
      message: message,
    });

    // ارسال پاسخ به کلاینت
    client.emit('message', { userId, message: response });
  }
}
