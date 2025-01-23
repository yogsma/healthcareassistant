import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { DBAccessService } from 'libs/src';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly openai: OpenAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: DBAccessService,
  ) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async getAnswer(fileId: string, question: string) {
    try {
      // 1. Generate embedding for the question
      const questionEmbedding = await this.generateEmbedding(question);

      // 2. Find most similar content chunks
      const similarDocs = await this.prisma.$queryRaw`
        SELECT content, 1 - (embedding <=> ${questionEmbedding}::vector) as similarity
        FROM "DocumentEmbedding"
        WHERE "fileId" = ${fileId}
        ORDER BY similarity DESC
        LIMIT 3;
      `;

      // 3. Generate response using ChatGPT
      const response = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that answers questions about health insurance documents. Use the provided context to answer questions accurately and concisely."
          },
          {
            role: "user",
            content: `Context from the document:\n${(similarDocs as { content: string }[]).map(doc => doc.content).join('\n\n')}\n\nQuestion: ${question}`
          }
        ],
        temperature: 0.3,
      });

      return response.choices[0].message.content;
    } catch (error) {
      this.logger.error('Error getting answer:', error);
      throw error;
    }
  }

  private async generateEmbedding(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text.replace(/\n/g, " "),
    });

    return response.data[0].embedding;
  }
}