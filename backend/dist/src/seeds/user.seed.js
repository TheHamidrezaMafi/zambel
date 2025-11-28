"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedUsers = seedUsers;
const user_entity_1 = require("../modules/users/models/user.entity");
const mockUsers = [
    { name: 'Ali Rezaei', email: 'ali@example.com' },
    { name: 'Sara Mohammadi', email: 'sara@example.com' },
    { name: 'John Doe', email: 'john@example.com' },
];
async function seedUsers(dataSource) {
    const userRepo = dataSource.getRepository(user_entity_1.User);
    for (const data of mockUsers) {
        const exists = await userRepo.findOneBy({ email: data.email });
        if (!exists) {
            await userRepo.save(userRepo.create(data));
        }
    }
    console.log('✅ Mock users inserted');
}
//# sourceMappingURL=user.seed.js.map