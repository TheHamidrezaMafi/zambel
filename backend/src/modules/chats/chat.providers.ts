import { CHAT_MODEL_NAME } from "./schema/chat.schema";

export const bookingProviders = [{
    provide: CHAT_MODEL_NAME,
    useValue: CHAT_MODEL_NAME,
}];