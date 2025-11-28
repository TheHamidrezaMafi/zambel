"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AirportModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const airport_entity_1 = require("./airport.entity");
const airport_service_1 = require("./airport.service");
const airport_controller_1 = require("./airport.controller");
let AirportModule = class AirportModule {
};
exports.AirportModule = AirportModule;
exports.AirportModule = AirportModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([airport_entity_1.Airport])],
        controllers: [airport_controller_1.AirportController],
        providers: [airport_service_1.AirportService],
        exports: [airport_service_1.AirportService],
    })
], AirportModule);
//# sourceMappingURL=airport.module.js.map