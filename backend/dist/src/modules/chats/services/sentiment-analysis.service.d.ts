export declare class SentimentAnalysisService {
    private sentimentPipeline;
    loadModel(): Promise<void>;
    analyzeSentiment(text: string): Promise<string>;
}
