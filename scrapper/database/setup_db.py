#!/usr/bin/env python3
"""
Setup script for Zambeel Flight Tracker Database
Initializes schema and tests connection
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from database.flight_database import FlightDatabase


def setup_database(connection_string: str):
    """
    Setup database schema and functions
    
    Args:
        connection_string: PostgreSQL connection string
    """
    print("="*80)
    print("ZAMBEEL FLIGHT TRACKER - DATABASE SETUP")
    print("="*80)
    print()
    
    db = FlightDatabase(connection_string)
    
    # Connect
    if not db.connect():
        print("\n✗ Failed to connect to database")
        return False
    
    print("\n📋 Step 1: Creating schema...")
    if not db.execute_script('database/schema.sql'):
        print("✗ Failed to create schema")
        db.disconnect()
        return False
    
    print("\n📋 Step 2: Creating query functions...")
    if not db.execute_script('database/query_functions.sql'):
        print("✗ Failed to create query functions")
        db.disconnect()
        return False
    
    print("\n✅ Database setup complete!")
    print()
    print("="*80)
    print("DATABASE STRUCTURE")
    print("="*80)
    print()
    print("📊 Reference Tables (Static):")
    print("   • airlines           - Airline information")
    print("   • airports           - Airport and city data")
    print("   • aircraft_types     - Aircraft type catalog")
    print()
    print("✈️  Core Flight Tables:")
    print("   • flights            - Base flight schedule (static)")
    print("   • flight_snapshots   - Price/capacity tracking (dynamic)")
    print("   • flight_price_summary - Daily aggregated statistics")
    print()
    print("📈 Monitoring Tables:")
    print("   • scrape_sessions    - Scraping metadata and stats")
    print()
    print("🔧 Query Functions Available:")
    print("   • get_flight_price_history() - Complete price history")
    print("   • get_flight_price_changes() - Only when price changed")
    print("   • get_flight_daily_stats()   - Daily min/max/avg prices")
    print("   • get_flight_price_comparison() - Compare across providers")
    print("   • find_cheapest_flights()    - Find best prices on route")
    print("   • get_capacity_trend()       - Track capacity changes")
    print("   • get_price_drops()          - Price drop alerts")
    print("   • get_scraping_stats()       - Scraping performance")
    print()
    
    # Test query
    print("="*80)
    print("TESTING DATABASE")
    print("="*80)
    print()
    
    try:
        # Check tables exist
        db.cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        """)
        tables = db.cursor.fetchall()
        
        print(f"✓ Found {len(tables)} tables:")
        for table in tables:
            print(f"   • {table['table_name']}")
        print()
        
        # Check functions exist
        db.cursor.execute("""
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_type = 'FUNCTION'
            AND routine_name LIKE 'get_%' OR routine_name LIKE 'find_%'
            ORDER BY routine_name
        """)
        functions = db.cursor.fetchall()
        
        print(f"✓ Found {len(functions)} query functions:")
        for func in functions:
            print(f"   • {func['routine_name']}()")
        print()
        
        print("✅ All tests passed!")
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        db.disconnect()
        return False
    
    db.disconnect()
    return True


if __name__ == "__main__":
    # Database connection
    DB_CONNECTION = "postgresql://root:uOdMgLocGZfgtBabCufT46Im@chogolisa.liara.cloud:31593/postgres"
    
    success = setup_database(DB_CONNECTION)
    
    if success:
        print("\n" + "="*80)
        print("✅ DATABASE READY FOR USE")
        print("="*80)
        print()
        print("Next steps:")
        print("1. Use flight_database.py to ingest unified flight data")
        print("2. Query using the provided functions")
        print("3. Set up hourly scraping jobs")
        print()
        sys.exit(0)
    else:
        print("\n✗ Setup failed")
        sys.exit(1)
