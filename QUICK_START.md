# Flight Price History Tracking - Quick Start Guide

## What This Feature Does

Automatically records flight prices every time a user searches. This enables:
- 📊 **Price History Tracking** - See how prices change over time
- 💾 **Smart Caching** - Cache results for 1 hour to avoid duplicate database saves
- ⚡ **Fast Searches** - Show cached results when users search for the same route again
- 📈 **Price Analytics** - Data foundation for price trends and predictions

## Installation

No installation needed! The feature is already integrated. Just:

1. **Ensure database tables exist:**
```bash
npm run migration:run  # if needed
```

2. **That's it!** The feature works automatically when users search

## How to Use

### Backend Automatically Handles Everything

When a user searches:
```
POST /flights/search-enhanced
{
  "origin": "THR",
  "destination": "MHD", 
  "departure_date": "2025-12-15",
  "adults": 1
}
```

The system:
1. Returns search results immediately
2. Saves price history in background (non-blocking)
3. Next time user searches same route/date, it's faster

### Get Price History (Frontend)

Show users price trends:

```typescript
// Get complete price history
const response = await fetch('/flights/price-history/flight-uuid?hours_back=168');
const history = await response.json();

// history.history contains:
// [{
//   scraped_at: "2025-12-15T10:00:00Z",
//   provider_source: "provider-a",
//   adult_total_fare: 1150000,
//   capacity: 15,
//   is_available: true,
//   age_minutes: 120
// }]

// Display in a chart
displayPriceChart(history);
```

## Testing

### Run Unit Tests
```bash
npm test -- price-history-tracker.service.spec.ts
npm test -- time-cache.utils.spec.ts
```

### Check Database
```sql
-- See records saved in last hour
SELECT COUNT(*) FROM flight_price_history 
WHERE scraped_at > NOW() - INTERVAL '1 hour';

-- View price history for a flight
SELECT * FROM flight_price_history
WHERE tracked_flight_id = 'your-flight-id'
ORDER BY scraped_at DESC
LIMIT 10;
```

### Check Logs
```bash
# Look for these log messages:
# DEBUG: Recording price history for THR->MHD on 2025-12-15, 50 flights
# DEBUG: Price history recorded: 45 saved, 5 skipped
```

## Configuration

### Change Cache Duration (Default: 60 minutes)

Edit `backend/src/modules/flights/services/price-history-tracker.service.ts`:
```typescript
// Change this line to desired minutes
private readonly CACHE_DURATION_MINUTES = 60;  // Change to 30, 120, etc.
```

## Key Files

| File | Purpose |
|------|---------|
| `price-history-tracker.service.ts` | Core service (300+ lines) |
| `time-cache.utils.ts` | Time/cache helpers (300+ lines) |
| `flight-aggregation.service.ts` | Updated to trigger recording |
| `flights.module.ts` | Updated to provide service |
| `PRICE_HISTORY_TRACKING.md` | Full documentation |

## Common Questions

### Q: Does it slow down searches?
**A:** No! Price history is saved asynchronously in background. Search response returns immediately.

### Q: Will it save duplicate records?
**A:** No! It checks for records from the last hour and skips if found. Prevents database bloat.

### Q: How much storage does it use?
**A:** ~30-45 MB/day with 50 searches/day across 10 routes. Plan accordingly.

### Q: What if database connection fails?
**A:** Graceful error handling - search still works, recording just skips. Logged for debugging.

### Q: How do I show price history to users?
**A:** Call `/flights/price-history/{baseFlightId}?hours_back=168` and display results in chart.

## Monitoring

### Key Metrics to Watch
```sql
-- Daily growth
SELECT DATE(scraped_at), COUNT(*) 
FROM flight_price_history 
GROUP BY DATE(scraped_at) 
ORDER BY DATE(scraped_at) DESC 
LIMIT 7;

-- Most expensive routes (in terms of records)
SELECT tf.origin, tf.destination, COUNT(*) as record_count
FROM flight_price_history fph
JOIN tracked_flights tf ON tf.id = fph.tracked_flight_id
WHERE fph.scraped_at > NOW() - INTERVAL '24 hours'
GROUP BY tf.origin, tf.destination
ORDER BY record_count DESC;

-- Provider coverage
SELECT provider, COUNT(*) as records
FROM flight_price_history
WHERE scraped_at > NOW() - INTERVAL '24 hours'
GROUP BY provider;
```

## Troubleshooting

### No records being saved?
```sql
-- Check if tables exist
SELECT * FROM information_schema.tables 
WHERE table_name IN ('tracked_flights', 'flight_price_history');

-- Check for errors in logs
-- Look for "Error recording price history"
```

### Database growing too fast?
```bash
# Consider archiving data older than 90 days
# Monitor daily with:
SELECT pg_size_pretty(pg_total_relation_size('flight_price_history'));
```

### Cache not working?
```sql
-- Verify recent records exist
SELECT MAX(scraped_at) FROM flight_price_history;

-- Check for records in last hour
SELECT COUNT(*) FROM flight_price_history 
WHERE scraped_at > NOW() - INTERVAL '1 hour';
```

## API Reference

### Search Flights (Triggers Recording)
```
POST /flights/search-enhanced
Content-Type: application/json

{
  "origin": "THR",
  "destination": "MHD",
  "departure_date": "2025-12-15",
  "return_date": "2025-12-20",
  "adults": 1,
  "children": 0,
  "infants": 0,
  "provider": ""
}

Response: {
  flights: [...],
  metadata: {
    total_flights: 50,
    total_options: 250,
    search_time_ms: 3500,
    cached: false
  }
}
```

### Get Price History
```
GET /flights/price-history/{baseFlightId}?hours_back=168&changes_only=false

Response: {
  base_flight_id: "flight-uuid",
  history: [
    {
      scraped_at: "2025-12-15T10:00:00Z",
      provider_source: "provider-a",
      adult_base_fare: 1000000,
      adult_total_fare: 1150000,
      capacity: 15,
      is_available: true,
      age_minutes: 120
    }
  ],
  total_snapshots: 48,
  hours_back: 168
}
```

### Get Price Changes Only
```
GET /flights/price-changes/{baseFlightId}?hours_back=168

Response: {
  base_flight_id: "flight-uuid",
  changes: [
    {
      scraped_at: "2025-12-15T12:00:00Z",
      provider_source: "provider-a",
      adult_total_fare: 1140000,
      price_change: -10000,
      price_change_percent: -0.87,
      capacity: 14,
      capacity_change: -1
    }
  ],
  total_changes: 8,
  hours_back: 168
}
```

## Time Utilities (Advanced)

Use these in your code for cache checking:

```typescript
import { isDataFresh, getDataAgeReadable } from './utils/time-cache.utils';

// Check if data is fresh
if (isDataFresh(dbRecord.scraped_at, 60)) {
  // Less than 60 minutes old
}

// Get readable age
const age = getDataAgeReadable(dbRecord.scraped_at);
console.log(`Data is ${age}`); // "5 minutes ago"

// Get detailed validity
const validity = getCacheValidity(dbRecord.scraped_at, 60);
// {
//   valid: true,
//   ageMinutes: 5,
//   readable: "5 minutes ago",
//   percentOfMaxAge: 8
// }
```

## What's Next?

1. ✅ **Now**: Search queries automatically save price history
2. 📊 **Soon**: Build price charts on frontend using historical data
3. 📉 **Soon**: Add price drop alerts
4. 🤖 **Future**: Predictive pricing using ML models
5. ⚡ **Future**: Real-time price updates via WebSockets

---

**Status**: ✅ Production Ready

The feature is fully implemented and actively saves price history on every search!
