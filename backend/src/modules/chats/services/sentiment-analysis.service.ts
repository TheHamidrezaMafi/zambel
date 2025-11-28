import { Injectable } from '@nestjs/common';
import { pipeline } from 'transformers';

@Injectable()
export class SentimentAnalysisService {
  private sentimentPipeline: any;

  async loadModel(): Promise<void> {
    this.sentimentPipeline = await pipeline('sentiment-analysis');
  }

  async analyzeSentiment(text: string): Promise<string> {
    const result = await this.sentimentPipeline(text);
    return result[0].label; // مثبت، منفی یا خنثی
  }
}
