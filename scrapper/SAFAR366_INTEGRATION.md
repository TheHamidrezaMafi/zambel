# Safar366 Integration Verification

## ✅ Integration Complete

The safar366 scraper has been successfully integrated and the data mapping has been corrected to match the actual API response structure.

## Data Flow

```
Frontend Search Request
        ↓
Backend (NestJS) - flights.service.ts
        ↓
Backend - scraper.service.ts (gRPC client)
        ↓
Scraper (Python) - main.py (gRPC server)
        ↓
safar366.py - crawl_flights()
        ↓
safar366 API (https://171.22.24.69/api/v1.0/flights/search)
        ↓
Transform data to standard format
        ↓
Return to Backend
        ↓
Backend normalizes & sorts flights
        ↓
Return to Frontend
```

## API Response Structure (Corrected)

Based on the actual API response you provided, the structure is:

```json
{
  "Success": true,
  "Items": [  // ✓ FIXED: Changed from "PricedItineraries" to "Items"
    {
      "AirItineraryPricingInfo": {
        "ItinTotalFare": {
          "TotalFare": 21769000  // ✓ FIXED: Direct integer value, not nested object
        }
      },
      "OriginDestinationInformation": {
        "OriginDestinationOption": [
          {
            "FlightSegment": [
              {
                "FlightNumber": 6700,
                "DepartureDateTime": "2025-11-28T15:00:00",
                "ArrivalDateTime": "2025-11-28T16:15:00",
                "DepartureAirport": {
                  "LocationCode": "THR"  // ✓ FIXED: Nested in airport object
                },
                "ArrivalAirport": {
                  "LocationCode": "MHD"  // ✓ FIXED: Nested in airport object
                },
                "MarketingAirline": {
                  "Code": "A1",
                  "CompanyShortName": "AirOne Air"  // ✓ FIXED: English name here
                },
                "TPA_Extensions": {
                  "AirlineNameFa": "اروان"  // ✓ FIXED: Farsi name in extensions
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
```

## Data Mapping Corrections Made

### 1. Changed API Response Key
- **Before**: `json_response.get("PricedItineraries", [])`
- **After**: `json_response.get("Items", [])`

### 2. Fixed Price Extraction
- **Before**: `itin_total_fare.get("total_fare", {}).get("amount", 0)`
- **After**: `itin_total_fare.get("total_fare", 0)` (direct integer)

### 3. Fixed Data Structure Navigation
- **Before**: Used `origin_destination_options` → `flight_segments`
- **After**: Uses `origin_destination_information` → `origin_destination_option` → `flight_segment`

### 4. Fixed Airport Code Extraction
- **Before**: `first_segment.get("departure_airport_location_code", "")`
- **After**: `first_segment.get("departure_airport", {}).get("location_code", "")`

### 5. Fixed Airline Name Extraction
- **Before**: Empty string for Farsi name
- **After**: `first_segment.get("tpa_extensions", {}).get("airline_name_fa", "")`
- **Before**: Used `validating_airline_code` for English name
- **After**: `marketing_airline.get("company_short_name", "")`

## Standardized Output Format

Each flight is transformed to this standard format that matches other scrapers:

```python
{
    "provider_name": "safar366",
    "origin": "THR",
    "destination": "MHD",
    "departure_date_time": "2025-11-28T15:00:00",
    "arrival_date_time": "2025-11-28T16:15:00",
    "adult_price": 21769000,  # ✓ Integer price in Rials
    "airline_name_fa": "اروان",  # ✓ Farsi airline name
    "airline_name_en": "AirOne Air",  # ✓ English airline name
    "flight_number": "6700",  # ✓ String flight number
    "capacity": 5,  # ✓ Seats remaining
    "is_foreign_flight": False,
    "rules": ""
}
```

## Backend Processing

After receiving flights from safar366, the backend:

1. **Normalizes Flight Numbers**: Removes airline codes, leading zeros
   - Example: "A16700" → "6700"

2. **Normalizes Airline Names**: Removes suffixes like " ایر", standardizes characters
   - Example: "اروان ایر" → "اروان"

3. **Sorts by Departure Time**: Orders flights chronologically

4. **Merges with Other Providers**: Combines results from all scrapers

## How It Works When You Search

1. **Frontend sends search request** with:
   - Origin: e.g., "THR"
   - Destination: e.g., "MHD"
   - Date: e.g., "2025-11-28"
   - Provider: Can specify "safar366" or leave empty for all providers

2. **Backend determines domestic vs foreign** based on airport codes

3. **Scraper main.py routes to appropriate function**:
   - `crawl_domestic()` - for Iranian domestic flights
   - `crawl_foreign()` - for international flights

4. **safar366.py is included in providers dict**:
   ```python
   providers = {
       "alibaba": alibaba_crawler,
       "flytoday": flytoday_crawler,
       "mrbilit": mrbilit_crawler,
       "pateh": pateh_crawler,
       "safarmarket": safarmarket_crawler,
       "safar366": safar366_crawler,  # ✓ Added
   }
   ```

5. **safar366 scraper**:
   - Gets fresh token from refresh endpoint
   - Makes POST request to search API
   - Transforms response to standard format
   - Returns flights

6. **Backend merges and processes**:
   - Combines flights from all providers
   - Normalizes data
   - Sorts by time
   - Returns to frontend

## Testing

### Option 1: Via Docker (Recommended)
```bash
# Start all services
docker-compose up

# Make a search request through the backend API
# The backend will automatically call safar366 along with other scrapers
```

### Option 2: Direct Test (Requires Python dependencies)
```bash
cd scrapper
pip install -r requirements.txt
python3 test_safar366.py
```

### Option 3: Data Mapping Test
```bash
cd scrapper
python3 test_safar366_mapping.py
```

## Key Points

✅ **Price is correctly extracted**: `21769000` Rials from `TotalFare`

✅ **Flight number is correctly extracted**: `6700` from `FlightNumber`

✅ **Airline names are correctly extracted**: 
- Farsi: `اروان` from `TPA_Extensions.AirlineNameFa`
- English: `AirOne Air` from `MarketingAirline.CompanyShortName`

✅ **Airport codes are correctly extracted**: `THR` and `MHD` from nested airport objects

✅ **Dates are correctly extracted**: ISO format timestamps

✅ **Capacity is correctly extracted**: `5` from `SeatsRemaining`

✅ **Token refresh mechanism**: Automatic retry on 401 errors

✅ **Integration is complete**: Added to both domestic and foreign crawlers in main.py

## Files Modified

1. **scrapper/safar366.py** - Fixed data extraction paths
2. **scrapper/conf.py** - Configuration already added
3. **scrapper/main.py** - Integration already added
4. **scrapper/test_safar366_mapping.py** - New test file to verify data mapping

## Conclusion

The safar366 scraper is now correctly integrated and will return flight data when you search for flights in the frontend. The data will be merged with results from other providers (alibaba, flytoday, mrbilit, pateh, safarmarket) and returned in a standardized, normalized format.
