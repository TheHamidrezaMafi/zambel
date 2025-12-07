import asyncio
from grpc import aio
import time
import threading
from concurrent import futures
from google.protobuf.json_format import MessageToDict,ParseDict
import json
import scraper_pb2
import scraper_pb2_grpc
from pateh import Pateh
from mrbilit import MrBilit
from alibaba import Alibaba
from flytoday import FlyToday
from safarmarket import SafarMarket
from safar366 import Safar366

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

def concatenate_flight_jsons(domestic_flights: list, foreign_flights: list) -> dict:
    """
    Concatenate two lists of domestic and foreign flights, and return them as a dictionary (JSON-like structure).

    Args:
        domestic_flights (list[dict]): List of domestic flight data.
        foreign_flights (list[dict]): List of foreign flight data.

    Returns:
        dict: A dictionary with a single key "flights" containing the combined list of all flights.
    """

    combined = {"flights": domestic_flights + foreign_flights}
    return combined


async def take_requests(flight_requests, context):
    
    # json_string = json.dumps(flight_requests)

    print(f"---------------- \n{flight_requests} ----------------")
    flight_requests = check_back_and_forth_flight(flight_requests)
    internal_flights, foreign_flights = check_internal_foreign_flights(flight_requests)
    internal_flights_res = await crawl_domestic(internal_flights)
    foreign_flights_res = await crawl_foreign(foreign_flights)
    flight_response = concatenate_flight_jsons(internal_flights_res, foreign_flights_res)
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
    await server.wait_for_termination()

if __name__ == '__main__':
    asyncio.run(serve())