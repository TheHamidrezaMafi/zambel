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
        if (filters.iata_code) {
            query.andWhere('LOWER(airport.iata_code) LIKE LOWER(:iata_code)', {
                iata_code: `%${filters.iata_code}%`,
            });
        }
        if (filters.icao_code) {
            query.andWhere('LOWER(airport.icao_code) LIKE LOWER(:icao_code)', {
                icao_code: `%${filters.icao_code}%`,
            });
        }
        if (filters.persian_name) {
            query.andWhere('LOWER(airport.persian_name) LIKE LOWER(:persian_name)', {
                persian_name: `%${filters.persian_name}%`,
            });
        }
        if (filters.english_name) {
            query.andWhere('LOWER(airport.english_name) LIKE LOWER(:english_name)', {
                english_name: `%${filters.english_name}%`,
            });
        }
        if (filters.country_code) {
            query.andWhere('LOWER(airport.country_code) LIKE LOWER(:country_code)', {
                country_code: `%${filters.country_code}%`,
            });
        }
        if (filters.time_zone) {
            query.andWhere('airport.time_zone = :time_zone', {
                time_zone: filters.time_zone,
            });
        }
        if (filters.latitude) {
            query.andWhere('airport.latitude = :latitude', {
                latitude: filters.latitude,
            });
        }
        if (filters.location_type_id) {
            query.andWhere('airport.location_type_id = :location_type_id', {
                location_type_id: filters.location_type_id,
            });
        }
        if (filters.altitude) {
            query.andWhere('airport.altitude = :altitude', {
                altitude: filters.altitude,
            });
        }
        if (filters.order_show) {
            query.andWhere('airport.order_show = :order_show', {
                order_show: filters.order_show,
            });
        }
        const [data, total] = await query
            .take(limit)
            .skip(offset)
            .orderBy('airport.order_show', 'ASC')
            .getManyAndCount();
        return {
            data,
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