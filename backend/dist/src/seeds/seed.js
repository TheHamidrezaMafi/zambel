"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../modules/users/models/user.entity");
const user_seed_1 = require("./user.seed");
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: 'chogolisa.liara.cloud',
    port: 34352,
    username: 'root',
    password: 'rWWZ82a4rQn5oBJEnIK9tEBk',
    database: 'postgres',
    entities: [user_entity_1.User],
    synchronize: true,
    logging: true,
});
AppDataSource.initialize()
    .then(async () => {
    await (0, user_seed_1.seedUsers)(AppDataSource);
    process.exit(0);
})
    .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map