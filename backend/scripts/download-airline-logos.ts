import { DataSource } from 'typeorm';
import { Airline } from '../src/modules/airline/models/airline.entity';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';

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

const OUTPUT_DIR = path.join(__dirname, '../src/assets/logos/airlines');
const MAPPING_PATH = path.join(__dirname, '../src/assets/logos/logo-map.json');

// Alternative sources for airline logos
const FALLBACK_SOURCES = [
  (iataCode: string) => `https://cdn.alibaba.ir/static/img/airlines/Domestic/${iataCode}.png`,
  (iataCode: string) => `https://images.kiwi.com/airlines/64/${iataCode}.png`,
  (iataCode: string) => `https://pics.avs.io/200/200/${iataCode}.png`,
  (iataCode: string) => `https://content.airhex.com/content/logos/airlines_${iataCode}_200_200_s.png`,
];

async function downloadImage(url: string, filename: string) {
  const filepath = path.join(OUTPUT_DIR, filename);
  const response = await axios.get(url, { responseType: 'stream', timeout: 10000 });
  await pipeline(response.data, fs.createWriteStream(filepath));
}

async function tryDownloadFromMultipleSources(iataCode: string, primaryUrl: string, filename: string): Promise<boolean> {
  // Try primary URL first
  try {
    await downloadImage(primaryUrl, filename);
    console.log(`✅ Downloaded from primary source: ${filename}`);
    return true;
  } catch (primaryError) {
    console.warn(`⚠️  Primary source failed for ${iataCode}, trying fallbacks...`);
  }

  // Try fallback sources
  for (let i = 0; i < FALLBACK_SOURCES.length; i++) {
    const fallbackUrl = FALLBACK_SOURCES[i](iataCode);
    try {
      await downloadImage(fallbackUrl, filename);
      console.log(`✅ Downloaded from fallback ${i + 1}: ${filename}`);
      return true;
    } catch (fallbackError) {
      // Continue to next fallback
    }
  }

  console.error(`❌ All sources failed for ${iataCode}`);
  return false;
}

async function run() {
  await AppDataSource.initialize();
  const airlineRepo = AppDataSource.getRepository(Airline);
  const airlines = await airlineRepo.find();

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const existingMap: Record<string, string> = fs.existsSync(MAPPING_PATH)
    ? JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'))
    : {};

  const updatedMap: Record<string, string> = {};
  const failedAirlines: string[] = [];

  for (const airline of airlines) {
    if (!airline.logo_url || !airline.iata_code) continue;

    const ext = path.extname(airline.logo_url).split('?')[0] || '.png';
    const safeFilename = `${airline.iata_code}${ext}`.replace(
      /[^a-zA-Z0-9_.-]/g,
      '_',
    );
    const filepath = path.join(OUTPUT_DIR, safeFilename);

    const currentLogoPath = `./assets/logos/airlines/${safeFilename}`;
    const hasChanged = existingMap[airline.iata_code] !== currentLogoPath;

    if (!fs.existsSync(filepath) || hasChanged) {
      // Delete old logo if path changed
      if (
        existingMap[airline.iata_code] &&
        existingMap[airline.iata_code] !== currentLogoPath
      ) {
        const oldFilePath = path.join(
          __dirname,
          '../src',
          existingMap[airline.iata_code],
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
          console.log(`🗑️ Deleted old logo for ${airline.iata_code}`);
        }
      }

      // Try downloading from multiple sources
      const success = await tryDownloadFromMultipleSources(
        airline.iata_code,
        airline.logo_url,
        safeFilename
      );

      if (!success) {
        failedAirlines.push(airline.iata_code);
        continue;
      }
    }

    updatedMap[airline.iata_code] = currentLogoPath;
  }

  fs.writeFileSync(MAPPING_PATH, JSON.stringify(updatedMap, null, 2));
  
  console.log('\\n🎉 Logo download process completed!');
  console.log(`✅ Successfully processed: ${Object.keys(updatedMap).length} airlines`);
  
  if (failedAirlines.length > 0) {
    console.log(`\\n⚠️  Failed to download logos for ${failedAirlines.length} airlines:`);
    console.log(failedAirlines.join(', '));
  }

  await AppDataSource.destroy();
}

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
