import asyncio
from grpc import aio
import time
import threading
from concurrent import futures
from google.protobuf.json_format import MessageToDict,ParseDict
import json
import os
import sys
import scraper_pb2
import scraper_pb2_grpc
from pateh import Pateh
from mrbilit import MrBilit
from alibaba import Alibaba
from flytoday import FlyToday
from safarmarket import SafarMarket
from safar366 import Safar366

# Add database directory to path
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

async def crawl_with_thread(crawler, origin, destination, date, is_foreign_flight, flight_list, crawler_name):
    """
    Execute a crawler in a separate thread and append its results to the shared flight list.

    This function is designed to be run in a separate thread for each crawler. It handles the execution
    of a single crawler, including timing its execution and error handling. The results are appended
    to a shared flight list that can be accessed by other threads.

    Args:
        crawler: An instance of a crawler class (Alibaba, MrBilit, SafarMarket, Pateh, or FlyToday)
        origin (str): The departure city/code
        destination (str): The arrival city/code
        date (str): The flight date
        is_foreign_flight (bool): Flag indicating if this is a foreign flight
        flight_list (list): Shared list to store the crawling results
        crawler_name (str): Name of the crawler for logging purposes

    Note:
        This function is thread-safe as it only appends to the shared flight_list using extend()
        and doesn't modify any other shared state.
    """
    try:
        crawler_start_time = time.time()
        result = await crawler.crawl_flights(origin, destination, date, is_foreign_flight)
        crawler_end_time = time.time()
        print(f"{crawler_name} crawler time: {crawler_end_time - crawler_start_time:.2f} seconds")
        flight_list.extend(result)
    except Exception as e:
        print(f"Error during crawling {crawler_name}:", e)

async def crawl_domestic(flight_requests: dict) -> list:
    """
    Create a new object for each crawler, then call the crawl_flights function on each one using threads.
    Finally, concatenate the results from all crawlers. These crawlers will crawl domestic flights.

    Args:
        flight_requests (dict): A dictionary containing flight request parameters.

    Returns:
        dict: A dictionary containing a list of domestic flights.
    """
    start_time = time.time()
    print("crawling for domestic flights ...")
    flight_list = list()
    choose_provider_name = flight_requests.get("provider_name")
    print(f"---------\nchoose_provider_name: {choose_provider_name}\n---------")
    for request in flight_requests.get("requests", []):
        out = json.dumps(request)
        print(f"---------\nrequest: {out}\n---------")
        origin = request.get("from_destination")
        destination = request.get("to_destination")
        date = request.get("from_date")
        user_id = request.get("requested_by_user_id")
        is_foreign_flight = request.get("is_foreign_flight", False)

        # Create crawler instances
        alibaba_crawler = Alibaba()
        mrbilit_crawler = MrBilit()
        safarmarket_crawler = SafarMarket()
        pateh_crawler = Pateh()
        flytoday_crawler = FlyToday()
        safar366_crawler = Safar366()
        
        providers = {
            alibaba_crawler.provider_name: alibaba_crawler,
            mrbilit_crawler.provider_name: mrbilit_crawler,
            safarmarket_crawler.provider_name: safarmarket_crawler,
            pateh_crawler.provider_name: pateh_crawler,
            flytoday_crawler.provider_name: flytoday_crawler,
            safar366_crawler.provider_name: safar366_crawler
        }
        
        threads = []
        
        print(f"---------\nproviders: {providers}\n---------")
        for provider_name, provider_crawler in providers.items():
            if not choose_provider_name or provider_name == choose_provider_name:
                await crawl_with_thread(provider_crawler, origin, destination, date, is_foreign_flight, flight_list, f"{provider_name} domestic")
                # threads.append(threading.Thread(target=crawl_with_thread, args=(provider_crawler, origin, destination, date, is_foreign_flight, flight_list, f"{provider_name} domestic")))

        # Create threads for each crawler
        # threads = [
        #     threading.Thread(target=crawl_with_thread, args=(alibaba_crawler, origin, destination, date, is_foreign_flight, flight_list, "Alibaba domestic")),
        #     threading.Thread(target=crawl_with_thread, args=(mrbilit_crawler, origin, destination, date, is_foreign_flight, flight_list, "Mrbilit domestic")),
        #     threading.Thread(target=crawl_with_thread, args=(safarmarket_crawler, origin, destination, date, is_foreign_flight, flight_list, "Safarmarket domestic")),
        #     threading.Thread(target=crawl_with_thread, args=(pateh_crawler, origin, destination, date, is_foreign_flight, flight_list, "Pateh domestic")),
        #     threading.Thread(target=crawl_with_thread, args=(flytoday_crawler, origin, destination, date, is_foreign_flight, flight_list, "Flytoday domestic"))
        # ]

        # index = 1
        # Start all threads
        # for thread in threads:
        #     print(f"thread index: {index}")
        #     index += 1
        #     thread.start()

        # Wait for all threads to complete
        # for thread in threads:
        #     thread.join()

    end_time = time.time()
    execution_time = end_time - start_time
    print(f"domestic flights crawled. Total time taken: {execution_time:.2f} seconds")
    return flight_list

async def crawl_foreign(flight_requests: dict) -> list:
    """
    Create a new object for each crawler, then call the crawl_flights function on each one using threads.
    Finally, concatenate the results from all crawlers. These crawlers will crawl foreign flights.

    Args:
        flight_requests (dict): A dictionary containing flight request parameters.

    Returns:
        dict: A dictionary containing a list of foreign flights.
    """
    start_time = time.time()
    print("crawling foreign flights ...")
    flight_list = list()
    
    choose_provider_name = flight_requests.get("provider_name")

    for request in flight_requests.get("requests", []):
        origin = request.get("from_destination")
        destination = request.get("to_destination")
        date = request.get("from_date")
        user_id = request.get("requested_by_user_id")
        is_foreign_flight = request.get("is_foreign_flight", False)
        # Create crawler instances
        alibaba_crawler = Alibaba()
        mrbilit_crawler = MrBilit()
        safarmarket_crawler = SafarMarket()
        pateh_crawler = Pateh()
        flytoday_crawler = FlyToday()
        safar366_crawler = Safar366()
        
        providers = {
            alibaba_crawler.provider_name: alibaba_crawler,
            mrbilit_crawler.provider_name: mrbilit_crawler,
            safarmarket_crawler.provider_name: safarmarket_crawler,
            pateh_crawler.provider_name: pateh_crawler,
            flytoday_crawler.provider_name: flytoday_crawler,
            safar366_crawler.provider_name: safar366_crawler
        }
        
        threads = []
        
        for provider_name, provider_crawler in providers.items():
            if provider_name == choose_provider_name:
                await crawl_with_thread(provider_crawler, origin, destination, date, is_foreign_flight, flight_list, f"{provider_name} foreign")
                # threads.append(threading.Thread(target=crawl_with_thread, args=(provider_crawler, origin, destination, date, is_foreign_flight, flight_list, f"{provider_name} foreign")))

        # Create threads for each crawler
        # threads = [
        #     threading.Thread(target=crawl_with_thread, args=(alibaba_crawler, origin, destination, date, is_foreign_flight, flight_list, "Alibaba foreign")),
        #     threading.Thread(target=crawl_with_thread, args=(mrbilit_crawler, origin, destination, date, is_foreign_flight, flight_list, "Mrbilit foreign")),
        #     threading.Thread(target=crawl_with_thread, args=(safarmarket_crawler, origin, destination, date, is_foreign_flight, flight_list, "Safarmarket foreign")),
        #     threading.Thread(target=crawl_with_thread, args=(pateh_crawler, origin, destination, date, is_foreign_flight, flight_list, "Pateh foreign")),
        #     threading.Thread(target=crawl_with_thread, args=(flytoday_crawler, origin, destination, date, is_foreign_flight, flight_list, "Flytoday foreign"))
        # ]

        # Start all threads
        # for thread in threads:
        #     thread.start()

        # Wait for all threads to complete
        # for thread in threads:
        #     thread.join()

    end_time = time.time()
    execution_time = end_time - start_time
    print(f"foreign flights crawled. Total time taken: {execution_time:.2f} seconds")
    return flight_list

def transform_flight_to_proto_format(flight: dict, provider_name: str) -> dict:
    """
    Transform a raw flight dict from scrapers to match the protobuf FlightProcessed format.
    Only includes the 12 fields defined in scraper.proto.
    """
    return {
        "provider_name": provider_name,
        "origin": flight.get("origin", ""),
        "destination": flight.get("destination", ""),
        "departure_date_time": flight.get("leaveDateTime", ""),
        "arrival_date_time": flight.get("arrivalDateTime", ""),
        "adult_price": int(flight.get("priceAdult", 0)),
        "airline_name_fa": flight.get("airlineName", ""),
        "airline_name_en": flight.get("airline_name_en", ""),
        "flight_number": flight.get("flightNumber", ""),
        "capacity": int(flight.get("seat", 0)),
        "rules": str(flight.get("crcn", "")),
        "is_foreign_flight": flight.get("is_foreign_flight", False),
    }

def concatenate_flight_jsons(domestic_flights: list, foreign_flights: list, provider_name: str = "") -> dict:
    """
    Concatenate two lists of domestic and foreign flights, and return them as a dictionary (JSON-like structure).
    Transforms each flight to match the protobuf FlightProcessed format.

    Args:
        domestic_flights (list[dict]): List of domestic flight data.
        foreign_flights (list[dict]): List of foreign flight data.
        provider_name (str): Name of the provider (alibaba, mrbilit, etc.)

    Returns:
        dict: A dictionary with a single key "flights" containing the combined list of transformed flights.
    """
    all_flights = domestic_flights + foreign_flights
    
    # Transform each flight to proto format
    transformed_flights = [
        transform_flight_to_proto_format(flight, provider_name)
        for flight in all_flights
    ]
    
    combined = {"flights": transformed_flights}
    return combined


async def save_flights_to_database(flights: list, provider: str):
    """
    Save scraped flights to PostgreSQL database asynchronously.
    This runs in the background and doesn't block the response.
    
    Args:
        flights: List of unified flight dictionaries
        provider: Provider name (alibaba, mrbilit, etc.)
    """
    if not flight_db:
        print("⚠ Database not connected, skipping save")
        return
    
    try:
        print(f"\n💾 Saving {len(flights)} flights to database from {provider}...")
        start_time = time.time()
        
        # Save to database using batch ingestion
        stats = flight_db.ingest_unified_flights_batch(flights, provider)
        
        elapsed = time.time() - start_time
        print(f"✓ Database save complete in {elapsed:.2f}s: {stats['success']} success, {stats['failed']} failed")
    except Exception as e:
        print(f"✗ Error saving to database: {e}")
        # Don't raise - we don't want to fail the scraping request if DB save fails


async def take_requests(flight_requests, context):
    
    # json_string = json.dumps(flight_requests)

    print(f"---------------- \n{flight_requests} ----------------")
    flight_requests = check_back_and_forth_flight(flight_requests)
    internal_flights, foreign_flights = check_internal_foreign_flights(flight_requests)
    internal_flights_res = await crawl_domestic(internal_flights)
    foreign_flights_res = await crawl_foreign(foreign_flights)
    
    # Get provider name from request
    requests_dict = MessageToDict(flight_requests, preserving_proto_field_name=True)
    provider = requests_dict.get("provider_name", "")
    
    # Transform flights to proto format
    flight_response = concatenate_flight_jsons(internal_flights_res, foreign_flights_res, provider)
    
    # Save to database in background (don't block response)
    # Note: We save the RAW flight data (with all fields) to database, not proto format
    if internal_flights_res or foreign_flights_res:
        raw_flights = internal_flights_res + foreign_flights_res
        asyncio.create_task(save_flights_to_database(
            raw_flights,
            provider or "mixed"
        ))
    
    return flight_response



class ScraperService(scraper_pb2_grpc.ScraperServiceServicer):
    async def TakeRequests(self, request, context):
        items = await take_requests(request, context)
        message = ParseDict(items, scraper_pb2.FlightProcessedByUserReqeust())
        return message


def check_back_and_forth_flight(flight_requests: dict) -> dict:
    """
    Processes flight requests, splitting any round-trip (back-and-forth) request into two one-way flights.

    Args:
        flight_requests (dict): A dictionary with a "requests" key containing a list of flight request dicts.
                     Each request dict must have the keys:
                       - requested_by_user_id: str
                       - type: str
                       - from_destination: str
                       - from_date: str
                       - to_destination: str
                       - to_date: str  (empty if one-way)

    Returns:
        dict: A new dict with "requests" key holding the transformed list of one-way flights.
    """
    new_requests = []
    
    # requests = flight_requests.__dict__
    requests = MessageToDict(flight_requests, preserving_proto_field_name=True)
    provider_name = requests.get("provider_name", "alibaba")

    for req in requests.get("requests", []):
        new_requests.append(req)
        
        return_date = req.get("to_date", "")

        if return_date:
            return_req = {
                "requested_by_user_id": req.get("requested_by_user_id", ""),
                "type": req.get("type", ""),
                "from_destination": req.get("to_destination", ""),
                "from_date": return_date,
                "to_destination": req.get("from_destination", ""),
                "to_date": "",
                "is_foreign_flight": req.get("is_foreign_flight", False),
            }
            new_requests.append(return_req)

    return {"provider_name": provider_name, "requests": new_requests}


def check_internal_foreign_flights(input_data):

    provider_name = input_data.get("provider_name")
    internal_flights = {"provider_name": provider_name, "requests": []}
    foreign_flights = {"provider_name": provider_name, "requests": []}

    for request in input_data.get("requests", []):
        if request.get("is_foreign_flight", False):
            foreign_flights["requests"].append(request)
        else:
            internal_flights["requests"].append(request)

    return internal_flights, foreign_flights


# def serve():
#     server = grpc.server(futures.ThreadPoolExecutor(max_workers=4))
#     scraper_pb2_grpc.add_ScraperServiceServicer_to_server(ScraperService(), server)
#     server.add_insecure_port('[::]:50051')
#     server.start()
#     print("gRPC server listening on port 50051")
#     server.wait_for_termination()


# if __name__ == "__main__":
#     serve()


async def serve():
    server = aio.server()
    scraper_pb2_grpc.add_ScraperServiceServicer_to_server(ScraperService(), server)
    server.add_insecure_port('[::]:50051')
    await server.start()
    print("gRPC server listening on port 50051")
    print("Database integration: " + ("ENABLED ✓" if flight_db else "DISABLED ✗"))
    
    try:
        await server.wait_for_termination()
    finally:
        # Graceful shutdown - disconnect from database
        if flight_db:
            try:
                flight_db.disconnect()
                print("✓ Database disconnected")
            except Exception as e:
                print(f"⚠ Error disconnecting database: {e}")

if __name__ == '__main__':
    asyncio.run(serve())