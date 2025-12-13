-- =====================================================
-- QUERY FUNCTIONS FOR PRICE & CAPACITY TRACKING
-- =====================================================

-- 1. Get price history for a specific flight
CREATE OR REPLACE FUNCTION get_flight_price_history(
    p_base_flight_id VARCHAR(50),
    p_hours_back INTEGER DEFAULT 168 -- Default 7 days
)
RETURNS TABLE (
    scraped_at TIMESTAMP,
    provider_source VARCHAR(50),
    adult_price INTEGER,
    child_price INTEGER,
    infant_price INTEGER,
    capacity INTEGER,
    cabin_class VARCHAR(20),
    booking_class VARCHAR(10),
    reservable BOOLEAN,
    is_promoted BOOLEAN,
    discount_percent NUMERIC(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        fs.scraped_at,
        fs.provider_source,
        fs.adult_total_fare,
        fs.child_total_fare,
        fs.infant_total_fare,
        fs.capacity,
        fs.cabin_class,
        fs.booking_class,
        fs.reservable,
        fs.is_promoted,
        fs.discount_percent
    FROM flight_snapshots fs
    JOIN flights f ON fs.flight_id = f.id
    WHERE f.base_flight_id = p_base_flight_id
      AND fs.scraped_at >= (CURRENT_TIMESTAMP - (p_hours_back || ' hours')::INTERVAL)
    ORDER BY fs.scraped_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_flight_price_history IS 'Get complete price history for a flight over specified time period';

-- 2. Get price changes (only when price changed)
CREATE OR REPLACE FUNCTION get_flight_price_changes(
    p_base_flight_id VARCHAR(50),
    p_hours_back INTEGER DEFAULT 168
)
RETURNS TABLE (
    scraped_at TIMESTAMP,
    provider_source VARCHAR(50),
    adult_price INTEGER,
    price_change INTEGER,
    price_change_percent NUMERIC(5,2),
    capacity INTEGER,
    capacity_change INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH price_data AS (
        SELECT 
            fs.scraped_at,
            fs.provider_source,
            fs.adult_total_fare,
            fs.capacity,
            LAG(fs.adult_total_fare) OVER (PARTITION BY fs.provider_source ORDER BY fs.scraped_at) as prev_price,
            LAG(fs.capacity) OVER (PARTITION BY fs.provider_source ORDER BY fs.scraped_at) as prev_capacity
        FROM flight_snapshots fs
        JOIN flights f ON fs.flight_id = f.id
        WHERE f.base_flight_id = p_base_flight_id
          AND fs.scraped_at >= (CURRENT_TIMESTAMP - (p_hours_back || ' hours')::INTERVAL)
    )
    SELECT 
        pd.scraped_at,
        pd.provider_source,
        pd.adult_total_fare,
        (pd.adult_total_fare - pd.prev_price) as price_change,
        CASE 
            WHEN pd.prev_price > 0 THEN 
                ROUND(((pd.adult_total_fare - pd.prev_price)::NUMERIC / pd.prev_price * 100), 2)
            ELSE NULL
        END as price_change_percent,
        pd.capacity,
        (pd.capacity - pd.prev_capacity) as capacity_change
    FROM price_data pd
    WHERE pd.prev_price IS NOT NULL
      AND (pd.adult_total_fare != pd.prev_price OR pd.capacity != pd.prev_capacity)
    ORDER BY pd.scraped_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_flight_price_changes IS 'Get only the snapshots where price or capacity changed';

-- 3. Get daily price statistics
CREATE OR REPLACE FUNCTION get_flight_daily_stats(
    p_base_flight_id VARCHAR(50)
)
RETURNS TABLE (
    date DATE,
    min_price INTEGER,
    max_price INTEGER,
    avg_price NUMERIC(10,2),
    price_volatility NUMERIC(10,2),
    min_capacity INTEGER,
    max_capacity INTEGER,
    scrape_count INTEGER,
    cheapest_provider VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    WITH daily_data AS (
        SELECT 
            DATE(fs.scraped_at) as snapshot_date,
            fs.adult_total_fare,
            fs.capacity,
            fs.provider_source
        FROM flight_snapshots fs
        JOIN flights f ON fs.flight_id = f.id
        WHERE f.base_flight_id = p_base_flight_id
    ),
    stats AS (
        SELECT 
            dd.snapshot_date,
            MIN(dd.adult_total_fare) as min_price,
            MAX(dd.adult_total_fare) as max_price,
            AVG(dd.adult_total_fare) as avg_price,
            STDDEV(dd.adult_total_fare) as price_stddev,
            MIN(dd.capacity) as min_capacity,
            MAX(dd.capacity) as max_capacity,
            COUNT(*) as scrape_count
        FROM daily_data dd
        GROUP BY dd.snapshot_date
    ),
    cheapest AS (
        SELECT DISTINCT ON (dd.snapshot_date)
            dd.snapshot_date,
            dd.provider_source
        FROM daily_data dd
        ORDER BY dd.snapshot_date, dd.adult_total_fare ASC
    )
    SELECT 
        s.snapshot_date,
        s.min_price,
        s.max_price,
        ROUND(s.avg_price, 2),
        ROUND(s.price_stddev, 2) as price_volatility,
        s.min_capacity,
        s.max_capacity,
        s.scrape_count::INTEGER,
        c.provider_source
    FROM stats s
    LEFT JOIN cheapest c ON s.snapshot_date = c.snapshot_date
    ORDER BY s.snapshot_date DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_flight_daily_stats IS 'Get daily aggregated statistics including min/max/avg prices and volatility';

-- 4. Compare prices across providers at specific time
CREATE OR REPLACE FUNCTION get_flight_price_comparison(
    p_base_flight_id VARCHAR(50),
    p_at_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
RETURNS TABLE (
    provider_source VARCHAR(50),
    adult_price INTEGER,
    capacity INTEGER,
    cabin_class VARCHAR(20),
    booking_class VARCHAR(10),
    reservable BOOLEAN,
    is_promoted BOOLEAN,
    discount_percent NUMERIC(5,2),
    scraped_at TIMESTAMP,
    minutes_old INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH latest_per_provider AS (
        SELECT DISTINCT ON (fs.provider_source)
            fs.provider_source,
            fs.adult_total_fare,
            fs.capacity,
            fs.cabin_class,
            fs.booking_class,
            fs.reservable,
            fs.is_promoted,
            fs.discount_percent,
            fs.scraped_at
        FROM flight_snapshots fs
        JOIN flights f ON fs.flight_id = f.id
        WHERE f.base_flight_id = p_base_flight_id
          AND fs.scraped_at <= p_at_time
        ORDER BY fs.provider_source, fs.scraped_at DESC
    )
    SELECT 
        lp.provider_source,
        lp.adult_total_fare,
        lp.capacity,
        lp.cabin_class,
        lp.booking_class,
        lp.reservable,
        lp.is_promoted,
        lp.discount_percent,
        lp.scraped_at,
        EXTRACT(EPOCH FROM (p_at_time - lp.scraped_at))::INTEGER / 60 as minutes_old
    FROM latest_per_provider lp
    ORDER BY lp.adult_total_fare ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_flight_price_comparison IS 'Compare prices across all providers for a specific flight';

-- 5. Find cheapest flights on a route
CREATE OR REPLACE FUNCTION find_cheapest_flights(
    p_origin VARCHAR(10),
    p_destination VARCHAR(10),
    p_date_from DATE,
    p_date_to DATE,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    base_flight_id VARCHAR(50),
    flight_number VARCHAR(20),
    airline_code VARCHAR(10),
    airline_name VARCHAR(100),
    departure_datetime TIMESTAMP,
    arrival_datetime TIMESTAMP,
    duration_minutes INTEGER,
    min_price INTEGER,
    max_price INTEGER,
    avg_price NUMERIC(10,2),
    current_capacity INTEGER,
    is_charter BOOLEAN,
    providers_count INTEGER,
    last_updated TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    WITH current_prices AS (
        SELECT DISTINCT ON (fs.flight_id)
            fs.flight_id,
            fs.adult_total_fare,
            fs.capacity,
            fs.scraped_at,
            fs.provider_source
        FROM flight_snapshots fs
        ORDER BY fs.flight_id, fs.scraped_at DESC
    ),
    flight_stats AS (
        SELECT 
            f.id as flight_id,
            f.base_flight_id,
            MIN(fs.adult_total_fare) as min_price,
            MAX(fs.adult_total_fare) as max_price,
            AVG(fs.adult_total_fare) as avg_price,
            COUNT(DISTINCT fs.provider_source) as providers_count
        FROM flights f
        JOIN airports ao ON f.origin_airport_id = ao.id
        JOIN airports ad ON f.destination_airport_id = ad.id
        JOIN flight_snapshots fs ON f.id = fs.flight_id
        WHERE ao.code = p_origin
          AND ad.code = p_destination
          AND DATE(f.departure_datetime) >= p_date_from
          AND DATE(f.departure_datetime) <= p_date_to
        GROUP BY f.id, f.base_flight_id
    )
    SELECT 
        f.base_flight_id,
        f.flight_number,
        a.code,
        a.name_en,
        f.departure_datetime,
        f.arrival_datetime,
        f.duration_minutes,
        fs.min_price::INTEGER,
        fs.max_price::INTEGER,
        ROUND(fs.avg_price, 2),
        cp.capacity,
        f.is_charter,
        fs.providers_count::INTEGER,
        cp.scraped_at
    FROM flights f
    JOIN airlines a ON f.airline_id = a.id
    JOIN flight_stats fs ON f.id = fs.flight_id
    JOIN current_prices cp ON f.id = cp.flight_id
    ORDER BY cp.adult_total_fare ASC, f.departure_datetime ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION find_cheapest_flights IS 'Find cheapest flights on a route within date range';

-- 6. Get capacity changes over time
CREATE OR REPLACE FUNCTION get_capacity_trend(
    p_base_flight_id VARCHAR(50),
    p_hours_back INTEGER DEFAULT 168
)
RETURNS TABLE (
    scraped_at TIMESTAMP,
    provider_source VARCHAR(50),
    capacity INTEGER,
    capacity_change INTEGER,
    reservable BOOLEAN,
    hours_until_departure NUMERIC(10,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH capacity_data AS (
        SELECT 
            fs.scraped_at,
            fs.provider_source,
            fs.capacity,
            fs.reservable,
            LAG(fs.capacity) OVER (PARTITION BY fs.provider_source ORDER BY fs.scraped_at) as prev_capacity,
            f.departure_datetime
        FROM flight_snapshots fs
        JOIN flights f ON fs.flight_id = f.id
        WHERE f.base_flight_id = p_base_flight_id
          AND fs.scraped_at >= (CURRENT_TIMESTAMP - (p_hours_back || ' hours')::INTERVAL)
    )
    SELECT 
        cd.scraped_at,
        cd.provider_source,
        cd.capacity,
        (cd.capacity - COALESCE(cd.prev_capacity, cd.capacity)) as capacity_change,
        cd.reservable,
        ROUND(EXTRACT(EPOCH FROM (cd.departure_datetime - cd.scraped_at)) / 3600, 2) as hours_until_departure
    FROM capacity_data cd
    ORDER BY cd.scraped_at DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_capacity_trend IS 'Track capacity changes over time showing booking velocity';

-- 7. Get price drop alerts (flights that recently dropped in price)
CREATE OR REPLACE FUNCTION get_price_drops(
    p_origin VARCHAR(10),
    p_destination VARCHAR(10),
    p_date_from DATE,
    p_date_to DATE,
    p_drop_threshold_percent NUMERIC DEFAULT 10.0
)
RETURNS TABLE (
    base_flight_id VARCHAR(50),
    flight_number VARCHAR(20),
    airline_name VARCHAR(100),
    departure_datetime TIMESTAMP,
    previous_price INTEGER,
    current_price INTEGER,
    price_drop INTEGER,
    drop_percent NUMERIC(5,2),
    provider_source VARCHAR(50),
    last_updated TIMESTAMP
) AS $$
BEGIN
    RETURN QUERY
    WITH recent_snapshots AS (
        SELECT 
            f.id as flight_id,
            f.base_flight_id,
            f.flight_number,
            f.departure_datetime,
            a.name_en as airline_name,
            fs.provider_source,
            fs.adult_total_fare,
            fs.scraped_at,
            ROW_NUMBER() OVER (PARTITION BY f.id, fs.provider_source ORDER BY fs.scraped_at DESC) as rn
        FROM flights f
        JOIN airlines a ON f.airline_id = a.id
        JOIN airports ao ON f.origin_airport_id = ao.id
        JOIN airports ad ON f.destination_airport_id = ad.id
        JOIN flight_snapshots fs ON f.id = fs.flight_id
        WHERE ao.code = p_origin
          AND ad.code = p_destination
          AND DATE(f.departure_datetime) >= p_date_from
          AND DATE(f.departure_datetime) <= p_date_to
          AND fs.scraped_at >= (CURRENT_TIMESTAMP - INTERVAL '24 hours')
    ),
    price_comparison AS (
        SELECT 
            rs.flight_id,
            rs.base_flight_id,
            rs.flight_number,
            rs.airline_name,
            rs.departure_datetime,
            rs.provider_source,
            MAX(CASE WHEN rs.rn = 2 THEN rs.adult_total_fare END) as prev_price,
            MAX(CASE WHEN rs.rn = 1 THEN rs.adult_total_fare END) as curr_price,
            MAX(CASE WHEN rs.rn = 1 THEN rs.scraped_at END) as last_updated
        FROM recent_snapshots rs
        GROUP BY rs.flight_id, rs.base_flight_id, rs.flight_number, rs.airline_name, 
                 rs.departure_datetime, rs.provider_source
        HAVING COUNT(*) >= 2
    )
    SELECT 
        pc.base_flight_id,
        pc.flight_number,
        pc.airline_name,
        pc.departure_datetime,
        pc.prev_price,
        pc.curr_price,
        (pc.prev_price - pc.curr_price) as price_drop,
        ROUND(((pc.prev_price - pc.curr_price)::NUMERIC / pc.prev_price * 100), 2) as drop_percent,
        pc.provider_source,
        pc.last_updated
    FROM price_comparison pc
    WHERE pc.prev_price > pc.curr_price
      AND ((pc.prev_price - pc.curr_price)::NUMERIC / pc.prev_price * 100) >= p_drop_threshold_percent
    ORDER BY drop_percent DESC, pc.curr_price ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_price_drops IS 'Find flights with recent significant price drops';

-- 8. Get scraping statistics
CREATE OR REPLACE FUNCTION get_scraping_stats(
    p_hours_back INTEGER DEFAULT 24
)
RETURNS TABLE (
    provider VARCHAR(50),
    scrape_count INTEGER,
    flights_scraped INTEGER,
    last_scrape TIMESTAMP,
    avg_flights_per_scrape NUMERIC(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ss.provider,
        COUNT(*)::INTEGER as scrape_count,
        SUM(ss.flights_found)::INTEGER as flights_scraped,
        MAX(ss.completed_at) as last_scrape,
        ROUND(AVG(ss.flights_found), 2) as avg_flights_per_scrape
    FROM scrape_sessions ss
    WHERE ss.started_at >= (CURRENT_TIMESTAMP - (p_hours_back || ' hours')::INTERVAL)
      AND ss.status = 'completed'
    GROUP BY ss.provider
    ORDER BY last_scrape DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_scraping_stats IS 'Get statistics about scraping performance and coverage';
