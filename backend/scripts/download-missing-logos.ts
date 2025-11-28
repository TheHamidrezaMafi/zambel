import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { pipeline } from 'stream/promises';

const OUTPUT_DIR = path.join(__dirname, '../src/assets/logos/airlines');
const MAPPING_PATH = path.join(__dirname, '../src/assets/logos/logo-map.json');

// Missing airline IATA codes to download
const MISSING_AIRLINES = ['atl', 'IRZ'];

// Sources to try in order
const SOURCES = [
  (iataCode: string) => `https://cdn.alibaba.ir/static/img/airlines/Domestic/${iataCode}.png`,
  (iataCode: string) => `https://images.kiwi.com/airlines/64/${iataCode}.png`,
  (iataCode: string) => `https://pics.avs.io/200/200/${iataCode}.png`,
  (iataCode: string) => `https://content.airhex.com/content/logos/airlines_${iataCode}_200_200_s.png`,
];

async function downloadImage(url: string, filepath: string): Promise<void> {
  const response = await axios.get(url, { responseType: 'stream', timeout: 10000 });
  await pipeline(response.data, fs.createWriteStream(filepath));
}

async function downloadMissingLogo(iataCode: string): Promise<boolean> {
  const filename = `${iataCode}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);

  console.log(`\nTrying to download logo for ${iataCode}...`);

  for (let i = 0; i < SOURCES.length; i++) {
    const url = SOURCES[i](iataCode);
    try {
      console.log(`  Attempting source ${i + 1}: ${url}`);
      await downloadImage(url, filepath);
      console.log(`  ✅ Successfully downloaded from source ${i + 1}`);
      return true;
    } catch (error) {
      console.log(`  ❌ Failed from source ${i + 1}`);
    }
  }

  console.log(`  ⚠️  All sources failed for ${iataCode}`);
  return false;
}

async function run() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const existingMap: Record<string, string> = fs.existsSync(MAPPING_PATH)
    ? JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'))
    : {};

  const successful: string[] = [];
  const failed: string[] = [];

  for (const iataCode of MISSING_AIRLINES) {
    const success = await downloadMissingLogo(iataCode);
    if (success) {
      successful.push(iataCode);
      existingMap[iataCode] = `./assets/logos/airlines/${iataCode}.png`;
    } else {
      failed.push(iataCode);
    }
  }

  // Update the mapping file
  if (successful.length > 0) {
    fs.writeFileSync(MAPPING_PATH, JSON.stringify(existingMap, null, 2));
    console.log('\n✅ Updated logo mapping file');
  }

  console.log('\n' + '='.repeat(50));
  console.log('SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Successfully downloaded: ${successful.length}`);
  if (successful.length > 0) {
    console.log(`   ${successful.join(', ')}`);
  }
  
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}`);
    console.log(`   ${failed.join(', ')}`);
  }
}

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
