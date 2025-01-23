import { Processor } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { FileProcessingService } from "src/file-processing.service";



@Processor('file-processing')
export class FileProcessingConsumer {
    private readonly logger = new Logger(FileProcessingConsumer.name);

    constructor(private readonly fileProcessingService: FileProcessingService) {}
    
    async process(job: Job) {
        this.logger.log(`Processing file ${job.data.fileId}`);
        await this.fileProcessingService.processFile(job.data.fileId);
        this.logger.log(`Completed processing file ${job.data.fileId}`);
    }
}   