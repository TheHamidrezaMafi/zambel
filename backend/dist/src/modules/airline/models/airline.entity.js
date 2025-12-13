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
exports.Airline = void 0;
const typeorm_1 = require("typeorm");
let Airline = class Airline {
    get persian_name() { return this.name_fa; }
    get english_name() { return this.name_en; }
    get iata_code() { return this.code; }
};
exports.Airline = Airline;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Airline.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], Airline.prototype, "code", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name_fa', nullable: true }),
    __metadata("design:type", String)
], Airline.prototype, "name_fa", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'name_en', nullable: true }),
    __metadata("design:type", String)
], Airline.prototype, "name_en", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'logo_url', nullable: true }),
    __metadata("design:type", String)
], Airline.prototype, "logo_url", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at', nullable: true }),
    __metadata("design:type", Date)
], Airline.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ name: 'updated_at', nullable: true }),
    __metadata("design:type", Date)
], Airline.prototype, "updated_at", void 0);
exports.Airline = Airline = __decorate([
    (0, typeorm_1.Entity)({ name: 'airlines' })
], Airline);
//# sourceMappingURL=airline.entity.js.map