const { Client } = require('pg');

// Database connection from environment or use default
const connectionString = process.env.DATABASE_URL || 'postgresql://root:uOdMgLocGZfgtBabCufT46Im@chogolisa.liara.cloud:31593/postgres';

const internationalAirports = [
  // Turkey
  { code: 'IST', name_en: 'Istanbul Airport', name_fa: 'فرودگاه استانبول', city_code: 'IST', city_name_en: 'Istanbul', city_name_fa: 'استانبول', country: 'Turkey' },
  { code: 'SAW', name_en: 'Sabiha Gokcen Intl', name_fa: 'فرودگاه صبیحه گوکچن', city_code: 'IST', city_name_en: 'Istanbul', city_name_fa: 'استانبول', country: 'Turkey' },
  { code: 'AYT', name_en: 'Antalya Airport', name_fa: 'فرودگاه آنتالیا', city_code: 'AYT', city_name_en: 'Antalya', city_name_fa: 'آنتالیا', country: 'Turkey' },
  
  // UAE
  { code: 'DXB', name_en: 'Dubai Intl', name_fa: 'فرودگاه دبی', city_code: 'DXB', city_name_en: 'Dubai', city_name_fa: 'دبی', country: 'UAE' },
  { code: 'AUH', name_en: 'Abu Dhabi Intl', name_fa: 'فرودگاه ابوظبی', city_code: 'AUH', city_name_en: 'Abu Dhabi', city_name_fa: 'ابوظبی', country: 'UAE' },
  
  // Iraq
  { code: 'BGW', name_en: 'Baghdad Intl', name_fa: 'فرودگاه بغداد', city_code: 'BGW', city_name_en: 'Baghdad', city_name_fa: 'بغداد', country: 'Iraq' },
  { code: 'NJF', name_en: 'Najaf Intl', name_fa: 'فرودگاه نجف', city_code: 'NJF', city_name_en: 'Najaf', city_name_fa: 'نجف', country: 'Iraq' },
  
  // Georgia
  { code: 'TBS', name_en: 'Tbilisi Intl', name_fa: 'فرودگاه تفلیس', city_code: 'TBS', city_name_en: 'Tbilisi', city_name_fa: 'تفلیس', country: 'Georgia' },
  
  // Armenia
  { code: 'EVN', name_en: 'Yerevan Airport', name_fa: 'فرودگاه ایروان', city_code: 'EVN', city_name_en: 'Yerevan', city_name_fa: 'ایروان', country: 'Armenia' },
  
  // Kuwait
  { code: 'KWI', name_en: 'Kuwait Intl', name_fa: 'فرودگاه کویت', city_code: 'KWI', city_name_en: 'Kuwait City', city_name_fa: 'کویت', country: 'Kuwait' },
  
  // Oman
  { code: 'MCT', name_en: 'Muscat Intl', name_fa: 'فرودگاه مسقط', city_code: 'MCT', city_name_en: 'Muscat', city_name_fa: 'مسقط', country: 'Oman' },
  
  // Qatar
  { code: 'DOH', name_en: 'Doha Hamad Intl', name_fa: 'فرودگاه حمد', city_code: 'DOH', city_name_en: 'Doha', city_name_fa: 'دوحه', country: 'Qatar' },
];

async function seedInternationalAirports() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    console.log('✓ Database connected');
    
    // Get existing airports
    const existingResult = await client.query('SELECT code FROM airports WHERE country != $1', ['Iran']);
    const existingCodes = new Set(existingResult.rows.map(row => row.code));
    console.log(`✓ Found ${existingCodes.size} existing international airports`);
    
    let inserted = 0;
    let updated = 0;
    
    for (const airport of internationalAirports) {
      const exists = existingCodes.has(airport.code);
      
      if (exists) {
        // Update existing
        await client.query(
          `UPDATE airports 
           SET name_en = $1, name_fa = $2, city_code = $3, 
               city_name_en = $4, city_name_fa = $5, country = $6
           WHERE code = $7`,
          [airport.name_en, airport.name_fa, airport.city_code, 
           airport.city_name_en, airport.city_name_fa, airport.country, airport.code]
        );
        updated++;
        console.log(`✓ ${airport.code} - ${airport.city_name_fa} (${airport.city_name_en}) - UPDATED`);
      } else {
        // Insert new
        await client.query(
          `INSERT INTO airports (code, name_en, name_fa, city_code, city_name_en, city_name_fa, country)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [airport.code, airport.name_en, airport.name_fa, airport.city_code,
           airport.city_name_en, airport.city_name_fa, airport.country]
        );
        inserted++;
        console.log(`✓ ${airport.code} - ${airport.city_name_fa} (${airport.city_name_en})`);
      }
    }
    
    console.log('\n✅ Seeding completed!');
    console.log(`   Inserted: ${inserted} airports`);
    console.log(`   Updated: ${updated} airports`);
    console.log(`   Total: ${inserted + updated} international airports`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

seedInternationalAirports().catch(console.error);
