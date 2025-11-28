"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const database_providers_1 = require("./database.providers");
const airline_entity_1 = require("../../modules/airline/models/airline.entity");
const airport_entity_1 = require("../../modules/airport/airport.entity");
let DatabaseModule = class DatabaseModule {
};
exports.DatabaseModule = DatabaseModule;
exports.DatabaseModule = DatabaseModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forRootAsync({
                useFactory: async () => {
                    const dataSource = await database_providers_1.typeOrmDatabaseProviders[0].useFactory();
                    return Object.assign(Object.assign({}, dataSource.options), { entities: [airline_entity_1.Airline, airport_entity_1.Airport] });
                },
            }),
        ],
        providers: [...database_providers_1.typeOrmDatabaseProviders],
        exports: [...database_providers_1.typeOrmDatabaseProviders],
    })
], DatabaseModule);
//# sourceMappingURL=database.module.js.map