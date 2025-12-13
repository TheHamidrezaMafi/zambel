"""
FastAPI Scraper Service - REST API replacement for gRPC
Provides endpoints for scraping flight data from multiple providers
"""

import asyncio
import time
import re
from typing import List, Optional
from datetime import datetime
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

# Import scrapers
from pateh import Pateh
from mrbilit import MrBilit
from alibaba import Alibaba
from flytoday import FlyToday
from safarmarket import SafarMarket
from safar366 import Safar366

# Import unified converter
from unified_converter import FlightDataConverter
from flight_id_generator import FlightIDGenerator

# Database
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'database'))
from database.flight_database import FlightDatabase

# Initialize database connection
DATABASE_URL = os.getenv(
    'DATABASE_URL',
    'postgresql://root:uOdMgLocGZfgtBabCufT46Im@chogolisa.liara.cloud:31593/postgres'
)
flight_db = FlightDatabase(DATABASE_URL)

# Connect to database at startup
try:
    flight_db.connect()
    print("✓ Database connected successfully")
except Exception as e:
    print(f"⚠ Warning: Could not connect to database: {e}")
    print("  Scraping will continue but data won't be saved to database")
    flight_db = None


# ==================== Pydantic Models ====================

class FlightRequest(BaseModel):
    """Single flight search request"""
    requested_by_user_id: str = Field(default="1", description="User ID making the request")
    from_destination: str = Field(..., description="Origin airport code (e.g., THR, MHD)", examples=["THR", "MHD", "IKA"])
    to_destination: str = Field(..., description="Destination airport code (e.g., KIH, MHD)", examples=["KIH", "MHD", "SYZ"])
    from_date: str = Field(..., description="Departure date in YYYY-MM-DD format", examples=["2025-12-15", "2026-01-20"])
    to_date: str = Field(default="", description="Return date (empty for one-way)", examples=["", "2025-12-25"])
    is_foreign_flight: bool = Field(default=False, description="True for international flights")
    type: str = Field(default="1", description="Flight type identifier")
    
    class Config:
        json_schema_extra = {
            "example": {
                "requested_by_user_id": "1",
                "from_destination": "THR",
                "to_destination": "MHD",
                "from_date": "2025-12-15",
                "to_date": "",
                "is_foreign_flight": False,
                "type": "1"
            }
        }


class FlightSearchRequest(BaseModel):
    """Request body for flight search"""
    provider_name: str = Field(default="", description="Provider name (alibaba, mrbilit, etc.) or empty for all", examples=["alibaba", "mrbilit", ""])
    requests: List[FlightRequest] = Field(..., description="List of flight search requests")
    
    class Config:
        json_schema_extra = {
            "example": {
                "provider_name": "alibaba",
                "requests": [
                    {
                        "requested_by_user_id": "1",
                        "from_destination": "THR",
                        "to_destination": "MHD",
                        "from_date": "2025-12-15",
                        "to_date": "",
                        "is_foreign_flight": False,
                        "type": "1"
                    }
                ]
            }
        }


class FlightResponse(BaseModel):
    """Unified flight response format matching backend expectations"""
    provider_name: str
    origin: str
    destination: str
    departure_date_time: str
    arrival_date_time: str
    adult_price: int
    airline_name_fa: str
    airline_name_en: str = ""
    flight_number: str
    capacity: int
    rules: str
    is_foreign_flight: bool


class FlightSearchResponse(BaseModel):
    """Response containing list of flights"""
    flights: List[dict]  # Raw flight data from scrapers
    total: int
    provider: str
    scrape_time_seconds: float


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    database_connected: bool
    available_providers: List[str]
    timestamp: str


# ==================== FastAPI App ====================

app = FastAPI(
    title="Zambeel Flight Scraper API",
    description="""
## 🛫 Flight Data Scraper & Aggregator API

A comprehensive REST API for scraping and aggregating flight data from multiple Iranian flight booking providers.

### 📋 Features

* **Multi-Provider Support**: Scrape from 6 major Iranian flight providers
* **Unified Format**: Convert raw provider data to a standardized format
* **Batch Processing**: Handle multiple search requests in a single API call
* **Background Processing**: Automatic database storage without blocking responses
* **Real-time Data**: Live data directly from provider APIs

### 🔌 Available Providers

1. **Alibaba** - alibaba.ir
2. **MrBilit** - mrbilit.ir  
3. **SafarMarket** - safarmarket.com
4. **Safar366** - safar366.com
5. **Pateh** - pateh.com
6. **FlyToday** - flytoday.ir

### 📚 Endpoint Categories

**Raw Data Endpoints**
- `/scrape/flights` - Get raw data from provider(s)
- `/scrape/{provider}` - Get raw data from specific provider

**Unified Format Endpoints**
- `/unified/alibaba` - Get standardized data from Alibaba
- `/unified/mrbilit` - Get standardized data from MrBilit
- `/unified/safarmarket` - Get standardized data from SafarMarket
- `/unified/safar366` - Get standardized data from Safar366
- `/unified/pateh` - Get standardized data from Pateh
- `/unified/flytoday` - Get standardized data from FlyToday

**Utility Endpoints**
- `/` & `/health` - API health check
- `/providers` - List all available providers

### 🚀 Quick Start

```python
import requests

# Search for flights
response = requests.post(
    'http://localhost:5001/unified/alibaba',
    json={
        'requests': [{
            'from_destination': 'THR',
            'to_destination': 'MHD',
            'from_date': '2025-12-15',
            'is_foreign_flight': False
        }]
    }
)

flights = response.json()['flights']
```

### 📖 Documentation

- **Swagger UI**: `/docs` (interactive testing)
- **ReDoc**: `/redoc` (detailed documentation)
    """,
    version="2.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "Zambeel API Support",
        "url": "https://zambeel.com",
    },
    license_info={
        "name": "Proprietary",
    },
    servers=[
        {
            "url": "http://localhost:5001",
            "description": "Development server"
        }
    ]
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Helper Functions ====================

async def crawl_with_thread(crawler, origin, destination, date, is_foreign_flight, flight_list, crawler_name):
    """Execute a crawler and append results to the shared flight list"""
    try:
        start_time = time.time()
        print(f"Crawling {crawler_name} ...")
        
        flights = await crawler.crawl_flights(origin, destination, date, is_foreign_flight)
        
        if flights:
            flight_list.extend(flights)
        
        print(f"{crawler_name} crawled.")
        execution_time = time.time() - start_time
        print(f"{crawler_name} crawler time: {execution_time:.2f} seconds")
        
    except Exception as e:
        print(f"Error in {crawler_name}: {str(e)}")


async def save_flights_to_database(flights: list, provider: str):
    """Save scraped flights to PostgreSQL database in background"""
    if not flight_db:
        print("⚠ Database not connected, skipping save")
        return
    
    try:
        print(f"\n💾 Saving {len(flights)} flights to database from {provider}...")
        start_time = time.time()
        
        stats = flight_db.ingest_unified_flights_batch(flights, provider)
        
        elapsed = time.time() - start_time
        print(f"✓ Database save complete in {elapsed:.2f}s: {stats['success']} success, {stats['failed']} failed")
    except Exception as e:
        print(f"✗ Error saving to database: {e}")


async def scrape_provider(
    provider_name: str,
    origin: str,
    destination: str,
    date: str,
    is_foreign_flight: bool
) -> list:
    """Scrape flights from a single provider"""
    flight_list = []
    
    provider_map = {
        'alibaba': Alibaba(),
        'mrbilit': MrBilit(),
        'safarmarket': SafarMarket(),
        'pateh': Pateh(),
        'flytoday': FlyToday(),
        'safar366': Safar366(),
    }
    
    if provider_name and provider_name.lower() not in provider_map:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {provider_name}")
    
    providers_to_scrape = (
        {provider_name.lower(): provider_map[provider_name.lower()]}
        if provider_name
        else provider_map
    )
    
    tasks = []
    for name, crawler in providers_to_scrape.items():
        task = crawl_with_thread(
            crawler, origin, destination, date,
            is_foreign_flight, flight_list, name
        )
        tasks.append(task)
    
    await asyncio.gather(*tasks)
    
    return flight_list


# ==================== API Endpoints ====================

@app.api_route(
    "/",
    methods=["GET", "HEAD"],
    response_model=HealthResponse,
    summary="API Status Check",
    description="""Check if the API is running and view available providers.
    
    **Use this endpoint to:**
    - Verify API availability
    - Check database connectivity
    - Get list of supported providers
    - Get current server timestamp
    
    **Returns:**
    - `status`: Current API status ("running" or "error")
    - `database_connected`: Whether database is accessible
    - `available_providers`: List of all supported scraper providers
    - `timestamp`: Current server time in ISO 8601 format
    """,
    tags=["Health Check"]
)
async def root():
    """Check API health and status"""
    return {
        "status": "running",
        "database_connected": flight_db is not None,
        "available_providers": ["alibaba", "mrbilit", "safarmarket", "pateh", "flytoday", "safar366"],
        "timestamp": datetime.now().isoformat()
    }


@app.api_route(
    "/health",
    methods=["GET", "HEAD"],
    response_model=HealthResponse,
    summary="Detailed Health Check",
    description="""Comprehensive health check for monitoring and alerting systems.
    
    **Use this endpoint for:**
    - Load balancer health checks
    - Monitoring system integration
    - CI/CD pipeline validation
    - Uptime monitoring
    
    **Response includes:**
    - Overall service status
    - Database connectivity status
    - List of operational providers
    - Server timestamp for latency measurement
    """,
    tags=["Health Check"]
)
async def health_check():
    """Detailed API health status"""
    return {
        "status": "healthy",
        "database_connected": flight_db is not None,
        "available_providers": ["alibaba", "mrbilit", "safarmarket", "pateh", "flytoday", "safar366"],
        "timestamp": datetime.now().isoformat()
    }


@app.post(
    "/scrape/flights",
    response_model=FlightSearchResponse,
    summary="Scrape Flight Data (Raw Format)",
    description="""Scrape flight data from one or multiple providers in their native format.
    
    **Use this endpoint when:**
    - You need raw, unprocessed data from providers
    - You want to compare results from multiple providers
    - You need provider-specific fields
    - You're building your own data transformation layer
    
    **Request Parameters:**
    - `provider_name`: Specific provider ("alibaba", "mrbilit", etc.) or empty for all
    - `requests`: Array of search requests with:
      - `from_destination`: Origin airport code (e.g., "THR", "MHD")
      - `to_destination`: Destination airport code (e.g., "KIH", "IKA")
      - `from_date`: Departure date (YYYY-MM-DD format)
      - `to_date`: Return date (optional, for round-trip)
      - `is_foreign_flight`: true for international flights
    
    **Response:**
    - `flights`: Array of flight objects in provider's native format
    - `total`: Total number of flights found
    - `provider`: Provider name or "all" if multiple
    - `scrape_time_seconds`: Time taken to scrape data
    
    **Note:** Data is automatically saved to database in background.
    
    **Example Request:**
    ```json
    {
      "provider_name": "alibaba",
      "requests": [{
        "from_destination": "THR",
        "to_destination": "MHD",
        "from_date": "2025-12-15",
        "is_foreign_flight": false
      }]
    }
    ```
    """,
    tags=["Raw Data Scraping"],
    responses={
        200: {
            "description": "Successfully scraped flight data",
            "content": {
                "application/json": {
                    "example": {
                        "flights": [
                            {
                                "provider_name": "alibaba",
                                "origin": "THR",
                                "destination": "MHD",
                                "flight_number": "1234",
                                "adult_price": 5000000,
                                "capacity": 10
                            }
                        ],
                        "total": 1,
                        "provider": "alibaba",
                        "scrape_time_seconds": 5.23
                    }
                }
            }
        },
        400: {"description": "Invalid request parameters"},
        500: {"description": "Scraping error or provider unavailable"}
    }
)
async def scrape_flights(
    request: FlightSearchRequest,
    background_tasks: BackgroundTasks
):
    """Scrape flights from provider(s) in raw format"""
    if not request.requests:
        raise HTTPException(status_code=400, detail="At least one flight request is required")
    
    start_time = time.time()
    all_flights = []
    
    for flight_request in request.requests:
        flights = await scrape_provider(
            request.provider_name,
            flight_request.from_destination,
            flight_request.to_destination,
            flight_request.from_date,
            flight_request.is_foreign_flight
        )
        all_flights.extend(flights)
    
    scrape_time = time.time() - start_time
    
    # Save to database in background
    if all_flights:
        background_tasks.add_task(
            save_flights_to_database,
            all_flights,
            request.provider_name or "mixed"
        )
    
    return {
        "flights": all_flights,
        "total": len(all_flights),
        "provider": request.provider_name or "all",
        "scrape_time_seconds": round(scrape_time, 2)
    }


@app.post(
    "/scrape/{provider}",
    summary="Scrape from Specific Provider (Raw Format)",
    description="""Convenient endpoint for scraping from a single known provider.
    
    **Use this endpoint when:**
    - You want to scrape from only one specific provider
    - You prefer path parameters over request body for provider selection
    - You're building provider-specific integrations
    
    **Path Parameters:**
    - `provider`: Provider name ("alibaba", "mrbilit", "safarmarket", "safar366", "pateh", "flytoday")
    
    **Request Body:**
    Same as `/scrape/flights` but `provider_name` field is ignored (taken from path)
    
    **Example:**
    ```bash
    POST /scrape/alibaba
    {
      "requests": [{
        "from_destination": "THR",
        "to_destination": "KIH",
        "from_date": "2025-12-20",
        "is_foreign_flight": false
      }]
    }
    ```
    """,
    tags=["Raw Data Scraping"],
    responses={
        200: {"description": "Successfully scraped flight data"},
        400: {"description": "Invalid provider name or request parameters"},
        500: {"description": "Provider error or unavailable"}
    }
)
async def scrape_specific_provider(
    provider: str,
    request: FlightSearchRequest,
    background_tasks: BackgroundTasks
):
    """Scrape flights from a specific provider in raw format"""
    request.provider_name = provider
    return await scrape_flights(request, background_tasks)


@app.get(
    "/providers",
    summary="List Available Providers",
    description="""Get information about all supported flight data providers.
    
    **Use this endpoint to:**
    - Discover available scraper providers
    - Check which providers support unified format
    - Get endpoint URLs for each provider
    - Build dynamic provider selection UI
    
    **Response for each provider:**
    - `name`: Provider identifier (used in API calls)
    - `display_name`: Human-readable provider name
    - `supported`: Whether provider is currently operational
    - `unified_converter`: Whether unified format is available
    - `unified_endpoint`: API endpoint for unified format data
    
    **Example Response:**
    ```json
    {
      "providers": [
        {
          "name": "alibaba",
          "display_name": "Alibaba",
          "supported": true,
          "unified_converter": true,
          "unified_endpoint": "/unified/alibaba"
        }
      ]
    }
    ```
    """,
    tags=["Provider Information"]
)
async def list_providers():
    """List all available flight providers with their capabilities"""
    return {
        "providers": [
            {
                "name": "alibaba",
                "display_name": "Alibaba",
                "supported": True,
                "unified_converter": True,
                "unified_endpoint": "/unified/alibaba"
            },
            {
                "name": "mrbilit",
                "display_name": "MrBilit",
                "supported": True,
                "unified_converter": True,
                "unified_endpoint": "/unified/mrbilit"
            },
            {
                "name": "safarmarket",
                "display_name": "SafarMarket",
                "supported": True,
                "unified_converter": True,
                "unified_endpoint": "/unified/safarmarket"
            },
            {
                "name": "pateh",
                "display_name": "Pateh",
                "supported": True,
                "unified_converter": True,
                "unified_endpoint": "/unified/pateh"
            },
            {
                "name": "flytoday",
                "display_name": "FlyToday",
                "supported": True,
                "unified_converter": True,
                "unified_endpoint": "/unified/flytoday"
            },
            {
                "name": "safar366",
                "display_name": "Safar366",
                "supported": True,
                "unified_converter": True,
                "unified_endpoint": "/unified/safar366"
            }
        ]
    }


# ==================== Unified Format Endpoints ====================

def filter_valid_flights(flights: list) -> list:
    """
    Filter out flights with invalid price or capacity.
    Removes flights where price <= 0 or capacity <= 0.
    """
    valid_flights = []
    filtered_count = 0
    
    for flight in flights:
        # Check price
        price = 0
        if isinstance(flight, dict):
            pricing = flight.get("pricing", {})
            if isinstance(pricing, dict):
                adult = pricing.get("adult", {})
                if isinstance(adult, dict):
                    price = adult.get("total_fare", 0)
        
        # Check capacity
        capacity = 0
        if isinstance(flight, dict):
            ticket_info = flight.get("ticket_info", {})
            if isinstance(ticket_info, dict):
                capacity = ticket_info.get("capacity", 0)
        
        # Filter invalid flights
        if price <= 0 or capacity <= 0:
            filtered_count += 1
            continue
        
        valid_flights.append(flight)
    
    if filtered_count > 0:
        print(f"🔍 Filtered out {filtered_count} invalid flights (price=0 or capacity=0)")
    
    return valid_flights


def convert_backend_to_unified(backend_flight: dict) -> dict:
    """
    Convert backend-ready format (from scrapers) to unified format
    This handles the already-transformed output from our scrapers
    """
    # Extract departure time and date for ID generation
    departure_datetime = backend_flight.get("departure_date_time", "")
    departure_date = departure_datetime.split("T")[0] if "T" in departure_datetime else departure_datetime.split(" ")[0] if " " in departure_datetime else ""
    departure_time = departure_datetime.split("T")[1][:5] if "T" in departure_datetime else departure_datetime.split(" ")[1][:5] if " " in departure_datetime and len(departure_datetime.split(" ")) > 1 else "0000"
    
    # Clean flight number
    flight_number = backend_flight.get("flight_number", "")
    airline_code = backend_flight.get("airline_code", "")
    
    # Fallback: If airline_code is missing, try to extract from flight_number
    if not airline_code and flight_number:
        # Match 2-3 alphanumeric chars (at least one letter) followed by digits
        # e.g. "I35753" -> "I3", "5753"
        match = re.match(r'^([A-Z0-9]*[A-Z][A-Z0-9]*)(\d+)$', str(flight_number).upper())
        if match:
            code = match.group(1)
            if 2 <= len(code) <= 3:
                airline_code = code
    
    clean_flight_num = FlightIDGenerator.clean_flight_number(flight_number, airline_code)
    
    # Generate base_flight_id for cross-scraper matching
    base_flight_id = FlightIDGenerator.generate_base_id(
        origin=backend_flight.get("origin", ""),
        destination=backend_flight.get("destination", ""),
        departure_date=departure_date,
        airline_code=airline_code,
        flight_number=clean_flight_num,
        departure_time=departure_time
    )
    
    return {
        "base_flight_id": base_flight_id,
        "flight_id": backend_flight.get("unique_key", ""),
        "provider_source": backend_flight.get("provider_name", ""),
        "original_id": backend_flight.get("unique_key", ""),
        
        "flight_number": backend_flight.get("flight_number", ""),
        "airline": {
            "code": backend_flight.get("airline_code", ""),
            "name_en": backend_flight.get("airline_name_en", ""),
            "name_fa": backend_flight.get("airline_name_fa", ""),
            "logo_url": backend_flight.get("airline_logo")
        },
        "operating_airline": {
            "code": None,
            "name_en": None,
            "name_fa": None
        },
        "aircraft": {
            "type": backend_flight.get("aircraft_type", ""),
            "code": None
        },
        
        "route": {
            "origin": {
                "airport_code": backend_flight.get("origin", ""),
                "airport_name_en": None,
                "airport_name_fa": None,
                "city_code": backend_flight.get("origin", ""),
                "city_name_en": None,
                "city_name_fa": None,
                "terminal": backend_flight.get("departure_terminal")
            },
            "destination": {
                "airport_code": backend_flight.get("destination", ""),
                "airport_name_en": None,
                "airport_name_fa": None,
                "city_code": backend_flight.get("destination", ""),
                "city_name_en": None,
                "city_name_fa": None,
                "terminal": backend_flight.get("arrival_terminal")
            }
        },
        
        "schedule": {
            "departure_datetime": backend_flight.get("departure_date_time", ""),
            "arrival_datetime": backend_flight.get("arrival_date_time", ""),
            "departure_date_jalali": None,
            "arrival_date_jalali": None,
            "duration_minutes": 0,
            "stops": 0,
            "connection_time_minutes": None
        },
        
        "pricing": {
            "adult": {
                "base_fare": backend_flight.get("adult_price", 0),
                "total_fare": backend_flight.get("adult_price", 0),
                "taxes": None,
                "service_charge": None,
                "commission": None
            },
            "child": {
                "base_fare": backend_flight.get("child_price", 0),
                "total_fare": backend_flight.get("child_price", 0),
                "taxes": None,
                "service_charge": None,
                "commission": None
            },
            "infant": {
                "base_fare": backend_flight.get("infant_price", 0),
                "total_fare": backend_flight.get("infant_price", 0),
                "taxes": None,
                "service_charge": None,
                "commission": None
            },
            "currency": "IRR"
        },
        
        "cabin": {
            "class": backend_flight.get("cabin_class_code", "Y"),
            "class_display_name_fa": backend_flight.get("cabin_class", "اکونومی"),
            "booking_class": backend_flight.get("cabin_class_code")
        },
        
        "ticket_info": {
            "type": "charter" if backend_flight.get("is_charter") else "system",
            "is_charter": backend_flight.get("is_charter", False),
            "is_refundable": backend_flight.get("is_refundable", True),
            "is_domestic": not backend_flight.get("is_foreign_flight", False),
            "capacity": backend_flight.get("capacity", 0),
            "reservable": backend_flight.get("capacity", 0) > 0,
            "requires_passport": backend_flight.get("is_foreign_flight", False)
        },
        
        "baggage": {
            "checked": {
                "adult_kg": None,
                "child_kg": None,
                "infant_kg": None,
                "pieces": None
            },
            "cabin": {
                "kg": None,
                "pieces": None
            }
        },
        
        "policies": {
            "cancellation_rules": backend_flight.get("cancellation_rules", {}),
            "fare_rules": backend_flight.get("rules"),
            "terms": None
        },
        
        "additional_info": {
            "promoted": backend_flight.get("is_promoted", False),
            "discount_percent": backend_flight.get("discount_percent", 0),
            "special_offers": [],
            "tags": [],
            "rating": None
        },
        
        "providers": [],
        
        "metadata": {
            "scraped_at": datetime.now().isoformat(),
            "original_id": backend_flight.get("unique_key", ""),
            "proposal_id": backend_flight.get("proposal_id"),
            "search_id": None
        }
    }


@app.post(
    "/unified/alibaba",
    summary="Alibaba Flights (Unified Format)",
    description="""Scrape flight data from Alibaba in standardized unified format.
    
    **Why use unified format?**
    - Consistent field names across all providers
    - Predictable data structure
    - Easy to integrate with frontend
    - No provider-specific parsing needed
    
    **Request:**
    ```json
    {
      "requests": [{
        "from_destination": "THR",
        "to_destination": "MHD",
        "from_date": "2025-12-15",
        "to_date": null,
        "is_foreign_flight": false
      }]
    }
    ```
    
    **Response includes:**
    - `flights`: Array of flights in unified format
    - `total`: Number of flights found
    - `provider`: "alibaba"
    - `format`: "unified"
    - `scrape_time_seconds`: Scraping duration
    
    **Unified flight structure (17 top-level keys):**
    - `flight_id`, `provider_source`, `original_id`
    - `flight_number`, `airline`, `operating_airline`, `aircraft`
    - `route` (origin/destination with airport details)
    - `schedule` (departure/arrival times)
    - `pricing` (adult/child/infant prices)
    - `availability` (seats, cabin class, refundability)
    - `baggage` (checked and cabin allowances)
    - `policies` (cancellation, fare rules)
    - `additional_info` (promotions, discounts)
    - `providers`, `metadata`
    """,
    tags=["Unified Format Endpoints"],
    responses={
        200: {
            "description": "Successfully scraped and converted to unified format - returns array of flight objects",
            "content": {
                "application/json": {
                    "example": [
                        {
                            "flight_id": "THRMHD20251215IR1234",
                            "provider_source": "alibaba",
                            "original_id": "ALB_12345",
                            "flight_number": "1234",
                            "airline": {
                                "code": "IR",
                                "name_en": "Iran Air",
                                "name_fa": "هواپیمایی ایران",
                                "logo_url": "https://example.com/ir_logo.png"
                            },
                            "operating_airline": {
                                "code": None,
                                "name_en": None,
                                "name_fa": None
                            },
                            "aircraft": {
                                "type": "Airbus A320",
                                "code": "320"
                            },
                            "route": {
                                "origin": {
                                    "airport_code": "THR",
                                    "airport_name_en": "Tehran Mehrabad",
                                    "airport_name_fa": "تهران مهرآباد",
                                    "city_code": "THR",
                                    "city_name_en": "Tehran",
                                    "city_name_fa": "تهران",
                                    "terminal": "Terminal 2"
                                },
                                "destination": {
                                    "airport_code": "MHD",
                                    "airport_name_en": "Mashhad",
                                    "airport_name_fa": "مشهد",
                                    "city_code": "MHD",
                                    "city_name_en": "Mashhad",
                                    "city_name_fa": "مشهد",
                                    "terminal": "Main Terminal"
                                }
                            },
                            "schedule": {
                                "departure_datetime": "2025-12-15T14:30:00",
                                "arrival_datetime": "2025-12-15T16:00:00",
                                "departure_date_jalali": "1404/09/24",
                                "arrival_date_jalali": "1404/09/24",
                                "duration_minutes": 90,
                                "stops": 0,
                                "connection_time_minutes": None
                            },
                            "pricing": {
                                "adult": {
                                    "base_fare": 5000000,
                                    "total_fare": 5500000,
                                    "taxes": 500000,
                                    "service_charge": None,
                                    "commission": None
                                },
                                "child": {
                                    "base_fare": 4000000,
                                    "total_fare": 4400000,
                                    "taxes": 400000,
                                    "service_charge": None,
                                    "commission": None
                                },
                                "infant": {
                                    "base_fare": 500000,
                                    "total_fare": 550000,
                                    "taxes": 50000,
                                    "service_charge": None,
                                    "commission": None
                                },
                                "currency": "IRR"
                            },
                            "cabin": {
                                "class": "Y",
                                "class_display_name_fa": "اکونومی",
                                "booking_class": "Y"
                            },
                            "ticket_info": {
                                "type": "system",
                                "is_charter": False,
                                "is_refundable": True,
                                "is_domestic": True,
                                "capacity": 10,
                                "reservable": True,
                                "requires_passport": False
                            },
                            "baggage": {
                                "checked": {
                                    "adult_kg": 20,
                                    "child_kg": 20,
                                    "infant_kg": 10,
                                    "pieces": None
                                },
                                "cabin": {
                                    "kg": 7,
                                    "pieces": 1
                                }
                            },
                            "policies": {
                                "cancellation_rules": {
                                    "24h_before": "50%",
                                    "48h_before": "30%"
                                },
                                "fare_rules": {
                                    "refundable": True,
                                    "changeable": True
                                },
                                "terms": "Standard terms apply"
                            },
                            "additional_info": {
                                "promoted": False,
                                "discount_percent": 0,
                                "special_offers": [],
                                "tags": ["Popular"],
                                "rating": 4.5
                            },
                            "providers": [],
                            "metadata": {
                                "scraped_at": "2025-12-12T14:23:53.516820",
                                "original_id": "ALB_12345",
                                "proposal_id": "ALB_PROP_12345",
                                "search_id": None
                            }
                        }
                    ]
                }
            }
        },
        400: {"description": "Invalid request parameters"},
        500: {"description": "Scraping error"}
    }
)
async def scrape_alibaba_unified(request: FlightSearchRequest):
    """Scrape Alibaba flights in unified format"""
    if not request.requests:
        raise HTTPException(status_code=400, detail="At least one flight request is required")
    
    start_time = time.time()
    all_unified_flights = []
    
    scraper = Alibaba()
    
    for flight_request in request.requests:
        try:
            transformed_flights = await scraper.crawl_flights(
                flight_request.from_destination,
                flight_request.to_destination,
                flight_request.from_date,
                flight_request.is_foreign_flight
            )
            
            print(f"📊 Alibaba returned {len(transformed_flights)} flights")
            
            # Convert each transformed flight to unified format
            for flight in transformed_flights:
                try:
                    unified = convert_backend_to_unified(flight)
                    all_unified_flights.append(unified)
                except Exception as e:
                    print(f"❌ Error converting Alibaba flight: {e}")
                    print(f"   Flight data keys: {list(flight.keys()) if isinstance(flight, dict) else type(flight)}")
                    continue
        except Exception as e:
            print(f"❌ Error scraping Alibaba: {e}")
            continue
    
    scrape_time = time.time() - start_time
    print(f"✓ Alibaba unified: {len(all_unified_flights)} flights in {round(scrape_time, 2)}s")
    
    # Filter out invalid flights before returning
    valid_flights = filter_valid_flights(all_unified_flights)
    print(f"✓ Returning {len(valid_flights)} valid Alibaba flights")
    
    return valid_flights


@app.post(
    "/unified/mrbilit",
    summary="MrBilit Flights (Unified Format)",
    description="""Scrape flight data from MrBilit in standardized unified format.
    
    MrBilit is a popular Iranian flight booking platform. This endpoint provides
    their flight data in a consistent format that matches all other providers.
    
    **Request & Response:**
    Same structure as `/unified/alibaba` - see that endpoint for detailed documentation.
    
    **Provider-specific notes:**
    - MrBilit typically has competitive pricing
    - Good coverage of domestic Iranian flights
    - Reliable availability data
    """,
    tags=["Unified Format Endpoints"]
)
async def scrape_mrbilit_unified(request: FlightSearchRequest):
    """Scrape MrBilit flights in unified format"""
    if not request.requests:
        raise HTTPException(status_code=400, detail="At least one flight request is required")
    
    start_time = time.time()
    all_unified_flights = []
    
    scraper = MrBilit()
    
    for flight_request in request.requests:
        transformed_flights = await scraper.crawl_flights(
            flight_request.from_destination,
            flight_request.to_destination,
            flight_request.from_date,
            flight_request.is_foreign_flight
        )
        
        # Convert each transformed flight to unified format
        for flight in transformed_flights:
            try:
                unified = convert_backend_to_unified(flight)
                all_unified_flights.append(unified)
            except Exception as e:
                print(f"Error converting MrBilit flight: {e}")
                continue
    
    scrape_time = time.time() - start_time
    print(f"✓ MrBilit unified: {len(all_unified_flights)} flights in {round(scrape_time, 2)}s")
    
    # Filter out invalid flights before returning
    valid_flights = filter_valid_flights(all_unified_flights)
    print(f"✓ Returning {len(valid_flights)} valid MrBilit flights")
    
    return valid_flights


@app.post(
    "/unified/safarmarket",
    summary="SafarMarket Flights (Unified Format)",
    description="""Scrape flight data from SafarMarket in standardized unified format.
    
    SafarMarket is another major Iranian flight booking service. All data is
    returned in the same unified structure as other providers.
    
    **Request & Response:**
    Same structure as `/unified/alibaba` - see that endpoint for detailed documentation.
    
    **Provider-specific notes:**
    - Good for comparing prices across providers
    - Strong coverage of domestic routes
    """,
    tags=["Unified Format Endpoints"]
)
async def scrape_safarmarket_unified(request: FlightSearchRequest):
    """Scrape SafarMarket flights in unified format"""
    if not request.requests:
        raise HTTPException(status_code=400, detail="At least one flight request is required")
    
    start_time = time.time()
    all_unified_flights = []
    
    scraper = SafarMarket()
    
    for flight_request in request.requests:
        try:
            transformed_flights = await scraper.crawl_flights(
                flight_request.from_destination,
                flight_request.to_destination,
                flight_request.from_date,
                flight_request.is_foreign_flight
            )
            
            # Convert each transformed flight to unified format
            for flight in transformed_flights:
                try:
                    unified = convert_backend_to_unified(flight)
                    all_unified_flights.append(unified)
                except Exception as e:
                    print(f"Error converting SafarMarket flight: {e}")
                    continue
        except Exception as e:
            print(f"❌ Error scraping SafarMarket: {e}")
            continue
    
    scrape_time = time.time() - start_time
    print(f"✓ SafarMarket unified: {len(all_unified_flights)} flights in {round(scrape_time, 2)}s")
    
    # Filter out invalid flights before returning
    valid_flights = filter_valid_flights(all_unified_flights)
    print(f"✓ Returning {len(valid_flights)} valid SafarMarket flights")
    
    return valid_flights


@app.post(
    "/unified/safar366",
    summary="Safar366 Flights (Unified Format)",
    description="""Scrape flight data from Safar366 in standardized unified format.
    
    Safar366 is a flight booking service in Iran. All data is returned
    in the same unified structure as other providers.
    
    **Request & Response:**
    Same structure as `/unified/alibaba` - see that endpoint for detailed documentation.
    """,
    tags=["Unified Format Endpoints"]
)
async def scrape_safar366_unified(request: FlightSearchRequest):
    """Scrape Safar366 flights in unified format"""
    if not request.requests:
        raise HTTPException(status_code=400, detail="At least one flight request is required")
    
    start_time = time.time()
    all_unified_flights = []
    
    scraper = Safar366()
    
    for flight_request in request.requests:
        transformed_flights = await scraper.crawl_flights(
            flight_request.from_destination,
            flight_request.to_destination,
            flight_request.from_date,
            flight_request.is_foreign_flight
        )
        
        # Convert each transformed flight to unified format
        for flight in transformed_flights:
            try:
                unified = convert_backend_to_unified(flight)
                all_unified_flights.append(unified)
            except Exception as e:
                print(f"Error converting Safar366 flight: {e}")
                continue
    
    scrape_time = time.time() - start_time
    print(f"✓ Safar366 unified: {len(all_unified_flights)} flights in {round(scrape_time, 2)}s")
    
    # Filter out invalid flights before returning
    valid_flights = filter_valid_flights(all_unified_flights)
    print(f"✓ Returning {len(valid_flights)} valid Safar366 flights")
    
    return valid_flights


@app.post(
    "/unified/pateh",
    summary="Pateh Flights (Unified Format)",
    description="""Scrape flight data from Pateh in standardized unified format.
    
    Pateh provides flight booking services in Iran. Data is returned in
    the same unified structure as all other providers.
    
    **Request & Response:**
    Same structure as `/unified/alibaba` - see that endpoint for detailed documentation.
    """,
    tags=["Unified Format Endpoints"]
)
async def scrape_pateh_unified(request: FlightSearchRequest):
    """Scrape Pateh flights in unified format"""
    if not request.requests:
        raise HTTPException(status_code=400, detail="At least one flight request is required")
    
    start_time = time.time()
    all_unified_flights = []
    
    scraper = Pateh()
    
    for flight_request in request.requests:
        transformed_flights = await scraper.crawl_flights(
            flight_request.from_destination,
            flight_request.to_destination,
            flight_request.from_date,
            flight_request.is_foreign_flight
        )
        
        # Convert each transformed flight to unified format
        for flight in transformed_flights:
            try:
                unified = convert_backend_to_unified(flight)
                all_unified_flights.append(unified)
            except Exception as e:
                print(f"Error converting Pateh flight: {e}")
                continue
    
    scrape_time = time.time() - start_time
    print(f"✓ Pateh unified: {len(all_unified_flights)} flights in {round(scrape_time, 2)}s")
    
    # Filter out invalid flights before returning
    valid_flights = filter_valid_flights(all_unified_flights)
    print(f"✓ Returning {len(valid_flights)} valid Pateh flights")
    
    return valid_flights


@app.post(
    "/unified/flytoday",
    summary="FlyToday Flights (Unified Format)",
    description="""Scrape flight data from FlyToday in standardized unified format.
    
    FlyToday is a flight booking platform in Iran. All data is returned
    in the same unified structure as other providers.
    
    **Request & Response:**
    Same structure as `/unified/alibaba` - see that endpoint for detailed documentation.
    """,
    tags=["Unified Format Endpoints"]
)
async def scrape_flytoday_unified(request: FlightSearchRequest):
    """Scrape FlyToday flights in unified format"""
    if not request.requests:
        raise HTTPException(status_code=400, detail="At least one flight request is required")
    
    start_time = time.time()
    all_unified_flights = []
    
    scraper = FlyToday()
    
    for flight_request in request.requests:
        transformed_flights = await scraper.crawl_flights(
            flight_request.from_destination,
            flight_request.to_destination,
            flight_request.from_date,
            flight_request.is_foreign_flight
        )
        
        # Convert each transformed flight to unified format
        for flight in transformed_flights:
            try:
                unified = convert_backend_to_unified(flight)
                all_unified_flights.append(unified)
            except Exception as e:
                print(f"Error converting FlyToday flight: {e}")
                continue
    
    scrape_time = time.time() - start_time
    print(f"✓ FlyToday unified: {len(all_unified_flights)} flights in {round(scrape_time, 2)}s")
    
    # Filter out invalid flights before returning
    valid_flights = filter_valid_flights(all_unified_flights)
    print(f"✓ Returning {len(valid_flights)} valid FlyToday flights")
    
    return valid_flights


# ==================== Startup/Shutdown ====================

@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("\n" + "="*50)
    print("🚀 Zambeel Flight Scraper API Starting")
    print("="*50)
    print(f"📡 Database: {'✓ Connected' if flight_db else '✗ Not connected'}")
    print(f"🌐 API Docs: http://localhost:5001/docs")
    print(f"📚 ReDoc: http://localhost:5001/redoc")
    print("="*50 + "\n")


@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    if flight_db:
        flight_db.close()
        print("✓ Database connection closed")


# ==================== Run Server ====================

if __name__ == "__main__":
    uvicorn.run(
        "fastapi_main:app",
        host="0.0.0.0",
        port=5002,
        reload=False,  # Set to True for development
        log_level="info"
    )
