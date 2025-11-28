import { DataSource } from 'typeorm';
import { User } from '../modules/users/models/user.entity';

const mockUsers: Partial<User>[] = [
  { name: 'Ali Rezaei', email: 'ali@example.com' },
  { name: 'Sara Mohammadi', email: 'sara@example.com' },
  { name: 'John Doe', email: 'john@example.com' },
];

export async function seedUsers(dataSource: DataSource) {
  const userRepo = dataSource.getRepository(User);

  for (const data of mockUsers) {
    const exists = await userRepo.findOneBy({ email: data.email });
    if (!exists) {
      await userRepo.save(userRepo.create(data));
    }
  }

  console.log('✅ Mock users inserted');
}
