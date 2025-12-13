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
exports.AirportService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const airport_entity_1 = require("./airport.entity");
let AirportService = class AirportService {
    constructor(airportRepository) {
        this.airportRepository = airportRepository;
    }
    async getAirports(page = 1, limit = 10, filters) {
        const offset = (page - 1) * limit;
        const query = this.airportRepository.createQueryBuilder('airport');
        if (filters['iata_code'] || filters['code']) {
            const code = filters['iata_code'] || filters['code'];
            query.andWhere('LOWER(airport.code) LIKE LOWER(:code)', {
                code: `%${code}%`,
            });
        }
        if (filters['icao_code']) {
            query.andWhere('LOWER(airport.code) LIKE LOWER(:code)', {
                code: `%${filters['icao_code']}%`,
            });
        }
        if (filters['persian_name'] || filters['name_fa']) {
            const nameFa = filters['persian_name'] || filters['name_fa'];
            query.andWhere('LOWER(airport.name_fa) LIKE LOWER(:name_fa)', {
                name_fa: `%${nameFa}%`,
            });
        }
        if (filters['english_name'] || filters['name_en']) {
            const nameEn = filters['english_name'] || filters['name_en'];
            query.andWhere('LOWER(airport.name_en) LIKE LOWER(:name_en)', {
                name_en: `%${nameEn}%`,
            });
        }
        if (filters['country_code'] || filters['country']) {
            const country = filters['country_code'] || filters['country'];
            query.andWhere('LOWER(airport.country) LIKE LOWER(:country)', {
                country: `%${country}%`,
            });
        }
        if (filters['city_code']) {
            query.andWhere('LOWER(airport.city_code) LIKE LOWER(:city_code)', {
                city_code: `%${filters['city_code']}%`,
            });
        }
        const [data, total] = await query
            .take(limit)
            .skip(offset)
            .orderBy('airport.city_code', 'ASC')
            .getManyAndCount();
        const transformedData = data.map(airport => (Object.assign(Object.assign({}, airport), { iata_code: airport.code, icao_code: airport.code, persian_name: airport.city_name_fa, english_name: airport.city_name_en, country_code: airport.country === 'Iran' ? 'IR' : 'INTL' })));
        return {
            data: transformedData,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
        };
    }
};
exports.AirportService = AirportService;
exports.AirportService = AirportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(airport_entity_1.Airport)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], AirportService);
//# sourceMappingURL=airport.service.js.map