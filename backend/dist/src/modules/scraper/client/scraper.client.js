"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.grpcScraperClientOptions = void 0;
const microservices_1 = require("@nestjs/microservices");
const path_1 = require("path");
exports.grpcScraperClientOptions = {
    transport: microservices_1.Transport.GRPC,
    options: {
        package: 'scraper',
        protoPath: (0, path_1.join)(__dirname, '../../../proto/scraper.proto'),
        url: 'scrapper:50051',
        loader: {
            keepCase: true,
            longs: String,
            enums: String,
            defaults: true,
            oneofs: true,
        },
    },
};
//# sourceMappingURL=scraper.client.js.map