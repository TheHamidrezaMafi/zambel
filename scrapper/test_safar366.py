"""
Test script for safar366 scraper
This script tests the safar366 crawler independently
"""

import asyncio
from safar366 import Safar366


async def test_safar366_scraper():
    """Test the safar366 scraper with a sample query"""
    
    # Create an instance of the scraper
    scraper = Safar366()
    
    # Test parameters
    origin = "THR"  # Tehran
    destination = "MHD"  # Mashhad
    date = "2025-12-06"  # Format: YYYY-MM-DD
    is_foreign_flight = False
    
    print(f"Testing safar366 scraper...")
    print(f"Origin: {origin}")
    print(f"Destination: {destination}")
    print(f"Date: {date}")
    print(f"Foreign flight: {is_foreign_flight}")
    print("-" * 50)
    
    # Crawl flights
    flights = await scraper.crawl_flights(origin, destination, date, is_foreign_flight)
    
    # Display results
    print(f"\nFound {len(flights)} flights")
    print("-" * 50)
    
    if flights:
        for i, flight in enumerate(flights, 1):
            print(f"\nFlight {i}:")
            print(f"  Provider: {flight.get('provider_name')}")
            print(f"  Airline EN: {flight.get('airline_name_en')}")
            print(f"  Airline FA: {flight.get('airline_name_fa')}")
            print(f"  Flight Number: {flight.get('flight_number')}")
            print(f"  Route: {flight.get('origin')} -> {flight.get('destination')}")
            print(f"  Departure: {flight.get('departure_date_time')}")
            print(f"  Arrival: {flight.get('arrival_date_time')}")
            print(f"  Price: {flight.get('adult_price')} Rial")
            print(f"  Capacity: {flight.get('capacity')}")
    else:
        print("No flights found or an error occurred")


if __name__ == "__main__":
    asyncio.run(test_safar366_scraper())
