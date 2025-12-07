"""
Test script to verify safar366 data mapping
This script tests the transformation with the actual API response structure
"""

from safar366 import Safar366


def test_data_mapping():
    """Test the data transformation with a sample response"""
    
    # Sample response from safar366 API (as provided by user)
    sample_response = {
        "Success": True,
        "Items": [
            {
                "AirItinerary": [
                    {
                        "SessionId": "b0e0cce3-150e-48de-b46e-d1b8e9f3e603",
                        "CombinationId": 1,
                        "RecommendationId": 0,
                        "SubsystemId": 16,
                        "SubsystemName": "sepehr"
                    }
                ],
                "AirItineraryPricingInfo": {
                    "ItinTotalFare": {
                        "BaseFare": 21769000,
                        "TotalFare": 21769000,
                        "TotalCommission": 0,
                        "TotalTax": 0,
                        "ServiceTax": 0,
                        "Original": 48007000,
                        "Currency": "IRR"
                    }
                },
                "OriginDestinationInformation": {
                    "OriginDestinationOption": [
                        {
                            "DepartureDateTime": "2025-11-28T15:00:00",
                            "ArrivalDateTime": "2025-11-28T16:15:00",
                            "FlightSegment": [
                                {
                                    "DepartureDateTime": "2025-11-28T15:00:00",
                                    "ArrivalDateTime": "2025-11-28T16:15:00",
                                    "FlightNumber": 6700,
                                    "DepartureAirport": {
                                        "LocationCode": "THR",
                                        "AirportName": "Mehrabad Intl"
                                    },
                                    "ArrivalAirport": {
                                        "LocationCode": "MHD",
                                        "AirportName": "Shahid Hashemi Nejad"
                                    },
                                    "MarketingAirline": {
                                        "Code": "A1",
                                        "CompanyShortName": "AirOne Air"
                                    },
                                    "TPA_Extensions": {
                                        "AirlineNameFa": "اروان"
                                    },
                                    "SeatsRemaining": 5
                                }
                            ]
                        }
                    ]
                }
            }
        ]
    }
    
    # Create scraper instance
    scraper = Safar366()
    
    print("Testing data transformation...")
    print("=" * 70)
    
    # Extract Items and transform
    flight_list = sample_response.get("Items", [])
    print(f"\n✓ Found {len(flight_list)} flight(s) in Items array")
    
    # Convert keys to snake_case
    flight_list = scraper.output_wrapper(flight_list)
    print("✓ Converted keys to snake_case")
    
    # Transform to standardized format
    transformed = scraper.transform_flight_data(flight_list, is_foreign_flight=False)
    print(f"✓ Transformed to standardized format")
    
    print("\n" + "=" * 70)
    print("EXPECTED VALUES FROM SAMPLE JSON:")
    print("=" * 70)
    print("Price: 21769000 Rial (from AirItineraryPricingInfo.ItinTotalFare.TotalFare)")
    print("Origin: THR (from FlightSegment[0].DepartureAirport.LocationCode)")
    print("Destination: MHD (from FlightSegment[0].ArrivalAirport.LocationCode)")
    print("Departure: 2025-11-28T15:00:00 (from FlightSegment[0].DepartureDateTime)")
    print("Arrival: 2025-11-28T16:15:00 (from FlightSegment[0].ArrivalDateTime)")
    print("Flight Number: 6700 (from FlightSegment[0].FlightNumber)")
    print("Airline Code: A1 (from FlightSegment[0].MarketingAirline.Code)")
    print("Airline Name (EN): AirOne Air (from FlightSegment[0].MarketingAirline.CompanyShortName)")
    print("Airline Name (FA): اروان (from FlightSegment[0].TPA_Extensions.AirlineNameFa)")
    print("Capacity: 5 (from FlightSegment[0].SeatsRemaining)")
    
    print("\n" + "=" * 70)
    print("ACTUAL TRANSFORMED OUTPUT:")
    print("=" * 70)
    
    if transformed:
        flight = transformed[0]
        
        # Verify each field
        checks = [
            ("Provider Name", flight.get('provider_name'), "safar366"),
            ("Price (adult_price)", flight.get('adult_price'), 21769000),
            ("Origin", flight.get('origin'), "THR"),
            ("Destination", flight.get('destination'), "MHD"),
            ("Departure DateTime", flight.get('departure_date_time'), "2025-11-28T15:00:00"),
            ("Arrival DateTime", flight.get('arrival_date_time'), "2025-11-28T16:15:00"),
            ("Flight Number", str(flight.get('flight_number')), "6700"),
            ("Airline Name (EN)", flight.get('airline_name_en'), "AirOne Air"),
            ("Airline Name (FA)", flight.get('airline_name_fa'), "اروان"),
            ("Capacity", flight.get('capacity'), 5),
            ("Is Foreign Flight", flight.get('is_foreign_flight'), False),
        ]
        
        all_passed = True
        for field_name, actual, expected in checks:
            status = "✓" if actual == expected else "✗"
            if actual != expected:
                all_passed = False
            print(f"{status} {field_name}: {actual} {'(Expected: ' + str(expected) + ')' if actual != expected else ''}")
        
        print("\n" + "=" * 70)
        if all_passed:
            print("✓ ALL CHECKS PASSED! Data mapping is correct.")
        else:
            print("✗ SOME CHECKS FAILED! Please review the mapping.")
        print("=" * 70)
        
        print("\nFull transformed flight object:")
        print(flight)
    else:
        print("✗ No flights were transformed! Check the transformation logic.")


if __name__ == "__main__":
    test_data_mapping()
