import { Injectable, Logger } from '@nestjs/common';
import { Express } from 'express';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { DBAccessService } from 'libs/src';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);
  constructor(private readonly dbAccessService: DBAccessService,
    @InjectQueue('file-processing') private fileProcessingQueue: Queue
  ) {}

  async processUploadedFile(file: Express.Multer.File) {
    // Generate a unique ID for the file
    const fileId = uuidv4();
    
    // In a real application, you would:
    // 1. Upload to cloud storage (S3, GCS, etc.)
    // 2. Store metadata in database
    // 3. Return file information
    
    // This is a simple example saving to local filesystem
    const uploadDir = path.join(process.cwd(), 'uploads');
    
    // Ensure uploads directory exists
    await fs.mkdir(uploadDir, { recursive: true });
    
    // Save file with unique name
    const fileExtension = path.extname(file.originalname);
    const fileName = `${fileId}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);
    this.logger.log('file original name', file.originalname);
    this.logger.log('saving file to', filePath);
    
    try {
      await fs.writeFile(filePath, new Uint8Array(file.buffer));
    } catch (error) {
      console.error('Failed to save file:', error);
      throw error;
    }
    
    // In production, this would be your cloud storage URL
    const url = `/uploads/${fileName}`;

    this.logger.log('saving file metadata to database');
    // Save file metadata to database
    await this.dbAccessService.fileUpload.create({
      data: {
        id: fileId,
        url,
        file_name: fileName,
        original_name: file.originalname,
        status: 'PENDING',
      },
    });
    this.logger.log('creating bull job to process the file');
    // create a bull job to process the file    
    await this.fileProcessingQueue.add('process-file', { fileId });
    return {
      fileId,
      url,
    };
  }
}
