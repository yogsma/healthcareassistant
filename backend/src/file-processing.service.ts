import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import * as fs from 'fs/promises';
import * as path from 'path';
import * as pdf from 'pdf-parse';
import OpenAI from 'openai';
import { DBAccessService } from 'libs/src';

@Injectable()
export class FileProcessingService {
  private readonly logger = new Logger(FileProcessingService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: DBAccessService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async processFile(fileId: string) {
    try {
      // 1. Get file metadata from database
      const fileData = await this.prisma.fileUpload.findUnique({
        where: { id: fileId },
      });

      if (!fileData) {
        throw new Error('File not found');
      }

      // 2. Read PDF file
      const filePath = path.join(process.cwd(), 'uploads', fileData.file_name);
      const dataBuffer = await fs.readFile(filePath);
      
      // 3. Extract text from PDF
      const pdfData = await pdf(dataBuffer);
      const text = pdfData.text;

      // 4. Split text into chunks (around 512 tokens each)
      const chunks = this.splitIntoChunks(text);

      // 5. Generate embeddings for each chunk
      for (const chunk of chunks) {
        const embedding = await this.generateEmbedding(chunk);
        const updatedEmbedding = JSON.stringify(embedding);

        await this.prisma.$executeRaw`INSERT INTO "DocumentEmbedding" ("fileId", "content", "embedding") VALUES (${fileId}, ${chunk}, ${updatedEmbedding})`;                
      }

      // 7. Update file status
      await this.prisma.fileUpload.update({
        where: { id: fileId },
        data: { status: 'PROCESSED' },
      });

    } catch (error) {
      this.logger.error(`Error processing file ${fileId}:`, error);
      await this.prisma.fileUpload.update({
        where: { id: fileId },
        data: { status: 'ERROR' },
      });
      throw error;
    }
  }

  private splitIntoChunks(text: string, targetTokens: number = 512): string[] {
    // Simple splitting strategy - can be improved
    const words = text.split(' ');
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentTokenCount = 0;
    
    // Approximate token count (1 token ≈ 4 characters)
    for (const word of words) {
      const wordTokens = Math.ceil(word.length / 4);
      if (currentTokenCount + wordTokens > targetTokens) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [word];
        currentTokenCount = wordTokens;
      } else {
        currentChunk.push(word);
        currentTokenCount += wordTokens;
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }
    
    return chunks;
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text.replace(/\n/g, " "),
    });

    return response.data[0].embedding;
  }
}
