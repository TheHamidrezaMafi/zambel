import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../modules/users/models/user.entity';
import { seedUsers } from './user.seed';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'chogolisa.liara.cloud',
  port: 34352,
  username: 'root',
  password: 'rWWZ82a4rQn5oBJEnIK9tEBk',
  database: 'postgres',
  entities: [User],
  synchronize: true,
  logging: true,
});

AppDataSource.initialize()
  .then(async () => {
    await seedUsers(AppDataSource);
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
