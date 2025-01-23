import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  PayloadTooLargeException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { AppService } from './app.service';
import { ChatService } from './chat.service';

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, callback: Function) => {
  // Check file type
  const allowedMimeTypes = [
    'application/pdf',                                                    // PDF
    'application/msword',                                                // DOC
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  ];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return callback(
      new BadRequestException(
        'Invalid file type. Only PDF and Word documents are allowed.'
      ),
      false
    );
  }
  callback(null, true);
};

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly chatService: ChatService) {}

  @Post('api/files/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB in bytes
      },
      fileFilter,
    })
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const result = await this.appService.processUploadedFile(file);
      return {
        fileId: result.fileId,
        url: result.url,
        filename: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      throw new BadRequestException('Failed to process file upload');
    }
  }


  @Post('api/chat')
  async chat(@Body() body: { fileId: string, message: string }) {
    return this.chatService.getAnswer(body.fileId, body.message);
  }
}