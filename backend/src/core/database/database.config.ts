import * as dotenv from 'dotenv';
import { IDatabaseConfig } from './interfaces/dbConfig.interface';

dotenv.config();

export const databaseConfig: IDatabaseConfig = {
    development: {
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME_DEVELOPMENT,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
        operationsAliases: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 1000
            },
        
    },
    test: {
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME_TEST,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: process.env.DB_DIALECT,
        operationsAliases: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 1000
            },
    },
    production: {
        username: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME_PRODUCTION,
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        operationsAliases: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 1000
            },
        }
};