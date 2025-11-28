"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const openai_1 = __importDefault(require("openai"));
const fetch = require("node-fetch");
const https = require('https');
let OpenAIService = class OpenAIService {
    constructor(configService) {
        this.configService = configService;
        this.openai = new openai_1.default({
            apiKey: this.configService.get('OPENAI_API_KEY'),
        });
    }
    async getResponse(prompt) {
        const agent = new https.Agent({
            rejectUnauthorized: false
        });
        const req = await axios_1.default.post('http://api.metisai.ir/api/v1/chat/session', {
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
        })
            .then(response => console.log(response.data))
            .catch(error => console.error(error));
        return;
    }
    async try_converstion(session_id, prompt = undefined) {
        const p = await fetch(`https://api.metisai.ir/api/v1/chat/session/${session_id}/message`, {
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
        });
        return Object.assign(await p.json(), { session_id });
    }
};
exports.OpenAIService = OpenAIService;
exports.OpenAIService = OpenAIService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OpenAIService);
//# sourceMappingURL=openai.service.js.map