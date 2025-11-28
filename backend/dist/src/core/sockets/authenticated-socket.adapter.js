"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthenticatedSocketAdapter = void 0;
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
class AuthenticatedSocketAdapter extends platform_socket_io_1.IoAdapter {
    constructor(app) {
        super(app);
        this.app = app;
    }
    createIOServer(port, options) {
        const server = super.createIOServer(port, options);
        server.use(async (socket, next) => {
            console.log(`socket server created on ${port}...`, socket);
            try {
                socket.user = {};
                return next();
            }
            catch (error) {
                return next(new Error('Authentication error'));
            }
        });
        return server;
    }
}
exports.AuthenticatedSocketAdapter = AuthenticatedSocketAdapter;
//# sourceMappingURL=authenticated-socket.adapter.js.map