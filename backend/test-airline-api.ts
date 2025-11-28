import { DataSource } from 'typeorm';
import { Airline } from './src/modules/airline/models/airline.entity';
import * as fs from 'fs';
import * as path from 'path';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'chogolisa.liara.cloud',
  port: 34352,
  username: 'root',
  password: 'rWWZ82a4rQn5oBJEnIK9tEBk',
  database: 'postgres',
  entities: [Airline],
  synchronize: false,
});

// Load logo map
const logoMapPath = path.join(__dirname, 'src/assets/logos/logo-map.json');
const logoMap = JSON.parse(fs.readFileSync(logoMapPath, 'utf-8'));

function getLocalLogoUrl(airline: any): string {
  if (airline.iata_code && logoMap[airline.iata_code]) {
    const relativePath = logoMap[airline.iata_code].replace('./', '/');
    return relativePath;
  }
  return airline.logo_url || '';
}

async function run() {
  await AppDataSource.initialize();
  const airlineRepo = AppDataSource.getRepository(Airline);
  
  const testCodes = ['atl', 'IRZ', 'RI', 'IR', 'Y9'];
  
  console.log('🧪 Testing airline logo URL mapping:\n');
  
  for (const code of testCodes) {
    const airline = await airlineRepo.findOne({ where: { iata_code: code } });
    if (airline) {
      const localUrl = getLocalLogoUrl(airline);
      console.log(`${code} (${airline.persian_name}):`);
      console.log(`  Database URL: ${airline.logo_url}`);
      console.log(`  Local URL:    ${localUrl}`);
      console.log(`  In logo-map:  ${logoMap[code] ? '✅' : '❌'}`);
      console.log('');
    } else {
      console.log(`${code}: NOT FOUND IN DATABASE\n`);
    }
  }
  
  await AppDataSource.destroy();
}

run().catch(console.error);
