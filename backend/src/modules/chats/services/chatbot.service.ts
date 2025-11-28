import { HttpException, Injectable } from '@nestjs/common';
import { OpenAIService } from './openai.service';
import { StateManager } from '../managers/state-manager';
import { AIService } from './ai.service';
import { ChatsService } from './chats.service';
import { TravelRequestsService } from './travel-requests.service';
import { TravelRequest } from '../schema/travel-request.schema';
import { CITIES } from '../cities';
import { parseDate } from '../utils/date-utils';
import { parseBudget } from '../utils/budget-utils';
import { ScraperClientService } from './scraper-client.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ChatbotService {
  constructor(
    // private eventEmitter: EventEmitter2,
    private openaiService: OpenAIService,
    private stateManager: StateManager,
    private aiService: AIService, 
    private chatsService: ChatsService,
    private travelRequestsService: TravelRequestsService,
    private scraperClientService: ScraperClientService,
    
  ) { } 

  async handleMessage({ userId, message, ...body }): Promise<object> {
    const state = this.stateManager.getState(userId);
    let response: Object;
    let conversationId = body?.conversationId || state[0]?.conversationId
    // بررسی پاسخ‌های از پیش تعریف شده
    // const predefinedResponse = this.aiService.getPredefinedResponse(message);
    // if (predefinedResponse) {
    //   response = predefinedResponse;
    // } else {
    // استفاده از OpenAI
    if (conversationId) {
      response = await this.openaiService.try_converstion(conversationId, message);
    }
    else {
      response = await this.openaiService.getResponse(message);
      conversationId = response['id']
    }
    // }
    console.log(response, 'pppppppp');
    if (!response) {
      return new HttpException({
        message: 'خطایی در عملیات بوجود آمده است',
        status: 400
      }, 400)
    }


    // ذخیره پیام در دیتابیس
    await this.chatsService.saveMessage(
      userId,
      conversationId,
      message,
      'user',
    );
    await this.chatsService.saveMessage(
      userId,
      conversationId,
      typeof response == 'string' ? response : response['content'],
      'bot',
    );

    
    if (response['content'].includes('destination=')) {
      this.sendToScraper(response['content'])
    }
    if (typeof response != 'string') {
      response['content'] = response['content'].replace(/\n\n```\n\"destination=.*\"\n```\n\n/g, '')
    }
    // ذخیره اطلاعات سفر
    await this.updateTravelRequest(conversationId, message);
    return response;
  }
  async getChatResponse(message: string, userId: undefined): Promise<object> {
    const state = this.stateManager.getState(userId)[0];

    let prompt = '';
    if (!state.step) {
      prompt = `کاربر جدید وارد شده است. به او خوش‌آمد بگو و از او بپرس به کجا می‌خواهد سفر کند.`;
      state.step = 'destination';
    } else if (state.step === 'destination') {
      if (message.includes('سفر')) {
        const destination = this.extractDestination(message);
        prompt = `کاربر می‌خواهد به ${destination} سفر کند. اطلاعات کامل‌تری در مورد سفر به ${destination} ارائه بده.`;
        state.step = 'info';
      } else {
        prompt = `کاربر می‌خواهد به ${message} سفر کند. از او بپرس تاریخ سفر را انتخاب کند.`;
        state.step = 'date';
      }
    } else if (state.step === 'info') {
      prompt = `کاربر درخواست اطلاعات بیشتر کرده است. اطلاعات کامل‌تری در مورد سفر به ${state.destination} ارائه بده.`;
      state.step = 'complete';
    } else if (state.step === 'date') {
      prompt = `کاربر تاریخ سفر را انتخاب کرده است (${message}). از او بپرس بودجه سفر چقدر است.`;
      state.step = 'budget';
    } else if (state.step === 'budget') {
      prompt = `کاربر بودجه سفر را مشخص کرده است (${message}). اطلاعات را جمع‌آوری کن و پیشنهادات هتل و پرواز را ارائه بده.`;
      state.step = 'complete';
    }

    this.stateManager.setState(userId, state);
    const response = await this.openaiService.getResponse(prompt);
    return response;
  }


  private isHotelOrFlightRequest(message: string): boolean {
    return message.includes('هتل') || message.includes('پرواز');
  }

  private async sendToScraper(travelRequest: string): Promise<void> {
    
    // ارسال درخواست به ربات اسکرپر برای جستجوی هتل و پرواز
    // این بخش نیاز به پیاده‌سازی دارد.
    const regex = /"([^"]+)"/;
    const match = travelRequest.match(regex);

    if (match && match[1]) {
      const extractedString = match[1];
      const queryObject = extractedString.split('&').reduce((acc, pair) => {
        const [key, value] = pair.split('='); // جدا کردن کلید و مقدار
        acc[key] = value; // اضافه کردن به شیء
        return acc;
      }, {});
      console.log(extractedString,'extractedString');
      
      if (extractedString.includes('is_hotel')) {
        this.searchHotels(Object.assign(queryObject,{
          checkinDate:queryObject['departing'],
          checkoutDate:queryObject['last_date']
        }))
      }
      if (extractedString.includes('is_flight')) {
        this.searchFlights(queryObject['origin'],queryObject['destination'],queryObject['departing'],queryObject['last_date'])
      }
      console.log(extractedString); // خروجی: destination=KIH&origin=AWZ&adult=1&child=0&infant=0&departing=1403-10-20
    } else {
      console.log("رشته مورد نظر یافت نشد.");
    }
  }
  async searchHotels(queryObject:Object): Promise<any> {
    return this.scraperClientService.searchHotels(queryObject);
  }

  async searchFlights(origin: string, destination: string, date: string,return_date=undefined): Promise<any> {
    return this.scraperClientService.searchFlights(origin, destination, date,return_date,{});
  }
  private extractDestination(message: string): string {
    // استخراج نام مقصد از پیام کاربر
    const destinations = ['شیراز', 'تهران', 'مشهد', 'اصفهان'];
    for (const destination of destinations) {
      if (message.includes(destination)) {
        return destination;
      }
    }
    return 'مقصد نامشخص';
  }
  isTravelInfo(message: string): boolean {
    // بررسی اینکه پیام مربوط به اطلاعات سفر است یا نه
    const res =
      message.includes('شهر مبدأ') ||
      message.includes('شهر مقصد') ||
      message.includes('تاریخ حرکت') ||
      message.includes('تاریخ برگشت') ||
      message.includes('بودجه');
    return res;
  }
  private isTravelInfoComplete(travelInfo: any): boolean {
    return (
      travelInfo.origin &&
      travelInfo.destination &&
      travelInfo.departureDate &&
      travelInfo.returnDate &&
      travelInfo.budget
    );
  }

  private async updateTravelRequest(
    conversationId: string,
    message: string,
  ): Promise<void> {
    // استخراج اطلاعات سفر از پیام و ذخیره در دیتابیس
    // const travelRequest = await this.travelRequestsService.updateTravelRequest(
    //   conversationId,
    //   {
    //     // استخراج و ذخیره اطلاعات
    //   },
    // );
    // استخراج اطلاعات سفر از پیام
    const travelInfo = this.extractTravelInfo(message);
    // تکمیل اطلاعات ناقص از سابقه چت
    const travelRequest = await this.travelRequestsService.getTravelRequest(
      conversationId,
    );
    if (travelRequest) {
      if (!travelInfo.origin && travelRequest.origin) {
        travelInfo.origin = travelRequest.origin;
      }
      if (!travelInfo.destination && travelRequest.destination) {
        travelInfo.destination = travelRequest.destination;
      }
      if (!travelInfo.departureDate && travelRequest.departureDate) {
        travelInfo.departureDate = travelRequest.departureDate;
      }
      if (!travelInfo.returnDate && travelRequest.returnDate) {
        travelInfo.returnDate = travelRequest.returnDate;
      }
      if (!travelInfo.budget && travelRequest.budget) {
        travelInfo.budget = travelRequest.budget;
      }
    }
    // ذخیره اطلاعات در دیتابیس
    if (Object.keys(travelInfo).length > 0) {
      await this.travelRequestsService.updateTravelRequest(
        conversationId,
        travelInfo,
      );
    }
  }

  extractTravelInfo(message: string): Partial<TravelRequest> {
    const travelInfo: {
      origin?: string;
      destination?: string;
      departureDate?: Date;
      returnDate?: Date;
      budget?: number;
    } = {};

    // استخراج شهر مبدأ
    const originMatch = message.match(/از (.*?) برم|شهر مبدأ (.*?)$/i);
    if (originMatch) {
      const origin = originMatch[1] || originMatch[2];
      if (CITIES.includes(origin)) {
        travelInfo.origin = origin;
      }
    }

    // // استخراج شهر مقصد
    // const destinationMatch = message.match(/شهر مقصد:\s*(\w+)/i);
    // if (destinationMatch) {
    //   travelInfo.destination = destinationMatch[1];
    // }

    // استخراج شهر مقصد
    const destinationMatch = message.match(/به (.*?) برم|شهر مقصد (.*?)$/i);
    if (destinationMatch) {
      const destination = destinationMatch[1] || destinationMatch[2];
      if (CITIES.includes(destination)) {
        travelInfo.destination = destination;
      }
    }
    // // استخراج تاریخ حرکت
    // const departureDateMatch = message.match(
    //   /تاریخ حرکت:\s*(\d{4}-\d{2}-\d{2})/i,
    // );
    // if (departureDateMatch) {
    //   travelInfo.departureDate = new Date(departureDateMatch[1]);
    // }
    // استخراج تاریخ حرکت
    const departureDateMatch = message.match(/تاریخ حرکت (.*?)$|در (.*?) برم/i);
    if (departureDateMatch) {
      const dateString = departureDateMatch[1] || departureDateMatch[2];
      travelInfo.departureDate = parseDate(dateString);
    }

    // استخراج تاریخ برگشت
    const returnDateMatch = message.match(/تاریخ برگشت (.*?)$/i);
    if (returnDateMatch) {
      travelInfo.returnDate = parseDate(returnDateMatch[1]);
    }
    // استخراج تاریخ حرکت
    const departureDateMatchFromP = message.match(
      /تاریخ حرکت (.*?)$|در (.*?) برم/i,
    );
    if (departureDateMatch) {
      const dateString = departureDateMatch[1] || departureDateMatch[2];
      travelInfo.departureDate = this.parseDate(dateString);
    }
    // // استخراج تاریخ برگشت
    // const returnDateMatch = message.match(
    //   /تاریخ برگشت:\s*(\d{4}-\d{2}-\d{2})/i,
    // );
    // if (returnDateMatch) {
    //   travelInfo.returnDate = new Date(returnDateMatch[1]);
    // }

    // // استخراج بودجه
    // const budgetMatch = message.match(/بودجه:\s*(\d+)/i);
    // if (budgetMatch) {
    //   travelInfo.budget = parseInt(budgetMatch[1], 10);
    // }
    // استخراج بودجه
    const budgetMatch = message.match(/بودجه (.*?) تومان|بودجه (.*?) دلار/i);
    if (budgetMatch) {
      const budgetString = budgetMatch[1] || budgetMatch[2];
      travelInfo.budget = parseBudget(budgetString);
    }

    return travelInfo;
  }
  private parseDate(dateString: string): Date | undefined {
    // تبدیل تاریخ به فرمت Date
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  }
}
function InjectQueue(arg0: string): (target: typeof ChatbotService, propertyKey: undefined, parameterIndex: 6) => void {
  throw new Error('Function not implemented.');
}

