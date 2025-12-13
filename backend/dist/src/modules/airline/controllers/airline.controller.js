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
exports.AirlineController = void 0;
const common_1 = require("@nestjs/common");
const airline_service_1 = require("../services/airline.service");
let AirlineController = class AirlineController {
    constructor(airlineService) {
        this.airlineService = airlineService;
    }
    async getAll(page = 1, limit = 10, persian_name, english_name, iata_code, code) {
        const filters = {
            persian_name,
            english_name,
            iata_code,
            code,
        };
        return this.airlineService.getAllAirlines(page, limit, filters);
    }
};
exports.AirlineController = AirlineController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('persian_name')),
    __param(3, (0, common_1.Query)('english_name')),
    __param(4, (0, common_1.Query)('iata_code')),
    __param(5, (0, common_1.Query)('code')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AirlineController.prototype, "getAll", null);
exports.AirlineController = AirlineController = __decorate([
    (0, common_1.Controller)('airlines'),
    __metadata("design:paramtypes", [airline_service_1.AirlineService])
], AirlineController);
//# sourceMappingURL=airline.controller.js.map