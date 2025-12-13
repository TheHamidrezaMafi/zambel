-- =====================================================
-- ZAMBEEL FLIGHT TRACKING DATABASE SCHEMA
-- Optimized for hourly scraping with efficient querying
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- STATIC REFERENCE TABLES (Rarely Change)
-- =====================================================

-- Airlines (Static)
CREATE TABLE airlines (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_en VARCHAR(100),
    name_fa VARCHAR(100),
    logo_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_airlines_code ON airlines(code);

-- Airports (Static)
CREATE TABLE airports (
    id SERIAL PRIMARY KEY,
    code VARCHAR(10) UNIQUE NOT NULL,
    name_en VARCHAR(100),
    name_fa VARCHAR(100),
    city_code VARCHAR(10),
    city_name_en VARCHAR(100),
    city_name_fa VARCHAR(100),
    country VARCHAR(50) DEFAULT 'Iran',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_airports_code ON airports(code);
CREATE INDEX idx_airports_city ON airports(city_code);

-- Aircraft Types (Static)
CREATE TABLE aircraft_types (
    id SERIAL PRIMARY KEY,
    type_code VARCHAR(20) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_aircraft_type ON aircraft_types(type_code);

-- =====================================================
-- CORE FLIGHT TABLES
-- =====================================================

-- Base Flights (Static flight schedule info)
-- One record per unique flight (same airline, route, schedule)
CREATE TABLE flights (
    id SERIAL PRIMARY KEY,
    base_flight_id VARCHAR(50) UNIQUE NOT NULL, -- e.g., THRMHD20251215A167001930
    
    -- Airline & Aircraft
    airline_id INTEGER REFERENCES airlines(id),
    operating_airline_id INTEGER REFERENCES airlines(id),
    flight_number VARCHAR(20) NOT NULL,
    aircraft_type_id INTEGER REFERENCES aircraft_types(id),
    
    -- Route
    origin_airport_id INTEGER REFERENCES airports(id),
    destination_airport_id INTEGER REFERENCES airports(id),
    
    -- Schedule (static for this flight)
    departure_datetime TIMESTAMP NOT NULL,
    arrival_datetime TIMESTAMP NOT NULL,
    departure_date_jalali VARCHAR(50),
    arrival_date_jalali VARCHAR(50),
    duration_minutes INTEGER,
    stops INTEGER DEFAULT 0,
    
    -- Flight Type
    is_charter BOOLEAN DEFAULT false,
    is_domestic BOOLEAN DEFAULT true,
    
    -- Metadata
    first_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT unique_base_flight UNIQUE (base_flight_id)
);

CREATE INDEX idx_flights_base_id ON flights(base_flight_id);
CREATE INDEX idx_flights_route ON flights(origin_airport_id, destination_airport_id);
CREATE INDEX idx_flights_departure ON flights(departure_datetime);
CREATE INDEX idx_flights_route_date ON flights(origin_airport_id, destination_airport_id, departure_datetime);
CREATE INDEX idx_flights_airline ON flights(airline_id);

-- =====================================================
-- DYNAMIC TRACKING TABLES (Change Over Time)
-- =====================================================

-- Flight Snapshots (Price, capacity, availability per scrape)
-- Multiple records per flight tracking changes over time
CREATE TABLE flight_snapshots (
    id BIGSERIAL PRIMARY KEY,
    flight_id INTEGER REFERENCES flights(id) ON DELETE CASCADE,
    
    -- Full flight ID with price (for reference)
    full_flight_id VARCHAR(100),
    
    -- Pricing (per passenger type)
    adult_base_fare INTEGER,
    adult_total_fare INTEGER NOT NULL,
    adult_taxes INTEGER,
    adult_service_charge INTEGER,
    
    child_base_fare INTEGER,
    child_total_fare INTEGER,
    
    infant_base_fare INTEGER,
    infant_total_fare INTEGER,
    
    currency VARCHAR(10) DEFAULT 'IRR',
    
    -- Cabin & Booking Class
    cabin_class VARCHAR(20), -- economy, business, first
    cabin_class_fa VARCHAR(50),
    booking_class VARCHAR(10),
    
    -- Availability
    capacity INTEGER,
    reservable BOOLEAN DEFAULT true,
    requires_passport BOOLEAN,
    
    -- Baggage
    checked_baggage_adult_kg INTEGER,
    checked_baggage_child_kg INTEGER,
    cabin_baggage_kg INTEGER,
    
    -- Marketing
    is_promoted BOOLEAN DEFAULT false,
    discount_percent NUMERIC(5,2),
    special_offers JSONB,
    tags TEXT[],
    
    -- Refund Policy
    is_refundable BOOLEAN,
    cancellation_rules JSONB,
    
    -- Scraper Info
    provider_source VARCHAR(50) NOT NULL, -- alibaba, mrbilit, safarmarket, safar366
    original_id VARCHAR(100),
    scraped_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Additional metadata
    metadata JSONB
);

CREATE INDEX idx_snapshots_flight ON flight_snapshots(flight_id);
CREATE INDEX idx_snapshots_scraped_at ON flight_snapshots(scraped_at DESC);
CREATE INDEX idx_snapshots_provider ON flight_snapshots(provider_source);
CREATE INDEX idx_snapshots_flight_scraped ON flight_snapshots(flight_id, scraped_at DESC);
CREATE INDEX idx_snapshots_price ON flight_snapshots(adult_total_fare);

-- Partition by month for better performance with large historical data
-- CREATE TABLE flight_snapshots_2025_12 PARTITION OF flight_snapshots
--     FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- =====================================================
-- PRICE HISTORY SUMMARY (Aggregated for quick queries)
-- =====================================================

-- Price history summary (materialized view refreshed periodically)
CREATE TABLE flight_price_summary (
    id SERIAL PRIMARY KEY,
    flight_id INTEGER REFERENCES flights(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Price statistics for the day
    min_price INTEGER,
    max_price INTEGER,
    avg_price NUMERIC(10,2),
    
    -- Capacity statistics
    min_capacity INTEGER,
    max_capacity INTEGER,
    
    -- Scrape count
    scrape_count INTEGER DEFAULT 0,
    
    -- Timestamps
    first_scraped_at TIMESTAMP,
    last_scraped_at TIMESTAMP,
    
    CONSTRAINT unique_flight_date UNIQUE (flight_id, date)
);

CREATE INDEX idx_price_summary_flight ON flight_price_summary(flight_id);
CREATE INDEX idx_price_summary_date ON flight_price_summary(date);
CREATE INDEX idx_price_summary_min_price ON flight_price_summary(min_price);

-- =====================================================
-- SCRAPE TRACKING
-- =====================================================

-- Track scraping sessions
CREATE TABLE scrape_sessions (
    id SERIAL PRIMARY KEY,
    session_id UUID DEFAULT uuid_generate_v4(),
    provider VARCHAR(50) NOT NULL,
    origin VARCHAR(10) NOT NULL,
    destination VARCHAR(10) NOT NULL,
    search_date_from DATE NOT NULL,
    search_date_to DATE NOT NULL,
    
    flights_found INTEGER DEFAULT 0,
    flights_new INTEGER DEFAULT 0,
    flights_updated INTEGER DEFAULT 0,
    
    started_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'running', -- running, completed, failed
    error_message TEXT,
    
    metadata JSONB
);

CREATE INDEX idx_scrape_sessions_provider ON scrape_sessions(provider);
CREATE INDEX idx_scrape_sessions_started ON scrape_sessions(started_at DESC);
CREATE INDEX idx_scrape_sessions_route ON scrape_sessions(origin, destination);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to upsert airline
CREATE OR REPLACE FUNCTION upsert_airline(
    p_code VARCHAR(10),
    p_name_en VARCHAR(100),
    p_name_fa VARCHAR(100),
    p_logo_url TEXT
) RETURNS INTEGER AS $$
DECLARE
    v_airline_id INTEGER;
BEGIN
    INSERT INTO airlines (code, name_en, name_fa, logo_url)
    VALUES (p_code, p_name_en, p_name_fa, p_logo_url)
    ON CONFLICT (code) 
    DO UPDATE SET
        name_en = COALESCE(EXCLUDED.name_en, airlines.name_en),
        name_fa = COALESCE(EXCLUDED.name_fa, airlines.name_fa),
        logo_url = COALESCE(EXCLUDED.logo_url, airlines.logo_url),
        updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_airline_id;
    
    RETURN v_airline_id;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert airport
CREATE OR REPLACE FUNCTION upsert_airport(
    p_code VARCHAR(10),
    p_name_en VARCHAR(100),
    p_name_fa VARCHAR(100),
    p_city_code VARCHAR(10),
    p_city_name_en VARCHAR(100),
    p_city_name_fa VARCHAR(100)
) RETURNS INTEGER AS $$
DECLARE
    v_airport_id INTEGER;
BEGIN
    INSERT INTO airports (code, name_en, name_fa, city_code, city_name_en, city_name_fa)
    VALUES (p_code, p_name_en, p_name_fa, p_city_code, p_city_name_en, p_city_name_fa)
    ON CONFLICT (code)
    DO UPDATE SET
        name_en = COALESCE(EXCLUDED.name_en, airports.name_en),
        name_fa = COALESCE(EXCLUDED.name_fa, airports.name_fa),
        city_name_en = COALESCE(EXCLUDED.city_name_en, airports.city_name_en),
        city_name_fa = COALESCE(EXCLUDED.city_name_fa, airports.city_name_fa)
    RETURNING id INTO v_airport_id;
    
    RETURN v_airport_id;
END;
$$ LANGUAGE plpgsql;

-- Function to upsert aircraft type
CREATE OR REPLACE FUNCTION upsert_aircraft_type(
    p_type_code VARCHAR(20),
    p_type_name VARCHAR(100)
) RETURNS INTEGER AS $$
DECLARE
    v_aircraft_id INTEGER;
BEGIN
    INSERT INTO aircraft_types (type_code, type_name)
    VALUES (p_type_code, p_type_name)
    ON CONFLICT (type_code)
    DO UPDATE SET
        type_name = EXCLUDED.type_name
    RETURNING id INTO v_aircraft_id;
    
    RETURN v_aircraft_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update last_seen_at when new snapshot is added
CREATE OR REPLACE FUNCTION update_flight_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE flights
    SET last_seen_at = NEW.scraped_at
    WHERE id = NEW.flight_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_flight_last_seen
    AFTER INSERT ON flight_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_flight_last_seen();

-- Update price summary on new snapshot
CREATE OR REPLACE FUNCTION update_price_summary()
RETURNS TRIGGER AS $$
DECLARE
    v_date DATE;
BEGIN
    v_date := DATE(NEW.scraped_at);
    
    INSERT INTO flight_price_summary (
        flight_id, date, 
        min_price, max_price, avg_price,
        min_capacity, max_capacity,
        scrape_count,
        first_scraped_at, last_scraped_at
    )
    VALUES (
        NEW.flight_id, v_date,
        NEW.adult_total_fare, NEW.adult_total_fare, NEW.adult_total_fare,
        NEW.capacity, NEW.capacity,
        1,
        NEW.scraped_at, NEW.scraped_at
    )
    ON CONFLICT (flight_id, date)
    DO UPDATE SET
        min_price = LEAST(flight_price_summary.min_price, NEW.adult_total_fare),
        max_price = GREATEST(flight_price_summary.max_price, NEW.adult_total_fare),
        avg_price = (
            (flight_price_summary.avg_price * flight_price_summary.scrape_count + NEW.adult_total_fare) 
            / (flight_price_summary.scrape_count + 1)
        ),
        min_capacity = LEAST(flight_price_summary.min_capacity, NEW.capacity),
        max_capacity = GREATEST(flight_price_summary.max_capacity, NEW.capacity),
        scrape_count = flight_price_summary.scrape_count + 1,
        last_scraped_at = NEW.scraped_at;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_price_summary
    AFTER INSERT ON flight_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_price_summary();

-- =====================================================
-- QUERY HELPER VIEWS
-- =====================================================

-- Latest snapshot for each flight
CREATE OR REPLACE VIEW latest_flight_snapshots AS
SELECT DISTINCT ON (flight_id) *
FROM flight_snapshots
ORDER BY flight_id, scraped_at DESC;

-- Flights with current prices
CREATE OR REPLACE VIEW flights_with_current_prices AS
SELECT 
    f.base_flight_id,
    f.flight_number,
    a1.code as airline_code,
    a1.name_en as airline_name,
    a1.name_fa as airline_name_fa,
    ao.code as origin_code,
    ao.city_name_en as origin_city,
    ad.code as destination_code,
    ad.city_name_en as destination_city,
    f.departure_datetime,
    f.arrival_datetime,
    f.duration_minutes,
    f.is_charter,
    s.adult_total_fare as current_price,
    s.capacity as current_capacity,
    s.cabin_class,
    s.reservable,
    s.provider_source,
    s.scraped_at as last_updated
FROM flights f
JOIN airlines a1 ON f.airline_id = a1.id
JOIN airports ao ON f.origin_airport_id = ao.id
JOIN airports ad ON f.destination_airport_id = ad.id
JOIN latest_flight_snapshots s ON f.id = s.flight_id;

COMMENT ON VIEW flights_with_current_prices IS 'Flights with their most recent price and availability data';

-- =====================================================
-- INDEXES FOR COMMON QUERIES
-- =====================================================

-- Index for finding flights by route and date range
CREATE INDEX idx_flights_route_date_range ON flights(
    origin_airport_id, 
    destination_airport_id, 
    departure_datetime
);

-- Index for base_flight_id lookups
CREATE INDEX idx_flights_base_flight_id_hash ON flights USING hash(base_flight_id);

-- Index for price tracking queries
CREATE INDEX idx_snapshots_price_tracking ON flight_snapshots(
    flight_id, scraped_at, adult_total_fare
);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE flights IS 'Static flight information (airline, route, schedule)';
COMMENT ON TABLE flight_snapshots IS 'Time-series data tracking price, capacity, and availability changes';
COMMENT ON TABLE flight_price_summary IS 'Daily aggregated price statistics for quick queries';
COMMENT ON TABLE scrape_sessions IS 'Metadata about scraping sessions for monitoring';
COMMENT ON TABLE airlines IS 'Reference table for airline information';
COMMENT ON TABLE airports IS 'Reference table for airport and city information';
COMMENT ON TABLE aircraft_types IS 'Reference table for aircraft types';

COMMENT ON COLUMN flights.base_flight_id IS 'Unique identifier: ORIGIN+DEST+DATE+AIRLINE+FLIGHT#+TIME';
COMMENT ON COLUMN flight_snapshots.full_flight_id IS 'Full flight ID including price tier and cabin';
COMMENT ON COLUMN flight_snapshots.scraped_at IS 'Timestamp when this snapshot was captured';
