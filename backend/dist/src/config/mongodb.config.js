"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
const isDevelopment = process.env.NODE_ENV !== 'production';
exports.default = (0, config_1.registerAs)('mongodb', () => {
    const { MONGO_PORT, MONGO_HOSTNAME, MONGO_DATABASE, MONGO_USERNAME, MONGO_PASSWORD, } = process.env;
    return {
        uri: isDevelopment
            ? `mongodb://${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DATABASE}`
            : `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}/${MONGO_DATABASE}?retryWrites=true&w=majority`,
    };
});
//# sourceMappingURL=mongodb.config.js.map