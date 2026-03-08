import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class ChatDto {
  @IsUUID()
  fileId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  message: string;
}
