"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const swagger_1 = require("@nestjs/swagger");
const authenticated_socket_adapter_1 = require("./core/sockets/authenticated-socket.adapter");
const config_1 = require("@nestjs/config");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: true });
    const configService = app.get(config_1.ConfigService);
    const port = configService.get('PORT') || 3000;
    const config = new swagger_1.DocumentBuilder()
        .setTitle('Travel Bot API')
        .setDescription('API for interacting with the Travel Bot')
        .setVersion('1.0')
        .addTag('chat')
        .addTag('flights')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api', app, document);
    app.useWebSocketAdapter(new authenticated_socket_adapter_1.AuthenticatedSocketAdapter(app));
    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map