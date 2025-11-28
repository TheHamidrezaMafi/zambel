import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import OpenAI from 'openai';
const fetch = require("node-fetch");
const https = require('https');

@Injectable()
export class OpenAIService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('OPENAI_API_KEY'), // استفاده از API Key
      // baseURL="https://api.metisai.ir/openai/v1",
    });
  }

  async getResponse(prompt: string): Promise<object> {
    // const response = await this.openai.completions.create({
    //   model: 'gpt-3.5-turbo-0125', // یا 'gpt-4' اگر دسترسی دارید
    //   prompt,
    //   max_tokens: 150,
    //   temperature: 0.7, // کنترل خلاقیت پاسخ‌ها
    // });
    // return response.choices[0].text.trim();
    const agent = new https.Agent({
      rejectUnauthorized: false
    });
    // const req = await fetch('https://api.metisai.ir/api/v1/chat/session', {
    //   method: 'post',
    //   agent,
    //   body: JSON.stringify({
    //     "botId": "8ad1ecf5-09c4-4a5c-ae16-6eb0e1ba3f8a",
    //     "user": null,
    //     "initialMessages": [
    //       {
    //         "type": "USER",
    //         "content": prompt
    //       }
    //     ]
    //   }),
    //   headers: {
    //     'Content-Type': 'application/json', 
    //     Authorization: ` Bearer tpsg-f17LgKsz4Bfej9UZiZL7zNtDc5k4shX`,
    //   }
    // })
    const req =await axios.post('http://api.metisai.ir/api/v1/chat/session', {
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
    })
    .then(response => console.log(response.data))
    .catch(error => console.error(error));
    // const chat_submit_res = await req.json()
    // console.log(chat_submit_res,'chat_submit_res');
    
    // if (req?.status == 200) {
    //  return this.try_converstion(chat_submit_res?.id,prompt)
    // } 
    return;
  }
  async try_converstion(session_id,prompt=undefined){
    const p= await fetch(`https://api.metisai.ir/api/v1/chat/session/${session_id}/message`, {
      method: 'post',
      body: JSON.stringify({
        "message": {
          "content": prompt,
          "type": "USER"
        }
      }), 
      headers: {
        'Content-Type': 'application/json',
        Authorization: ` Bearer tpsg-f17LgKsz4Bfej9UZiZL7zNtDc5k4shX`,
      }
    })
    return Object.assign(await p.json(),{session_id})
  }
}
