import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class CreateChatDto {
    
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  readonly message: string;

  @ApiProperty()
  @IsInt()
  @IsNotEmpty()
  readonly userId: number;

  @ApiProperty()
  @IsString()
  readonly conversationId: string;
}