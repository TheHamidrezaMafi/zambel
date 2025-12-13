# Flight Price History Tracking Feature

## Overview

This feature automatically records flight search results to the database whenever a user searches for a flight. It enables the system to:

1. **Track Price Changes Over Time**: Monitor how flight prices change throughout the day
2. **Show Price History**: Display historical price data when users search later for the same route and date
3. **Detect Price Drops**: Identify favorable prices to alert users
4. **Optimize Performance**: Cache search results from the last hour to speed up repeat searches

## Architecture

### Components

#### 1. **PriceHistoryTrackerService**
- Located in: `/backend/src/modules/flights/services/price-history-tracker.service.ts`
- Responsibilities:
  - Records flight price data from search results to the database
  - Checks if data was already saved in the last hour (avoids duplicate saves)
  - Manages tracked flights and price history records
  - Provides batch recording capabilities

**Key Methods:**
```typescript
// Record search results and save to database if not done recently
recordSearchResults(flights, origin, destination, flightDate)

// Get cache age for a route/date
getCacheAge(origin, destination, flightDate)

// Batch record multiple search results
recordBatchSearchResults(searchResults)
```

#### 2. **FlightAggregationService** (Enhanced)
- Located in: `/backend/src/modules/flights/services/flight-aggregation.service.ts`
- Now includes automatic price history recording
- Records price history asynchronously after search completes
- Ensures search response is returned quickly while data is saved in background

#### 3. **Database Schema**
Uses existing tables:
- `tracked_flights`: Stores unique flight records (flight_number, date, origin, destination)
- `flight_price_history`: Stores price snapshots for each flight

## How It Works

### Search Flow

```
User Search Request
    ↓
Query all flight providers (in parallel)
    ↓
Aggregate results and group by flight
    ↓
Return results to user immediately
    ↓
[Asynchronous] Record price history to database
    ├─ For each flight in results:
    │   ├─ Check if recent record exists (< 1 hour)
    │   ├─ If yes: Skip (avoid duplicate)
    │   └─ If no: Save tracked flight + price history
    └─ Completed without blocking user response
```

### One-Hour Cache Window

The system maintains a **1-hour cache window** to prevent duplicate records:

- **First search** for `THR → MHD on 2025-12-15`:
  - Queries all providers
  - Returns results
  - Records 50 flights × 5 providers = 250 price history records
  
- **Second search** (same route/date, within 60 minutes):
  - Queries all providers again
  - Returns results
  - Skips saving (recent records exist)
  
- **Third search** (same route/date, after 60+ minutes):
  - Queries all providers
  - Returns results
  - Records again (1 hour has passed)

## Usage

### In Backend

The feature works automatically. When the search endpoint is called:

```typescript
// In flights.controller.ts
@Post('search-enhanced')
async searchFlightEnhanced(@Body() searchDto: FlightSearchDto) {
  // This automatically records price history asynchronously
  return this.flightService.searchFlightEnhanced(searchDto);
}
```

### API Endpoints

#### Search Flights (with auto price history recording)
```
POST /flights/search-enhanced
Body: {
  "origin": "THR",
  "destination": "MHD",
  "departure_date": "2025-12-15",
  "return_date": "2025-12-20",
  "adults": 1,
  "provider": "" // Empty for all
}
```

#### Get Price History
```
GET /flights/price-history/:baseFlightId?hours_back=168&changes_only=false
```

#### Get Price Changes Only
```
GET /flights/price-changes/:baseFlightId?hours_back=168
```

## Time & Cache Utilities

Located in: `/backend/src/modules/flights/utils/time-cache.utils.ts`

Provides helper functions:

```typescript
// Check if data is fresh
isDataFresh(lastUpdated, maxAgeMinutes)

// Get data age in minutes
getDataAgeMinutes(lastUpdated)

// Get human-readable age
getDataAgeReadable(lastUpdated)

// Check cache validity with details
getCacheValidity(lastUpdated, maxAgeMinutes)

// Get time until cache expires
getTimeUntilCacheExpires(lastUpdated, maxAgeMinutes)

// Batch check multiple routes
checkCacheValidityBatch(items, maxAgeMinutes)
```

### Example Usage

```typescript
import { isDataFresh, getDataAgeReadable } from './utils/time-cache.utils';

// Check if data is fresh
if (isDataFresh(lastUpdate, 60)) {
  // Data is less than 60 minutes old
  return cachedData;
}

// Get human-readable age
const age = getDataAgeReadable(dbResult.scraped_at); // "5 minutes ago"
```

## Database Considerations

### Performance Optimization

1. **Indexes**: Leverage existing indexes on `flight_price_history`:
   - `IDX_price_history_flight_scraped` (tracked_flight_id, scraped_at)
   - `IDX_price_history_provider` (provider)

2. **Batch Operations**: For high-volume scenarios, use `recordBatchSearchResults()`

3. **Asynchronous Recording**: Price history is recorded asynchronously, so it doesn't block API responses

### Storage Growth

Estimated storage growth:
- Average 30-50 flights per search
- 5 providers per flight
- ~150-250 records per search
- ~2-3KB per record
- ~5 searches per hour per route = **50-75 searches/day × 10 routes = ~30-45MB/day**

Consider implementing:
- Archive old data (> 90 days) to separate table
- Set retention policy based on business needs
- Monitor database growth regularly

## Configuration

### Cache Duration

To change the cache duration from 1 hour to another value:

**In PriceHistoryTrackerService:**
```typescript
private readonly CACHE_DURATION_MINUTES = 60; // Change this value
```

**In FlightsService:**
```typescript
private isDataFresh(flights: any[]): boolean {
  const ageMinutes = ...;
  return ageMinutes < 60; // Change this value
}
```

## Monitoring & Debugging

### Log Messages

The feature logs important events:

```
DEBUG: Recording price history for THR->MHD on 2025-12-15, 50 flights
DEBUG: Price history recorded: 45 saved, 5 skipped
WARN: Skipping flight XX123 - recent record exists
ERROR: Error recording flight XX456: [error details]
```

### Query Recent Records

```sql
-- Check if records exist for a route
SELECT COUNT(*) FROM flight_price_history fph
INNER JOIN tracked_flights tf ON tf.id = fph.tracked_flight_id
WHERE tf.origin = 'THR'
  AND tf.destination = 'MHD'
  AND tf.flight_date = '2025-12-15'
  AND fph.scraped_at > NOW() - INTERVAL '1 hour';

-- View price history for a flight
SELECT * FROM flight_price_history
WHERE tracked_flight_id = 'flight-uuid'
ORDER BY scraped_at DESC
LIMIT 10;

-- Get cache age for a route
SELECT MAX(fph.scraped_at) as last_update
FROM flight_price_history fph
INNER JOIN tracked_flights tf ON tf.id = fph.tracked_flight_id
WHERE tf.origin = 'THR' AND tf.destination = 'MHD' AND tf.flight_date = '2025-12-15';
```

## Error Handling

The system is resilient:

1. **Non-blocking**: If price history recording fails, search still completes
2. **Graceful degradation**: Failures are logged but don't affect API response
3. **Duplicate prevention**: Conflicts with existing records are handled automatically (ON CONFLICT DO UPDATE)

## Frontend Integration

### How the Frontend Benefts

1. **Price History Display**: Can fetch historical prices using `/flights/price-history/:baseFlightId`
2. **Price Trends**: Show price trends over time
3. **Price Alerts**: Identify when prices drop significantly
4. **Comparison**: Compare prices across different search times

### Example Frontend Usage

```typescript
// Get price history for a flight
const response = await fetch(`/flights/price-history/${baseFlightId}?hours_back=168`);
const history = await response.json();

// Display price trend chart
displayPriceChart(history);

// Show cache age
const cacheAge = history.oldest_record_age_minutes;
if (cacheAge < 60) {
  showNotice(`Data updated ${cacheAge} minutes ago`);
}
```

## Testing

### Test Cases

1. **First Search**: Verify data is saved
2. **Repeat Search (< 1 hour)**: Verify skipping works
3. **Repeat Search (> 1 hour)**: Verify new data is saved
4. **Price Changes**: Verify different prices are detected
5. **Failed Providers**: Verify only valid flights are recorded

### Example Test

```typescript
describe('PriceHistoryTracker', () => {
  it('should skip saving if recent record exists', async () => {
    // First search
    await tracker.recordSearchResults(flights, 'THR', 'MHD', '2025-12-15');
    
    // Second search immediately after
    const result = await tracker.recordSearchResults(flights, 'THR', 'MHD', '2025-12-15');
    expect(result.saved).toBe(0); // All should be skipped
    expect(result.skipped).toBeGreaterThan(0);
  });
});
```

## Future Enhancements

1. **Price Drop Alerts**: Automatic notifications when price drops X%
2. **Predictive Pricing**: Use historical data to predict future prices
3. **Compression**: Store aggregate prices instead of every record
4. **Real-time Updates**: WebSocket updates for price changes
5. **Multi-date Tracking**: Track entire round-trip price variations

## Support

For issues or questions:
1. Check logs for error messages
2. Verify database connectivity
3. Review database indexes are in place
4. Check available disk space
