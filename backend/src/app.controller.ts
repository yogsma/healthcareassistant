import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { Express } from 'express';
import * as path from 'path';
import { AppService } from './app.service';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ChatDto } from './dto/chat.dto';
import { Throttle } from '@nestjs/throttler';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

const MAGIC_SIGNATURES = [
  [0x25, 0x50, 0x44, 0x46], // PDF: %PDF
  [0xd0, 0xcf, 0x11, 0xe0], // DOC: OLE2
  [0x50, 0x4b, 0x03, 0x04], // DOCX: ZIP/PK
];

function fileFilter(req: any, file: Express.Multer.File, callback: Function) {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return callback(
      new BadRequestException('Invalid file type. Only PDF and Word documents are allowed.'),
      false,
    );
  }
  callback(null, true);
}

function validateMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 4) return false;
  return MAGIC_SIGNATURES.some((sig) => sig.every((byte, i) => buffer[i] === byte));
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly chatService: ChatService,
  ) {}

  @Post('api/files/upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter,
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      throw new BadRequestException('Invalid file extension');
    }

    if (!validateMagicBytes(file.buffer)) {
      throw new BadRequestException('File content does not match its declared type');
    }

    const result = await this.appService.processUploadedFile(file, req.user.id);
    return {
      fileId: result.fileId,
      url: result.url,
      filename: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }

  @Post('api/chat')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async chat(@Body() body: ChatDto, @Request() req: any) {
    return this.chatService.getAnswer(body.fileId, body.message, req.user.id);
  }
}