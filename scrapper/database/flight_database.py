"""
Database utility module for Zambeel Flight Tracker
Handles connection and data ingestion from unified flight format
"""

import psycopg2
from psycopg2.extras import execute_batch, RealDictCursor
from datetime import datetime
from typing import Dict, List, Any, Optional
import json


class FlightDatabase:
    """
    PostgreSQL database interface for flight tracking
    """
    
    def __init__(self, connection_string: str):
        """
        Initialize database connection
        
        Args:
            connection_string: PostgreSQL connection string
                e.g., 'postgresql://user:pass@host:port/dbname'
        """
        self.connection_string = connection_string
        self.conn = None
        self.cursor = None
        self.batch_mode = False  # When True, don't commit on each operation
    
    def connect(self):
        """Establish database connection"""
        try:
            self.conn = psycopg2.connect(
                self.connection_string,
                connect_timeout=10,
                options='-c statement_timeout=30000'  # 30 second timeout
            )
            self.cursor = self.conn.cursor(cursor_factory=RealDictCursor)
            print("✓ Database connected successfully")
            return True
        except Exception as e:
            print(f"✗ Database connection failed: {e}")
            return False
    
    def disconnect(self):
        """Close database connection"""
        if self.cursor:
            self.cursor.close()
        if self.conn:
            self.conn.close()
        print("✓ Database disconnected")
    
    def execute_script(self, script_path: str):
        """Execute SQL script file"""
        try:
            with open(script_path, 'r') as f:
                sql = f.read()
            self.cursor.execute(sql)
            self.conn.commit()
            print(f"✓ Executed {script_path}")
            return True
        except Exception as e:
            print(f"✗ Failed to execute {script_path}: {e}")
            self.conn.rollback()
            return False
    
    def upsert_airline(self, airline_data: Dict[str, Any]) -> Optional[int]:
        """
        Insert or update airline data
        
        Args:
            airline_data: Dict with keys: code, name_en, name_fa, logo_url
            
        Returns:
            airline_id or None if failed
        """
        try:
            # Validate required field
            airline_code = airline_data.get('code')
            if not airline_code:
                print(f"⚠ Missing airline code, skipping airline upsert")
                return None
            
            self.cursor.execute(
                "SELECT upsert_airline(%s, %s, %s, %s)",
                (
                    airline_code,
                    airline_data.get('name_en'),
                    airline_data.get('name_fa'),
                    airline_data.get('logo_url')
                )
            )
            result = self.cursor.fetchone()
            if not self.batch_mode:
                self.conn.commit()
            return result['upsert_airline'] if result else None
        except Exception as e:
            print(f"✗ Failed to upsert airline {airline_data.get('code')}: {e}")
            if not self.batch_mode:
                self.conn.rollback()
            return None
    
    def upsert_airport(self, airport_data: Dict[str, Any]) -> Optional[int]:
        """
        Insert or update airport data
        
        Args:
            airport_data: Dict with airport information
            
        Returns:
            airport_id or None if failed
        """
        try:
            # Validate required field
            airport_code = airport_data.get('airport_code')
            if not airport_code:
                print(f"⚠ Missing airport_code, skipping airport upsert")
                return None
            
            self.cursor.execute(
                "SELECT upsert_airport(%s, %s, %s, %s, %s, %s)",
                (
                    airport_code,
                    airport_data.get('airport_name_en'),
                    airport_data.get('airport_name_fa'),
                    airport_data.get('city_code'),
                    airport_data.get('city_name_en'),
                    airport_data.get('city_name_fa')
                )
            )
            result = self.cursor.fetchone()
            if not self.batch_mode:
                self.conn.commit()
            return result['upsert_airport'] if result else None
        except Exception as e:
            print(f"✗ Failed to upsert airport {airport_data.get('airport_code')}: {e}")
            if not self.batch_mode:
                self.conn.rollback()
            return None
    
    def upsert_aircraft_type(self, aircraft_data: Dict[str, Any]) -> Optional[int]:
        """
        Insert or update aircraft type
        
        Args:
            aircraft_data: Dict with type_code and type_name
            
        Returns:
            aircraft_id or None if failed
        """
        try:
            type_code = aircraft_data.get('code') or aircraft_data.get('type')
            type_name = aircraft_data.get('type') or aircraft_data.get('code')
            
            if not type_code:
                return None
            
            self.cursor.execute(
                "SELECT upsert_aircraft_type(%s, %s)",
                (type_code[:20], type_name[:100])
            )
            result = self.cursor.fetchone()
            if not self.batch_mode:
                self.conn.commit()
            return result['upsert_aircraft_type'] if result else None
        except Exception as e:
            print(f"✗ Failed to upsert aircraft: {e}")
            if not self.batch_mode:
                self.conn.rollback()
            return None
    
    def ingest_unified_flight(self, flight_data: Dict[str, Any], session_id: Optional[str] = None) -> bool:
        """
        Ingest a unified flight format into the database
        
        Args:
            flight_data: Unified flight format dict
            session_id: Optional scrape session ID
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # 1. Upsert airline
            airline_id = self.upsert_airline(flight_data.get('airline', {}))
            if not airline_id:
                print(f"⚠ Skipping flight - no airline")
                return False
            
            # 2. Upsert operating airline (if different)
            operating_airline = flight_data.get('operating_airline', {})
            operating_airline_id = airline_id
            if operating_airline.get('code') and operating_airline['code'] != flight_data['airline']['code']:
                operating_airline_id = self.upsert_airline(operating_airline)
            
            # 3. Upsert airports
            origin_id = self.upsert_airport(flight_data.get('route', {}).get('origin', {}))
            destination_id = self.upsert_airport(flight_data.get('route', {}).get('destination', {}))
            
            if not origin_id or not destination_id:
                print(f"⚠ Skipping flight - missing airports")
                return False
            
            # 4. Upsert aircraft type
            aircraft_id = self.upsert_aircraft_type(flight_data.get('aircraft', {}))
            
            # 5. Insert or update flight
            schedule = flight_data.get('schedule', {})
            ticket_info = flight_data.get('ticket_info', {})
            
            self.cursor.execute("""
                INSERT INTO flights (
                    base_flight_id, airline_id, operating_airline_id, flight_number,
                    aircraft_type_id, origin_airport_id, destination_airport_id,
                    departure_datetime, arrival_datetime, 
                    departure_date_jalali, arrival_date_jalali,
                    duration_minutes, stops, is_charter, is_domestic
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (base_flight_id) 
                DO UPDATE SET 
                    last_seen_at = CURRENT_TIMESTAMP
                RETURNING id
            """, (
                flight_data.get('base_flight_id'),
                airline_id,
                operating_airline_id,
                flight_data.get('flight_number'),
                aircraft_id,
                origin_id,
                destination_id,
                schedule.get('departure_datetime'),
                schedule.get('arrival_datetime'),
                schedule.get('departure_date_jalali'),
                schedule.get('arrival_date_jalali'),
                schedule.get('duration_minutes'),
                schedule.get('stops', 0),
                ticket_info.get('is_charter', False),
                ticket_info.get('is_domestic', True)
            ))
            
            flight_id = self.cursor.fetchone()['id']
            
            # 6. Insert flight snapshot
            pricing = flight_data.get('pricing', {})
            cabin = flight_data.get('cabin', {})
            baggage = flight_data.get('baggage', {})
            policies = flight_data.get('policies', {})
            additional = flight_data.get('additional_info', {})
            metadata = flight_data.get('metadata', {})
            
            self.cursor.execute("""
                INSERT INTO flight_snapshots (
                    flight_id, full_flight_id, 
                    adult_base_fare, adult_total_fare, adult_taxes, adult_service_charge,
                    child_base_fare, child_total_fare,
                    infant_base_fare, infant_total_fare,
                    currency,
                    cabin_class, cabin_class_fa, booking_class,
                    capacity, reservable, requires_passport,
                    checked_baggage_adult_kg, checked_baggage_child_kg, cabin_baggage_kg,
                    is_promoted, discount_percent, special_offers, tags,
                    is_refundable, cancellation_rules,
                    provider_source, original_id, scraped_at,
                    metadata
                )
                VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
                )
            """, (
                flight_id,
                flight_data.get('flight_id'),
                pricing.get('adult', {}).get('base_fare'),
                pricing.get('adult', {}).get('total_fare'),
                pricing.get('adult', {}).get('taxes'),
                pricing.get('adult', {}).get('service_charge'),
                pricing.get('child', {}).get('base_fare'),
                pricing.get('child', {}).get('total_fare'),
                pricing.get('infant', {}).get('base_fare'),
                pricing.get('infant', {}).get('total_fare'),
                pricing.get('currency', 'IRR'),
                cabin.get('class'),
                cabin.get('class_display_name_fa'),
                cabin.get('booking_class'),
                ticket_info.get('capacity'),
                ticket_info.get('reservable'),
                ticket_info.get('requires_passport'),
                baggage.get('checked', {}).get('adult_kg'),
                baggage.get('checked', {}).get('child_kg'),
                baggage.get('cabin', {}).get('kg'),
                additional.get('promoted', False),
                additional.get('discount_percent'),
                json.dumps(additional.get('special_offers', [])),
                additional.get('tags', []),
                ticket_info.get('is_refundable'),
                json.dumps(policies.get('cancellation_rules', [])),
                flight_data.get('provider_source'),
                flight_data.get('original_id'),
                metadata.get('scraped_at', datetime.now()),
                json.dumps(metadata)
            ))
            
            if not self.batch_mode:
                self.conn.commit()
            return True
            
        except Exception as e:
            print(f"✗ Failed to ingest flight {flight_data.get('base_flight_id')}: {e}")
            if not self.batch_mode:
                self.conn.rollback()
            return False
    
    def ingest_unified_flights_batch(self, flights: List[Dict[str, Any]], 
                                     provider: str, session_id: Optional[str] = None) -> Dict[str, int]:
        """
        Ingest multiple flights in a batch
        
        Args:
            flights: List of unified flight format dicts
            provider: Provider name (alibaba, mrbilit, etc.)
            session_id: Optional session ID
            
        Returns:
            Dict with counts: {'success': int, 'failed': int}
        """
        stats = {'success': 0, 'failed': 0}
        
        print(f"\n📦 Ingesting {len(flights)} flights from {provider}...")
        
        # Enable batch mode for better performance
        self.batch_mode = True
        
        try:
            for i, flight in enumerate(flights, 1):
                if self.ingest_unified_flight(flight, session_id):
                    stats['success'] += 1
                else:
                    stats['failed'] += 1
                
                if i % 10 == 0:
                    print(f"   Progress: {i}/{len(flights)} ({stats['success']} success, {stats['failed']} failed)")
            
            # Commit once at the end
            self.conn.commit()
            
        except Exception as e:
            print(f"✗ Batch ingestion failed: {e}")
            self.conn.rollback()
            
        finally:
            # Disable batch mode
            self.batch_mode = False
        
        print(f"✓ Batch complete: {stats['success']} success, {stats['failed']} failed")
        return stats
    
    def start_scrape_session(self, provider: str, origin: str, destination: str,
                            search_date_from: str, search_date_to: str) -> Optional[int]:
        """
        Start a new scrape session
        
        Returns:
            session_id or None
        """
        try:
            self.cursor.execute("""
                INSERT INTO scrape_sessions (
                    provider, origin, destination, 
                    search_date_from, search_date_to,
                    started_at, status
                )
                VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP, 'running')
                RETURNING id
            """, (provider, origin, destination, search_date_from, search_date_to))
            
            result = self.cursor.fetchone()
            self.conn.commit()
            return result['id'] if result else None
        except Exception as e:
            print(f"✗ Failed to start scrape session: {e}")
            self.conn.rollback()
            return None
    
    def complete_scrape_session(self, session_id: int, flights_found: int,
                               flights_new: int, flights_updated: int):
        """Complete a scrape session with statistics"""
        try:
            self.cursor.execute("""
                UPDATE scrape_sessions
                SET completed_at = CURRENT_TIMESTAMP,
                    status = 'completed',
                    flights_found = %s,
                    flights_new = %s,
                    flights_updated = %s
                WHERE id = %s
            """, (flights_found, flights_new, flights_updated, session_id))
            self.conn.commit()
        except Exception as e:
            print(f"✗ Failed to complete session: {e}")
            self.conn.rollback()
    
    # Query methods
    def get_price_history(self, base_flight_id: str, hours_back: int = 168):
        """Get price history for a flight"""
        self.cursor.execute(
            "SELECT * FROM get_flight_price_history(%s, %s)",
            (base_flight_id, hours_back)
        )
        return self.cursor.fetchall()
    
    def get_price_changes(self, base_flight_id: str, hours_back: int = 168):
        """Get only price changes (when price changed)"""
        self.cursor.execute(
            "SELECT * FROM get_flight_price_changes(%s, %s)",
            (base_flight_id, hours_back)
        )
        return self.cursor.fetchall()
    
    def get_daily_stats(self, base_flight_id: str):
        """Get daily aggregated statistics"""
        self.cursor.execute(
            "SELECT * FROM get_flight_daily_stats(%s)",
            (base_flight_id,)
        )
        return self.cursor.fetchall()
    
    def get_price_comparison(self, base_flight_id: str, at_time: Optional[str] = None):
        """Compare prices across providers"""
        self.cursor.execute(
            "SELECT * FROM get_flight_price_comparison(%s, %s)",
            (base_flight_id, at_time or datetime.now())
        )
        return self.cursor.fetchall()
    
    def find_cheapest_flights(self, origin: str, destination: str,
                             date_from: str, date_to: str, limit: int = 20):
        """Find cheapest flights on a route"""
        self.cursor.execute(
            "SELECT * FROM find_cheapest_flights(%s, %s, %s, %s, %s)",
            (origin, destination, date_from, date_to, limit)
        )
        return self.cursor.fetchall()
    
    def get_capacity_trend(self, base_flight_id: str, hours_back: int = 168):
        """Get capacity changes over time"""
        self.cursor.execute(
            "SELECT * FROM get_capacity_trend(%s, %s)",
            (base_flight_id, hours_back)
        )
        return self.cursor.fetchall()
    
    def get_price_drops(self, origin: str, destination: str,
                       date_from: str, date_to: str, threshold: float = 10.0):
        """Get flights with recent price drops"""
        self.cursor.execute(
            "SELECT * FROM get_price_drops(%s, %s, %s, %s, %s)",
            (origin, destination, date_from, date_to, threshold)
        )
        return self.cursor.fetchall()
    
    def get_scraping_stats(self, hours_back: int = 24):
        """Get scraping statistics"""
        self.cursor.execute(
            "SELECT * FROM get_scraping_stats(%s)",
            (hours_back,)
        )
        return self.cursor.fetchall()


# Example usage
if __name__ == "__main__":
    # Connection string
    DB_CONNECTION = "postgresql://root:uOdMgLocGZfgtBabCufT46Im@chogolisa.liara.cloud:31593/postgres"
    
    # Initialize database
    db = FlightDatabase(DB_CONNECTION)
    
    if db.connect():
        # Example: Load and ingest unified flights
        import json
        
        print("\n" + "="*80)
        print("EXAMPLE: Ingesting flight data")
        print("="*80)
        
        # Load sample unified data
        with open('raw_scrapers_response/unified_alibaba_2025-12-15.json', 'r') as f:
            alibaba_flights = json.load(f)
        
        # Ingest batch
        stats = db.ingest_unified_flights_batch(
            alibaba_flights[:5],  # Just first 5 for demo
            provider='alibaba'
        )
        
        print(f"\n✓ Ingested {stats['success']} flights")
        
        # Query example
        if stats['success'] > 0:
            print("\n" + "="*80)
            print("EXAMPLE: Querying price data")
            print("="*80)
            
            # Get cheapest flights THR -> MHD
            flights = db.find_cheapest_flights('THR', 'MHD', '2025-12-15', '2025-12-16', limit=5)
            
            print(f"\nCheapest flights THR → MHD:")
            for f in flights:
                print(f"  {f['airline_code']} {f['flight_number']} - {f['min_price']:,} IRR")
        
        db.disconnect()
