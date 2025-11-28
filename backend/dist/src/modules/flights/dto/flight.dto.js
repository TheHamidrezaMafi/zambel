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
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlightSearchDTO = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class FlightSearchDTO {
}
exports.FlightSearchDTO = FlightSearchDTO;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'مبدا سفر', example: 'THR' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], FlightSearchDTO.prototype, "origin", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'مقصد سفر', example: 'MSH' }),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], FlightSearchDTO.prototype, "destination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'تاریخ شروع سفر', example: '2025-01-25' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], FlightSearchDTO.prototype, "start_date", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'تاریخ بازگشت', example: '2025-01-28' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], FlightSearchDTO.prototype, "return_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'تعداد بزرگسالان', example: 2 }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FlightSearchDTO.prototype, "adult", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'تعداد کودکان', example: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], FlightSearchDTO.prototype, "children", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'کد یونیک هر درخواست', example: '' }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FlightSearchDTO.prototype, "uuid", void 0);
//# sourceMappingURL=flight.dto.js.map