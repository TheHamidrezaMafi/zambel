const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'chogolisa.liara.cloud',
  port: parseInt(process.env.POSTGRES_PORT || '31593'),
  username: process.env.POSTGRES_USER || 'root',
  password: process.env.POSTGRES_PASSWORD || 'uOdMgLocGZfgtBabCufT46Im',
  database: process.env.POSTGRES_DATABASE || 'postgres',
});

const airports = [
  // Major Iranian Cities
  { code: 'THR', name_en: 'Mehrabad Intl', name_fa: 'فرودگاه مهرآباد', city_code: 'THR', city_name_en: 'Tehran', city_name_fa: 'تهران', country: 'Iran' },
  { code: 'IKA', name_en: 'Imam Khomeini Intl', name_fa: 'فرودگاه امام خمینی', city_code: 'THR', city_name_en: 'Tehran', city_name_fa: 'تهران', country: 'Iran' },
  { code: 'MHD', name_en: 'Shahid Hashemi Nejad', name_fa: 'فرودگاه شهید هاشمی‌نژاد', city_code: 'MHD', city_name_en: 'Mashhad', city_name_fa: 'مشهد', country: 'Iran' },
  { code: 'IFN', name_en: 'Shahid Beheshti Intl', name_fa: 'فرودگاه شهید بهشتی', city_code: 'IFN', city_name_en: 'Isfahan', city_name_fa: 'اصفهان', country: 'Iran' },
  { code: 'SYZ', name_en: 'Shiraz Intl', name_fa: 'فرودگاه بین‌المللی شیراز', city_code: 'SYZ', city_name_en: 'Shiraz', city_name_fa: 'شیراز', country: 'Iran' },
  { code: 'TBZ', name_en: 'Tabriz Intl', name_fa: 'فرودگاه بین‌المللی تبریز', city_code: 'TBZ', city_name_en: 'Tabriz', city_name_fa: 'تبریز', country: 'Iran' },
  { code: 'KIH', name_en: 'Kish Intl', name_fa: 'فرودگاه بین‌المللی کیش', city_code: 'KIH', city_name_en: 'Kish Island', city_name_fa: 'کیش', country: 'Iran' },
  { code: 'AWZ', name_en: 'Ahvaz Intl', name_fa: 'فرودگاه بین‌المللی اهواز', city_code: 'AWZ', city_name_en: 'Ahvaz', city_name_fa: 'اهواز', country: 'Iran' },
  { code: 'KER', name_en: 'Kerman', name_fa: 'فرودگاه کرمان', city_code: 'KER', city_name_en: 'Kerman', city_name_fa: 'کرمان', country: 'Iran' },
  { code: 'BND', name_en: 'Bandar Abbas Intl', name_fa: 'فرودگاه بندرعباس', city_code: 'BND', city_name_en: 'Bandar Abbas', city_name_fa: 'بندرعباس', country: 'Iran' },
  { code: 'ZAH', name_en: 'Zahedan Intl', name_fa: 'فرودگاه زاهدان', city_code: 'ZAH', city_name_en: 'Zahedan', city_name_fa: 'زاهدان', country: 'Iran' },
  { code: 'RAS', name_en: 'Rasht', name_fa: 'فرودگاه رشت', city_code: 'RAS', city_name_en: 'Rasht', city_name_fa: 'رشت', country: 'Iran' },
  { code: 'OMH', name_en: 'Urmia', name_fa: 'فرودگاه ارومیه', city_code: 'OMH', city_name_en: 'Urmia', city_name_fa: 'ارومیه', country: 'Iran' },
  { code: 'KHD', name_en: 'Khorramabad', name_fa: 'فرودگاه خرم‌آباد', city_code: 'KHD', city_name_en: 'Khorramabad', city_name_fa: 'خرم‌آباد', country: 'Iran' },
  { code: 'IIL', name_en: 'Ilam', name_fa: 'فرودگاه ایلام', city_code: 'IIL', city_name_en: 'Ilam', city_name_fa: 'ایلام', country: 'Iran' },
  { code: 'SDJ', name_en: 'Sanandaj', name_fa: 'فرودگاه سنندج', city_code: 'SDJ', city_name_en: 'Sanandaj', city_name_fa: 'سنندج', country: 'Iran' },
  { code: 'HDM', name_en: 'Hamadan', name_fa: 'فرودگاه همدان', city_code: 'HDM', city_name_en: 'Hamadan', city_name_fa: 'همدان', country: 'Iran' },
  { code: 'AZD', name_en: 'Yazd', name_fa: 'فرودگاه یزد', city_code: 'AZD', city_name_en: 'Yazd', city_name_fa: 'یزد', country: 'Iran' },
  { code: 'CQD', name_en: 'Shahrekord', name_fa: 'فرودگاه شهرکرد', city_code: 'CQD', city_name_en: 'Shahrekord', city_name_fa: 'شهرکرد', country: 'Iran' },
  { code: 'GBT', name_en: 'Gorgan', name_fa: 'فرودگاه گرگان', city_code: 'GBT', city_name_en: 'Gorgan', city_name_fa: 'گرگان', country: 'Iran' },
  { code: 'ACZ', name_en: 'Zabol', name_fa: 'فرودگاه زابل', city_code: 'ACZ', city_name_en: 'Zabol', city_name_fa: 'زابل', country: 'Iran' },
  { code: 'SRY', name_en: 'Sari Dasht-e Naz', name_fa: 'فرودگاه ساری', city_code: 'SRY', city_name_en: 'Sari', city_name_fa: 'ساری', country: 'Iran' },
  { code: 'BUZ', name_en: 'Bushehr', name_fa: 'فرودگاه بوشهر', city_code: 'BUZ', city_name_en: 'Bushehr', city_name_fa: 'بوشهر', country: 'Iran' },
  { code: 'KHK', name_en: 'Khark Island', name_fa: 'فرودگاه خارک', city_code: 'KHK', city_name_en: 'Khark Island', city_name_fa: 'خارک', country: 'Iran' },
  { code: 'LRR', name_en: 'Lar', name_fa: 'فرودگاه لار', city_code: 'LRR', city_name_en: 'Lar', city_name_fa: 'لار', country: 'Iran' },
  { code: 'BJB', name_en: 'Bojnord', name_fa: 'فرودگاه بجنورد', city_code: 'BJB', city_name_en: 'Bojnord', city_name_fa: 'بجنورد', country: 'Iran' },
  { code: 'AEU', name_en: 'Abumusa Island', name_fa: 'فرودگاه ابوموسی', city_code: 'AEU', city_name_en: 'Abumusa Island', city_name_fa: 'ابوموسی', country: 'Iran' },
  { code: 'KSH', name_en: 'Kermanshah', name_fa: 'فرودگاه کرمانشاه', city_code: 'KSH', city_name_en: 'Kermanshah', city_name_fa: 'کرمانشاه', country: 'Iran' },
  { code: 'BXR', name_en: 'Bam', name_fa: 'فرودگاه بم', city_code: 'BXR', city_name_en: 'Bam', city_name_fa: 'بم', country: 'Iran' },
  { code: 'AJK', name_en: 'Arak', name_fa: 'فرودگاه اراک', city_code: 'AJK', city_name_en: 'Arak', city_name_fa: 'اراک', country: 'Iran' },
];

async function seedAirports() {
  try {
    await dataSource.initialize();
    console.log('✓ Database connected');

    // Check existing airports
    const existing = await dataSource.query('SELECT code FROM airports');
    const existingCodes = existing.map(a => a.code);
    console.log(`✓ Found ${existing.length} existing airports`);

    let inserted = 0;
    let updated = 0;

    for (const airport of airports) {
      if (existingCodes.includes(airport.code)) {
        // Update existing airport
        await dataSource.query(
          `UPDATE airports SET 
            name_en = $1, 
            name_fa = $2, 
            city_code = $3, 
            city_name_en = $4, 
            city_name_fa = $5, 
            country = $6 
          WHERE code = $7`,
          [airport.name_en, airport.name_fa, airport.city_code, airport.city_name_en, airport.city_name_fa, airport.country, airport.code]
        );
        updated++;
      } else {
        // Insert new airport
        await dataSource.query(
          `INSERT INTO airports (code, name_en, name_fa, city_code, city_name_en, city_name_fa, country, created_at) 
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
          [airport.code, airport.name_en, airport.name_fa, airport.city_code, airport.city_name_en, airport.city_name_fa, airport.country]
        );
        inserted++;
      }
      console.log(`  ✓ ${airport.code} - ${airport.city_name_fa} (${airport.city_name_en})`);
    }

    console.log(`\n✅ Seeding completed!`);
    console.log(`   Inserted: ${inserted} airports`);
    console.log(`   Updated: ${updated} airports`);
    console.log(`   Total: ${airports.length} airports`);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedAirports();
