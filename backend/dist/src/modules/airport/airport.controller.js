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
exports.AirportController = void 0;
const common_1 = require("@nestjs/common");
const airport_service_1 = require("./airport.service");
let AirportController = class AirportController {
    constructor(airportService) {
        this.airportService = airportService;
    }
    async getAirports(page = 1, limit = 10, iata_code, icao_code, persian_name, english_name, country_code, time_zone, latitude, location_type_id, altitude, order_show) {
        const filters = {
            iata_code,
            icao_code,
            persian_name,
            english_name,
            country_code,
            time_zone,
            latitude,
            location_type_id,
            altitude,
            order_show,
        };
        return this.airportService.getAirports(page, limit, filters);
    }
};
exports.AirportController = AirportController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('iata_code')),
    __param(3, (0, common_1.Query)('icao_code')),
    __param(4, (0, common_1.Query)('persian_name')),
    __param(5, (0, common_1.Query)('english_name')),
    __param(6, (0, common_1.Query)('country_code')),
    __param(7, (0, common_1.Query)('time_zone')),
    __param(8, (0, common_1.Query)('latitude')),
    __param(9, (0, common_1.Query)('location_type_id')),
    __param(10, (0, common_1.Query)('altitude')),
    __param(11, (0, common_1.Query)('order_show')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String, String, Number, Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], AirportController.prototype, "getAirports", null);
exports.AirportController = AirportController = __decorate([
    (0, common_1.Controller)('airports'),
    __metadata("design:paramtypes", [airport_service_1.AirportService])
], AirportController);
//# sourceMappingURL=airport.controller.js.map