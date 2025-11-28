import { ConfigService } from '@nestjs/config';
export declare class OpenAIService {
    private configService;
    private openai;
    constructor(configService: ConfigService);
    getResponse(prompt: string): Promise<object>;
    try_converstion(session_id: any, prompt?: any): Promise<any>;
}
