# Flight Price History Tracking - Architecture & Flow Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React/Next.js)                    │
│  • Flight Search Component                                          │
│  • Price History Chart                                              │
│  • Price Trend Display                                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                    POST /flights/search-enhanced
                               │
┌──────────────────────────────▼──────────────────────────────────────┐
│                    NESTJS BACKEND (Port 3000)                       │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │              FlightsController                              │   │
│  │  • POST /search-enhanced → FlightsService.searchFlight()   │   │
│  │  • GET /price-history/:id → FlightsService.getPriceHistory│   │
│  │  • GET /price-changes/:id → FlightsService.getPriceChanges│   │
│  └──────────────────┬─────────────────────────────────────────┘   │
│                     │                                               │
│  ┌──────────────────▼─────────────────────────────────────────┐   │
│  │         FlightAggregationService (Updated)                 │   │
│  │                                                              │   │
│  │  searchFlights() {                                          │   │
│  │    1. Query all providers in parallel                       │   │
│  │    2. Aggregate results by base_flight_id                  │   │
│  │    3. Return grouped flights to user IMMEDIATELY           │   │
│  │    4. [ASYNC] recordPriceHistoryAsync()                    │   │
│  │  }                                                           │   │
│  └──────────────────┬─────────────────────────────────────────┘   │
│                     │                                               │
│                     │ setImmediate(async () => {                   │
│  ┌──────────────────▼─────────────────────────────────────────┐   │
│  │      PriceHistoryTrackerService (NEW)                      │   │
│  │                                                              │   │
│  │  recordSearchResults(flights, origin, dest, date) {         │   │
│  │    For each flight:                                         │   │
│  │      • Validate flight data                                 │   │
│  │      • Check if recent record exists (< 1 hour)            │   │
│  │      • If NOT: Insert tracked_flight + price_history       │   │
│  │      • If YES: Skip (deduplicate)                           │   │
│  │  }                                                           │   │
│  │                                                              │   │
│  │  Private helpers:                                           │   │
│  │  • recordFlightPriceHistory()                               │   │
│  │  • hasRecentRecord()                                        │   │
│  │  • upsertTrackedFlight()                                    │   │
│  │  • insertPriceHistory()                                     │   │
│  │  • extractTrackedFlightData()                               │   │
│  │  • extractPriceHistoryData()                                │   │
│  │  • isValidFlight()                                          │   │
│  │  • getCacheAge()                                            │   │
│  └──────────────────┬─────────────────────────────────────────┘   │
│                     │                                               │
│                     │ Dependency: PostgresService                   │
│  ┌──────────────────▼─────────────────────────────────────────┐   │
│  │        PostgresService (Core Database Layer)               │   │
│  │                                                              │   │
│  │  • queryOne()  - Execute query, return single result        │   │
│  │  • queryMany() - Execute query, return array                │   │
│  │  • query()     - Execute raw query                          │   │
│  └──────────────────┬─────────────────────────────────────────┘   │
└──────────────────────▼─────────────────────────────────────────────┘
                       │
                       │ PostgreSQL
                       │
┌──────────────────────▼──────────────────────────────────────────────┐
│                   POSTGRESQL DATABASE                               │
│                                                                      │
│  Tables:                                                            │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ tracked_flights                                             │  │
│  │ ├─ id (UUID, PK)                                            │  │
│  │ ├─ flight_number (VARCHAR)                                  │  │
│  │ ├─ flight_date (DATE)                                       │  │
│  │ ├─ origin (VARCHAR)                                         │  │
│  │ ├─ destination (VARCHAR)                                    │  │
│  │ ├─ airline_name_fa/en                                       │  │
│  │ ├─ departure_time (TIMESTAMP)                               │  │
│  │ ├─ arrival_time (TIMESTAMP)                                 │  │
│  │ ├─ created_at (TIMESTAMP)                                   │  │
│  │ ├─ last_tracked_at (TIMESTAMP)                              │  │
│  │ └─ is_active (BOOLEAN)                                      │  │
│  │ Indices:                                                    │  │
│  │ ├─ UNIQUE(flight_number, flight_date, origin, destination) │  │
│  │ ├─ flight_date                                              │  │
│  │ └─ origin, destination                                      │  │
│  └─────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │ flight_price_history                                        │  │
│  │ ├─ id (UUID, PK)                                            │  │
│  │ ├─ tracked_flight_id (UUID, FK) ────────┐                  │  │
│  │ ├─ provider (VARCHAR)                    │                  │  │
│  │ ├─ adult_price (NUMERIC)                 │                  │  │
│  │ ├─ child_price (NUMERIC, nullable)       │                  │  │
│  │ ├─ infant_price (NUMERIC, nullable)      │                  │  │
│  │ ├─ available_seats (INT)                 │                  │  │
│  │ ├─ scraped_at (TIMESTAMP)                │                  │  │
│  │ ├─ is_available (BOOLEAN)                │                  │  │
│  │ ├─ raw_data (JSONB)                      │                  │  │
│  │ ├─ price_change_percentage (NUMERIC)     │ ON DELETE CASCADE│  │
│  │ └─ price_change_amount (NUMERIC)         │                  │  │
│  │ Indices:                                    │                  │
│  │ ├─ (tracked_flight_id, scraped_at) ◄─────┘                 │  │
│  │ ├─ scraped_at                                               │  │
│  │ └─ provider                                                 │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

## Search Flow Diagram

```
USER INITIATES FLIGHT SEARCH
         │
         ▼
┌─────────────────────────────────────┐
│ POST /flights/search-enhanced       │
│ {origin, destination, date}         │
└────────────────┬────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│ FlightsService.searchFlight()            │
└────────────────┬─────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────────┐
│ FlightAggregationService.searchFlights()     │
│                                               │
│ 1. Get available providers                   │
│    [ir-tourism, alibaba, safarmarket, ...]  │
│                                               │
│ 2. Query all providers in PARALLEL           │
│    ├─ provider-a.query() → [50 flights]     │
│    ├─ provider-b.query() → [45 flights]     │
│    ├─ provider-c.query() → [60 flights]     │
│    └─ provider-d.query() → [30 flights]     │
│                                               │
│ 3. Aggregate by base_flight_id              │
│    Results: 40 unique flights               │
│             250 pricing options             │
│                                               │
│ 4. Filter invalid flights (price=0, cap=0) │
│    Results: 38 unique flights               │
│             245 pricing options             │
│                                               │
│ 5. Sort by departure time                   │
│    Ready for response                        │
└─────────────────┬──────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  RETURN TO USER │  ◄── INSTANT (blocks here ~3.5s for scraping)
         └────────────────┘
                  │
                  ▼
         ┌─────────────────────────┐
         │ [ASYNC] setImmediate()  │  ◄── Non-blocking background task
         └────────────┬────────────┘
                      │
                      ▼
         ┌────────────────────────────────────────┐
         │ PriceHistoryTrackerService             │
         │ .recordSearchResults(flights...)       │
         │                                        │
         │ For each flight (38 total):            │
         │   ├─ Validate flight data              │
         │   │  ├─ Has flight_number? YES         │
         │   │  ├─ Has origin/dest? YES           │
         │   │  ├─ Has price > 0? YES             │
         │   │  ├─ Has capacity > 0? YES          │
         │   │  └─ Valid? PROCEED                 │
         │   │                                    │
         │   ├─ Check for recent record           │
         │   │  (< 1 hour old)                    │
         │   │  │                                 │
         │   │  ├─ If FOUND:                      │
         │   │  │  └─ SKIP (skip++)              │
         │   │  │                                 │
         │   │  └─ If NOT FOUND:                  │
         │   │     ├─ Insert tracked_flight       │
         │   │     ├─ Insert price_history        │
         │   │     └─ saved++                     │
         │   │                                    │
         │   └─ Log result (DEBUG)                │
         │                                        │
         │ Return: {saved: 28, skipped: 10}      │
         └────────────────────────────────────────┘
                      │
                      ▼
         ┌─────────────────────────────┐
         │ Database Updates Complete   │
         │ (User didn't wait for this) │
         └─────────────────────────────┘
```

## Data Flow Per Flight

```
UnifiedFlight from Scraper
        │
        ├─ base_flight_id: "IR101-20251215"
        ├─ flight_number: "IR101"
        ├─ airline.code: "IR"
        ├─ route.origin.airport_code: "THR"
        ├─ route.destination.airport_code: "MHD"
        ├─ schedule.departure_datetime: "2025-12-15T10:00:00Z"
        ├─ pricing.adult.total_fare: 1150000
        ├─ ticket_info.capacity: 15
        ├─ provider_source: "provider-a"
        └─ ... more fields
        │
        ▼ (Extracted in recordFlightPriceHistory)
        │
        ├─ TrackedFlightData:
        │  ├─ flight_number: "IR101"
        │  ├─ flight_date: "2025-12-15"
        │  ├─ origin: "THR"
        │  ├─ destination: "MHD"
        │  ├─ airline_name_fa: "ایران ایر"
        │  ├─ airline_name_en: "Iran Air"
        │  ├─ departure_time: "2025-12-15T10:00:00Z"
        │  └─ arrival_time: "2025-12-15T11:30:00Z"
        │
        └─ PriceHistoryData:
           ├─ provider: "provider-a"
           ├─ adult_price: 1150000
           ├─ child_price: null
           ├─ infant_price: null
           ├─ capacity: 15
           ├─ is_available: true
           └─ raw_data: {
              ├─ flight_id: "flight-001"
              ├─ cabin_class: "economy"
              ├─ is_charter: false
              ├─ is_refundable: true
              └─ ...
           }
        │
        ▼ (Check for recent record)
        │
    Check PostgreSQL:
    SELECT COUNT(*) FROM flight_price_history fph
    WHERE tracked_flight_id = ? 
      AND provider = "provider-a"
      AND scraped_at > NOW() - '1 hour'
        │
        ├─ If COUNT > 0:
        │  └─ SKIP (already saved in last hour)
        │
        └─ If COUNT = 0:
           │
           ├─ INSERT into tracked_flights
           │  └─ Returns tracked_flight_id
           │
           └─ INSERT into flight_price_history
              ├─ tracked_flight_id
              ├─ provider: "provider-a"
              ├─ adult_price: 1150000
              ├─ available_seats: 15
              ├─ scraped_at: NOW()
              └─ is_available: true
```

## Time Cache Window Illustration

```
Timeline of searches for THR → MHD on 2025-12-15

Search 1: 10:00 AM
  ├─ Provider A returns 50 flights
  └─ SAVE ALL 50 records to database
         │
         ├─ tracked_flights: 50 inserts
         └─ flight_price_history: 250 inserts (50 flights × 5 providers)
                    │
                    ▼ 60-minute window starts
                ┌─────────────────────┐
                │  FRESH CACHE ZONE   │
                │  (< 1 hour old)     │
                │                     │
    Search 2: 10:30 AM (30 min later)
      └─ Provider A returns same 50 flights
         ├─ Check each flight...
         ├─ All 50 have records from 30 mins ago
         └─ SKIP ALL 50 (no new saves)
                │
                │ Cache still fresh...
                │
    Search 3: 10:59 AM (59 min later)
      └─ Provider A returns 50 flights (prices changed slightly)
         ├─ Check each flight...
         ├─ All 50 have records from 59 mins ago
         └─ SKIP ALL 50 (cache still valid)
                │
                │ Cache expires...
                ▼
            60-minute window ends
                │
    Search 4: 11:01 AM (61 min later)
      └─ Provider A returns 50 flights (prices changed more)
         ├─ Check each flight...
         ├─ No records found (older than 60 min)
         └─ SAVE ALL 50 again (new cycle starts)
                    │
                    └─ New window starts →
```

## Component Interaction Diagram

```
                    ┌──────────────────────┐
                    │  FlightsController   │
                    └──────────┬───────────┘
                               │
                    POST /search-enhanced
                               │
                    ┌──────────▼───────────┐
                    │  FlightsService      │
                    │  .searchFlight()     │
                    └──────────┬───────────┘
                               │
                    ┌──────────▼────────────────────────┐
                    │ FlightAggregationService          │
                    │ .searchFlights()                  │
                    │                                  │
                    │ ┌──────────────────────────────┐ │
                    │ │ 1. Query providers           │ │
                    │ │ 2. Aggregate results         │ │
                    │ │ 3. Return to user FAST       │ │
                    │ │ 4. recordPriceHistoryAsync() │ │ ◄── ASYNC
                    │ └──────────┬───────────────────┘ │
                    └────────────┼────────────────────┘
                                 │
                    ┌────────────▼──────────────────┐
                    │ PriceHistoryTrackerService    │
                    │ .recordSearchResults()        │
                    │                              │
                    │ ┌──────────────────────────┐ │
                    │ │ For each flight:         │ │
                    │ │ ├─ Validate             │ │
                    │ │ ├─ Check recent record  │ │
                    │ │ ├─ Extract data         │ │
                    │ │ ├─ Upsert tracked      │ │
                    │ │ └─ Insert history       │ │
                    │ └────────┬────────────────┘ │
                    └─────────┼──────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │ PostgresService    │
                    │ .queryOne/query    │
                    └─────────┬──────────┘
                              │
                    ┌─────────▼──────────┐
                    │ PostgreSQL         │
                    │ Database           │
                    └────────────────────┘
```

## Performance Characteristics

```
Timeline View:

User Search Request
         │
         ▼ (immediately)
    Query Providers        ← 2-4 seconds (network I/O)
         │
         ▼ (immediately)
    Aggregate Results      ← <100ms (in-memory processing)
         │
         ▼ (< 5ms)
    RETURN TO USER         ← Total: ~3-4 seconds
         │
    [User sees results]
         │
         ▼ (deferred, non-blocking)
    Record Price History   ← <500ms (DB operations)
         │
    [Background task completes]

User Impact:
  ✅ No delay in search results
  ✅ Instant feedback
  ✅ Price history saved in background
  ✅ No user notices the DB operations
```

## Database Growth Chart (Estimated)

```
Days of Operation vs Database Size

        │
  50MB  ├─────────────────────────
        │                      ╱
  40MB  ├──────────────────╱
        │              ╱
  30MB  ├──────────╱
        │      ╱
  20MB  ├──╱
        │╱
  10MB  ├─────────────────────────
        │
   0    └─────────────────────────
        Day1  Day5  Day10 Day20 Day30

Per Day:
  • 50-75 searches per route × 10 routes
  • 150-250 records per search
  • ~2-3 KB per record
  • ~30-45 MB/day growth

Recommendation:
  • Archive data > 90 days
  • Set retention policy
  • Monitor with alert at 80% capacity
```

---

This architecture ensures:
- ✅ Fast user response times
- ✅ Non-blocking background processing
- ✅ Efficient database usage
- ✅ Scalable design
- ✅ Comprehensive data collection
