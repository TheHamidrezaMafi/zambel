"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirlineModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const airline_entity_1 = require("./models/airline.entity");
const airline_controller_1 = require("./controllers/airline.controller");
const airline_service_1 = require("./services/airline.service");
let AirlineModule = class AirlineModule {
};
exports.AirlineModule = AirlineModule;
exports.AirlineModule = AirlineModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([airline_entity_1.Airline])],
        controllers: [airline_controller_1.AirlineController],
        providers: [airline_service_1.AirlineService],
        exports: [airline_service_1.AirlineService],
    })
], AirlineModule);
//# sourceMappingURL=airline.module.js.map