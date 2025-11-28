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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScraperService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let ScraperService = class ScraperService {
    constructor(client) {
        this.client = client;
    }
    onModuleInit() {
        this.scraperService =
            this.client.getService('ScraperService');
    }
    normalizeAirlineName(airlineName) {
        if (!airlineName)
            return airlineName;
        const suffixesToRemove = [
            ' ایر',
            ' ایرلاین',
            ' ایرلاینز',
            ' airlines',
            ' airline',
            ' air',
            ' airways',
        ];
        let normalized = airlineName.trim();
        normalized = normalized
            .replace(/ي/g, 'ی')
            .replace(/ك/g, 'ک')
            .replace(/[آأإٱ]/g, 'ا')
            .replace(/ة/g, 'ه')
            .replace(/ؤ/g, 'و')
            .replace(/ئ/g, 'ی');
        for (const suffix of suffixesToRemove) {
            if (normalized.endsWith(suffix)) {
                normalized = normalized.slice(0, -suffix.length).trim();
                break;
            }
        }
        return normalized;
    }
    normalizeFlightNumber(flightNumber) {
        if (!flightNumber)
            return flightNumber;
        const numericPart = flightNumber.replace(/[A-Za-z]/g, '');
        const withoutLeadingZeros = numericPart.replace(/^0+/, '') || '0';
        if (withoutLeadingZeros.length === 5 &&
            withoutLeadingZeros[0] >= '1' &&
            withoutLeadingZeros[0] <= '9') {
            return withoutLeadingZeros.slice(1).replace(/^0+/, '') || '0';
        }
        if (withoutLeadingZeros.length === 4 &&
            withoutLeadingZeros[0] === '9') {
            const result = withoutLeadingZeros.slice(1).replace(/^0+/, '') || '0';
            if (result.length === 3) {
                return result;
            }
        }
        return withoutLeadingZeros;
    }
    normalizeFlightData(flights) {
        return flights.map(flight => {
            const normalizedNumber = this.normalizeFlightNumber(flight.flight_number);
            const normalizedAirline = this.normalizeAirlineName(flight.airline_name_fa);
            return Object.assign(Object.assign({}, flight), { flight_number: normalizedNumber, airline_name_fa: normalizedAirline });
        });
    }
    sortFlightsByDepartureTime(flights) {
        return flights.sort((a, b) => {
            const dateA = new Date(a.departure_date_time).getTime();
            const dateB = new Date(b.departure_date_time).getTime();
            return dateA - dateB;
        });
    }
    async takeRequests(data) {
        const { requests, provider_name } = data;
        const { requested_by_user_id, from_date, to_date, from_destination, to_destination, is_foreign_flight, type, } = requests[0];
        const request = {
            provider_name,
            requests: [
                {
                    requested_by_user_id,
                    from_date,
                    to_date,
                    from_destination,
                    to_destination,
                    is_foreign_flight: is_foreign_flight.toString() === 'true',
                    type,
                },
            ],
        };
        try {
            const observable$ = this.scraperService.TakeRequests(request);
            const response = await (0, rxjs_1.firstValueFrom)(observable$);
            if (response.flights && response.flights.length > 0) {
                let processedFlights = this.normalizeFlightData(response.flights);
                processedFlights = this.sortFlightsByDepartureTime(processedFlights);
                return { flights: processedFlights };
            }
            return response;
        }
        catch (error) {
            console.log('Request: ', request);
            console.log('Error: ', error);
            return { flights: [] };
        }
    }
};
exports.ScraperService = ScraperService;
exports.ScraperService = ScraperService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('SCRAPER_PACKAGE')),
    __metadata("design:paramtypes", [Object])
], ScraperService);
//# sourceMappingURL=scraper.service.js.map