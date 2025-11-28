"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.typeOrmDatabaseProviders = void 0;
const typeorm_1 = require("typeorm");
const constants_1 = require("../../core/constants");
const database_config_1 = require("./database.config");
const airline_entity_1 = require("../../modules/airline/models/airline.entity");
exports.typeOrmDatabaseProviders = [
    {
        provide: 'DATA_SOURCE',
        useFactory: async () => {
            let config;
            switch (process.env.NODE_ENV) {
                case constants_1.DEVELOPMENT:
                    config = database_config_1.databaseConfig.development;
                    break;
                case constants_1.TEST:
                    config = database_config_1.databaseConfig.test;
                    break;
                case constants_1.PRODUCTION:
                    config = database_config_1.databaseConfig.production;
                    break;
                default:
                    config = database_config_1.databaseConfig.development;
            }
            const dataSource = new typeorm_1.DataSource({
                type: 'postgres',
                host: 'chogolisa.liara.cloud',
                port: 34352,
                username: 'root',
                password: 'rWWZ82a4rQn5oBJEnIK9tEBk',
                database: 'postgres',
                entities: [airline_entity_1.Airline],
                synchronize: false,
            });
            return await dataSource.initialize();
        },
    },
];
//# sourceMappingURL=database.providers.js.map