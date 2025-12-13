const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'chogolisa.liara.cloud',
  port: parseInt(process.env.POSTGRES_PORT || '31593'),
  username: process.env.POSTGRES_USER || 'root',
  password: process.env.POSTGRES_PASSWORD || 'uOdMgLocGZfgtBabCufT46Im',
  database: process.env.POSTGRES_DATABASE || 'postgres',
});

async function runMigration() {
  try {
    await dataSource.initialize();
    console.log('✓ Database connected');
    
    // Enable UUID extension
    await dataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✓ UUID extension enabled');

    // Check if tables already exist
    const tablesExist = await dataSource.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'route_configs'
      );
    `);

    if (tablesExist[0].exists) {
      console.log('✓ Flight tracking tables already exist, skipping migration');
      await dataSource.destroy();
      return;
    }

    console.log('Creating flight tracking tables...');

    // Create tracked_flights table
    await dataSource.query(`
      CREATE TABLE "tracked_flights" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "flight_number" character varying(10) NOT NULL,
        "flight_date" date NOT NULL,
        "origin" character varying(3) NOT NULL,
        "destination" character varying(3) NOT NULL,
        "airline_name_fa" character varying(100),
        "airline_name_en" character varying(100),
        "departure_time" TIMESTAMP,
        "arrival_time" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "last_tracked_at" TIMESTAMP,
        "is_active" boolean NOT NULL DEFAULT true,
        "current_lowest_price" numeric(12,0),
        "current_lowest_price_provider" character varying(50),
        "current_lowest_price_updated_at" TIMESTAMP,
        "metadata" jsonb,
        CONSTRAINT "PK_tracked_flights" PRIMARY KEY ("id")
      )
    `);
    console.log('✓ Created tracked_flights table');

    // Create indexes for tracked_flights
    await dataSource.query(`
      CREATE UNIQUE INDEX "IDX_tracked_flights_unique" 
      ON "tracked_flights" ("flight_number", "flight_date", "origin", "destination")
    `);
    await dataSource.query(`
      CREATE INDEX "IDX_tracked_flights_date" 
      ON "tracked_flights" ("flight_date")
    `);
    await dataSource.query(`
      CREATE INDEX "IDX_tracked_flights_route" 
      ON "tracked_flights" ("origin", "destination")
    `);
    console.log('✓ Created tracked_flights indexes');

    // Create flight_price_history table
    await dataSource.query(`
      CREATE TABLE "flight_price_history" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tracked_flight_id" uuid NOT NULL,
        "provider" character varying(50) NOT NULL,
        "adult_price" numeric(12,0) NOT NULL,
        "child_price" numeric(12,0),
        "infant_price" numeric(12,0),
        "available_seats" integer,
        "scraped_at" TIMESTAMP NOT NULL DEFAULT now(),
        "is_available" boolean NOT NULL DEFAULT true,
        "raw_data" jsonb,
        "price_change_percentage" numeric(5,2),
        "price_change_amount" numeric(12,0),
        CONSTRAINT "PK_flight_price_history" PRIMARY KEY ("id")
      )
    `);
    console.log('✓ Created flight_price_history table');

    // Create indexes for flight_price_history
    await dataSource.query(`
      CREATE INDEX "IDX_price_history_flight_scraped" 
      ON "flight_price_history" ("tracked_flight_id", "scraped_at")
    `);
    await dataSource.query(`
      CREATE INDEX "IDX_price_history_scraped" 
      ON "flight_price_history" ("scraped_at")
    `);
    await dataSource.query(`
      CREATE INDEX "IDX_price_history_provider" 
      ON "flight_price_history" ("provider")
    `);
    console.log('✓ Created flight_price_history indexes');

    // Create foreign key for flight_price_history
    await dataSource.query(`
      ALTER TABLE "flight_price_history" 
      ADD CONSTRAINT "FK_flight_price_history_tracked_flight" 
      FOREIGN KEY ("tracked_flight_id") 
      REFERENCES "tracked_flights"("id") 
      ON DELETE CASCADE
    `);
    console.log('✓ Created flight_price_history foreign key');

    // Create lowest_price_snapshots table
    await dataSource.query(`
      CREATE TABLE "lowest_price_snapshots" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tracked_flight_id" uuid NOT NULL,
        "lowest_price" numeric(12,0) NOT NULL,
        "provider" character varying(50) NOT NULL,
        "scraped_at" TIMESTAMP NOT NULL DEFAULT now(),
        "price_change_percentage" numeric(5,2),
        "price_change_amount" numeric(12,0),
        "comparison_data" jsonb,
        CONSTRAINT "PK_lowest_price_snapshots" PRIMARY KEY ("id")
      )
    `);
    console.log('✓ Created lowest_price_snapshots table');

    // Create indexes for lowest_price_snapshots
    await dataSource.query(`
      CREATE INDEX "IDX_lowest_price_flight_scraped" 
      ON "lowest_price_snapshots" ("tracked_flight_id", "scraped_at")
    `);
    await dataSource.query(`
      CREATE INDEX "IDX_lowest_price_scraped" 
      ON "lowest_price_snapshots" ("scraped_at")
    `);
    console.log('✓ Created lowest_price_snapshots indexes');

    // Create foreign key for lowest_price_snapshots
    await dataSource.query(`
      ALTER TABLE "lowest_price_snapshots" 
      ADD CONSTRAINT "FK_lowest_price_snapshots_tracked_flight" 
      FOREIGN KEY ("tracked_flight_id") 
      REFERENCES "tracked_flights"("id") 
      ON DELETE CASCADE
    `);
    console.log('✓ Created lowest_price_snapshots foreign key');

    // Create route_configs table
    await dataSource.query(`
      CREATE TABLE "route_configs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "origin" character varying(3) NOT NULL,
        "destination" character varying(3) NOT NULL,
        "origin_name_fa" character varying(100),
        "destination_name_fa" character varying(100),
        "is_active" boolean NOT NULL DEFAULT true,
        "days_ahead" integer NOT NULL DEFAULT 7,
        "tracking_interval_minutes" integer NOT NULL DEFAULT 60,
        "last_tracked_at" TIMESTAMP,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "tracking_settings" jsonb,
        CONSTRAINT "PK_route_configs" PRIMARY KEY ("id")
      )
    `);
    console.log('✓ Created route_configs table');

    // Create indexes for route_configs
    await dataSource.query(`
      CREATE UNIQUE INDEX "IDX_route_configs_unique" 
      ON "route_configs" ("origin", "destination")
    `);
    console.log('✓ Created route_configs indexes');

    // Insert default route configurations
    await dataSource.query(`
      INSERT INTO "route_configs" 
        ("id", "origin", "destination", "origin_name_fa", "destination_name_fa", "is_active", "days_ahead", "tracking_interval_minutes") 
      VALUES
        (uuid_generate_v4(), 'THR', 'MHD', 'تهران', 'مشهد', true, 7, 60),
        (uuid_generate_v4(), 'THR', 'KIH', 'تهران', 'کیش', true, 7, 60),
        (uuid_generate_v4(), 'THR', 'TBZ', 'تهران', 'تبریز', true, 7, 60),
        (uuid_generate_v4(), 'THR', 'IFN', 'تهران', 'اصفهان', true, 7, 60),
        (uuid_generate_v4(), 'MHD', 'THR', 'مشهد', 'تهران', true, 7, 60),
        (uuid_generate_v4(), 'KIH', 'THR', 'کیش', 'تهران', true, 7, 60),
        (uuid_generate_v4(), 'TBZ', 'THR', 'تبریز', 'تهران', true, 7, 60),
        (uuid_generate_v4(), 'IFN', 'THR', 'اصفهان', 'تهران', true, 7, 60),
        (uuid_generate_v4(), 'MHD', 'KIH', 'مشهد', 'کیش', true, 7, 60),
        (uuid_generate_v4(), 'MHD', 'TBZ', 'مشهد', 'تبریز', true, 7, 60),
        (uuid_generate_v4(), 'MHD', 'IFN', 'مشهد', 'اصفهان', true, 7, 60),
        (uuid_generate_v4(), 'KIH', 'MHD', 'کیش', 'مشهد', true, 7, 60),
        (uuid_generate_v4(), 'TBZ', 'MHD', 'تبریز', 'مشهد', true, 7, 60),
        (uuid_generate_v4(), 'IFN', 'MHD', 'اصفهان', 'مشهد', true, 7, 60),
        (uuid_generate_v4(), 'KIH', 'TBZ', 'کیش', 'تبریز', true, 7, 60),
        (uuid_generate_v4(), 'KIH', 'IFN', 'کیش', 'اصفهان', true, 7, 60),
        (uuid_generate_v4(), 'TBZ', 'KIH', 'تبریز', 'کیش', true, 7, 60),
        (uuid_generate_v4(), 'IFN', 'KIH', 'اصفهان', 'کیش', true, 7, 60),
        (uuid_generate_v4(), 'TBZ', 'IFN', 'تبریز', 'اصفهان', true, 7, 60),
        (uuid_generate_v4(), 'IFN', 'TBZ', 'اصفهان', 'تبریز', true, 7, 60)
    `);
    console.log('✓ Inserted default route configurations');

    console.log('\n✅ Migration completed successfully!');
    
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
