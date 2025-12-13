import re
import json
import os
import aiohttp
import asyncio
from fake_useragent import UserAgent
from playwright.async_api import async_playwright

from conf import Safar366Config


class Safar366:
    api = Safar366Config.safar366_api
    refresh_token_api = Safar366Config.safar366_refresh_token_api
    provider_name = "safar366"
    token = None

    AIRLINE_MAPPING = {
        "Sepehran Airlines": "هواپیمایی سپهران",
        "Taban Air": "هواپیمایی تابان",
        "Mahan Air": "هواپیمایی ماهان",
        "Iran Air": "هواپیمایی ایران ایر",
        "Iran Airtour": "هواپیمایی ایران ایرتور",
        "Aseman Airlines": "هواپیمایی آسمان",
        "Zagros Airlines": "هواپیمایی زاگرس",
        "Kish Air": "هواپیمایی کیش ایر",
        "Qeshm Air": "هواپیمایی قشم ایر",
        "Caspian Airlines": "هواپیمایی کاسپین",
        "ATA Airlines": "هواپیمایی آتا",
        "Varesh Airlines": "هواپیمایی وارش",
        "Fly Persia": "هواپیمایی فلای پرشیا",
        "Pars Air": "هواپیمایی پارس",
        "Karun Airlines": "هواپیمایی کارون",
        "Saha Airlines": "هواپیمایی ساها",
        "Meraj Airlines": "هواپیمایی معراج",
        "Chabahar Airlines": "هواپیمایی چابهار",
        "Chabahar": "هواپیمایی چابهار",
        "Ava Air": "هواپیمایی آوا",
        "Arvan": "هواپیمایی آروان",
        "Yazd Air": "هواپیمایی یزد",
        "Nasim Air": "هواپیمایی نسیم",
        "Royal Airlines": "هواپیمایی رویال",
        "Atlas Air": "هواپیمایی اطلس",
        "Fly Kish": "هواپیمایی کیش",
    }

    def __init__(self):
        self.ua = UserAgent()

    async def get_token(self, force_refresh=False) -> str:
        """
        Get authentication token, either from file or by fetching a new one.
        """
        token_file = "safar366_token.txt"
        
        if not force_refresh and os.path.exists(token_file):
            try:
                with open(token_file, "r") as f:
                    token = f.read().strip()
                    if token:
                        print("✓ Loaded token from file")
                        return token
            except Exception as e:
                print(f"Error reading token file: {e}")

        token = await self.fetch_new_token()
        if token:
            try:
                with open(token_file, "w") as f:
                    f.write(token)
            except Exception as e:
                print(f"Error writing token file: {e}")
        return token

    async def fetch_new_token(self) -> str:
        """
        Extract authentication token by opening safar366.com with Playwright
        and capturing it from network requests.
        
        Returns:
            str: The authentication token to be used in subsequent requests.
        """
        print("Getting token from safar366.com using Playwright...")
        
        try:
            async with async_playwright() as p:
                # Launch browser with realistic settings to avoid detection
                browser = await p.chromium.launch(
                    headless=True,
                    args=[
                        '--disable-blink-features=AutomationControlled',
                        '--disable-dev-shm-usage',
                        '--no-sandbox'
                    ]
                )
                context = await browser.new_context(
                    user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                    viewport={'width': 1920, 'height': 1080},
                    java_script_enabled=True
                )
                
                # Add stealth script to avoid detection
                await context.add_init_script('''
                    Object.defineProperty(navigator, 'webdriver', {get: () => undefined})
                ''')
                
                page = await context.new_page()
                
                token = None
                token_event = asyncio.Event()
                
                # Listen to network requests to capture the token
                def handle_request(request):
                    nonlocal token
                    if token:
                        return
                    
                    # Check for Authorization header in requests
                    auth_header = request.headers.get("authorization", "")
                    if auth_header and auth_header.startswith("Bearer "):
                        token = auth_header.replace("Bearer ", "").strip()
                        print(f"✓ Captured token from request")
                        token_event.set()
                
                async def handle_response(response):
                    nonlocal token
                    if token:
                        return
                        
                    # Check if response contains a token
                    if response.status == 200:
                        try:
                            # Check for token in response body for specific endpoints
                            if "guesttoken" in response.url or "parsetoken" in response.url:
                                json_data = await response.json()
                                if isinstance(json_data, dict) and "token" in json_data:
                                    token = json_data["token"]
                                    print(f"✓ Captured token from response")
                                    token_event.set()
                        except:
                            pass
                
                page.on("request", handle_request)
                page.on("response", handle_response)
                
                # Navigate to the flight page
                print("Opening https://safar366.com/flight/")
                try:
                    # Use 'domcontentloaded' to ensure scripts are loaded
                    await page.goto("https://safar366.com/flight/", wait_until="domcontentloaded", timeout=90000)
                except Exception as e:
                    print(f"Navigation warning: {e}")
                
                # Wait for token to be captured (max 30 seconds)
                try:
                    await asyncio.wait_for(token_event.wait(), timeout=30)
                except asyncio.TimeoutError:
                    print("Timeout waiting for token event")
                
                await browser.close()
                
                if token:
                    print(f"✓ Successfully extracted safar366 token")
                    return token
                else:
                    print("✗ Token not found in network requests")
                    return None
                    
        except Exception as e:
            print(f"✗ Error extracting safar366 token: {e}")
            return None

    async def crawl_flights(self, origin: str, destination: str, date: str, is_foreign_flight: bool) -> list:
        """
        Crawls the safar366 API for the given trip parameters.

        Parameters:
            origin (str): Origin airport code (e.g., "THR")
            destination (str): Destination airport code (e.g., "MHD")
            date (str): Departure date in YYYY-MM-DD format (e.g., "2025-11-28")
            is_foreign_flight (bool): Flag indicating if this is a foreign flight

        Returns:
            list: List of transformed flight data.
        """
        print("Crawling safar366 ...")

        # Get fresh token
        if not self.token:
            self.token = await self.get_token()
            if not self.token:
                print("Failed to get token for safar366, skipping...")
                return []

        headers = {
            "User-Agent": self.ua.random,
            "Accept": "application/json, text/plain, */*",
            "Accept-Encoding": "gzip, deflate, br, zstd",
            "Accept-Language": "en-GB,en;q=0.9,fa-IR;q=0.8,fa;q=0.7,en-US;q=0.6",
            "Authorization": f"Bearer {self.token}",
            "Cache-Control": "no-cache",
            "Content-Type": "application/json",
            "Origin": "https://safar366.com",
            "Referer": "https://safar366.com/flight/",
        }

        payload = {
            "Lang": "FA",
            "TravelPreference": {
                "CabinPref": {
                    "Cabin": "Economy"
                },
                "EquipPref": {
                    "AirEquipType": "IATA"
                },
                "FlightTypePref": {
                    "BackhaulIndicator": "",
                    "DirectAndNonStopOnlyInd": False,
                    "ExcludeTrainInd": False,
                    "GroundTransportIndicator": False,
                    "MaxConnections": 3
                }
            },
            "TravelerInfoSummary": {
                "AirTravelerAvail": {
                    "PassengerTypeQuantity": [
                        {"Code": "ADT", "Quantity": 1},
                        {"Code": "CHD", "Quantity": 0},
                        {"Code": "INF", "Quantity": 0}
                    ]
                }
            },
            "SpecificFlightInfo": {
                "Airline": []
            },
            "OriginDestinationInformations": [
                {
                    "OriginLocation": {
                        "CodeContext": "IATA",
                        "LocationCode": origin.upper(),
                        "MultiAirportCityInd": True
                    },
                    "DestinationLocation": {
                        "CodeContext": "IATA",
                        "LocationCode": destination.upper(),
                        "MultiAirportCityInd": False
                    },
                    "DepartureDateTime": date,
                    "ArrivalDateTime": None
                }
            ],
            "DeepLink": 0
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.api, headers=headers, json=payload, ssl=False) as response:
                    should_retry = False
                    json_response = None

                    if response.status == 401:
                        print("Token expired (401), refreshing...")
                        should_retry = True
                    elif response.status != 200:
                        print(f"safar366 API call failed with status code {response.status}")
                        return []
                    else:
                        json_response = await response.json()
                        if isinstance(json_response, dict) and json_response.get("Success") is False:
                            print("API returned Success: false, refreshing token...")
                            should_retry = True

                    if should_retry:
                        # Refresh token
                        self.token = await self.get_token(force_refresh=True)
                        if not self.token:
                            print("Failed to refresh token, skipping...")
                            return []
                        
                        headers["Authorization"] = f"Bearer {self.token}"
                        async with session.post(self.api, headers=headers, json=payload, ssl=False) as retry_response:
                            if retry_response.status != 200:
                                print(f"safar366 API call failed with status code {retry_response.status}")
                                return []
                            json_response = await retry_response.json()

                    # Extract flight list from response
                    flight_list = json_response.get("Items", [])

                    if len(flight_list) > 0:
                        flight_list = self.output_wrapper(flight_list)
                        flight_list = self.transform_flight_data(flight_list, is_foreign_flight)
                    else:
                        print(f"There were no flights for following date & endpoints in {self.provider_name}: origin: {origin}, "
                            f"destination: {destination}, date: {date}.")

                    print("safar366 crawled.")
                    return flight_list

        except Exception as e:
            print(f"Error during safar366 crawling: {e}")
            return []

    @staticmethod
    def camel_to_snake(name: str) -> str:
        """
        Convert a camelCase string to snake_case.
        """
        s1 = re.sub(r'(.)([A-Z][a-z]+)', r'\1_\2', name)
        snake = re.sub(r'([a-z0-9])([A-Z])', r'\1_\2', s1)
        return snake.lower()

    @classmethod
    def convert_keys(cls, obj: dict):
        """
        Recursively convert all dictionary keys in the given object from camelCase to snake_case.
        """
        if isinstance(obj, dict):
            new_obj = {}
            for key, value in obj.items():
                new_key = cls.camel_to_snake(key)
                new_obj[new_key] = cls.convert_keys(value)
            return new_obj
        elif isinstance(obj, list):
            return [cls.convert_keys(item) for item in obj]
        else:
            return obj

    @classmethod
    def output_wrapper(cls, crawl_output: dict):
        """
        Takes the JSON output from the crawl function and rewrites all keys
        from camelCase to snake_case.
        """
        return cls.convert_keys(crawl_output)

    @classmethod
    def find_price(cls, flight: dict) -> int:
        """
        Extract price from flight data.
        """
        try:
            air_itinerary_pricing_info = flight.get("air_itinerary_pricing_info", {})
            itin_total_fare = air_itinerary_pricing_info.get("itin_total_fare", {})
            total_fare = itin_total_fare.get("total_fare", 0)
            return int(total_fare)
        except Exception as e:
            print(f"Error getting price from flight data: {e}\nFlight: {flight}")
            return 0

    def transform_flight_data(self, flight_list: list, is_foreign_flight: bool) -> list:
        """
        Transform flight data from safar366 API format to standardized format.
        """
        transformed_flight_list = []

        for flight in flight_list:
            try:
                price = self.find_price(flight)
                
                # Extract origin destination information
                origin_dest_info = flight.get("origin_destination_information", {})
                origin_dest_options = origin_dest_info.get("origin_destination_option", [])
                if not origin_dest_options:
                    continue
                
                first_option = origin_dest_options[0]
                flight_segments = first_option.get("flight_segment", [])
                if not flight_segments:
                    continue
                
                first_segment = flight_segments[0]
                last_segment = flight_segments[-1]
                
                # Extract airline and flight number
                marketing_airline = first_segment.get("marketing_airline", {})
                airline_code = marketing_airline.get("code", "")
                airline_name_en = marketing_airline.get("company_short_name", "")
                
                flight_number = first_segment.get("flight_number", "")
                
                # Extract airline name in Farsi from TPA_Extensions
                tpa_extensions = first_segment.get("tpa_extensions", {})
                airline_name_fa = tpa_extensions.get("airline_name_fa", "")
                
                if not airline_name_fa and airline_name_en:
                    airline_name_fa = self.AIRLINE_MAPPING.get(airline_name_en, "")
                
                # Extract dates
                departure_date_time = first_segment.get("departure_date_time", "")
                arrival_date_time = last_segment.get("arrival_date_time", "")
                
                # Extract locations
                departure_airport = first_segment.get("departure_airport", {})
                arrival_airport = last_segment.get("arrival_airport", {})
                origin_code = departure_airport.get("location_code", "")
                destination_code = arrival_airport.get("location_code", "")
                
                # Extract capacity
                seats_remaining = first_segment.get("seats_remaining", -1)
                try:
                    seats_remaining = int(seats_remaining)
                except (ValueError, TypeError):
                    seats_remaining = -1
                
                capacity = 0 if price == 0 else seats_remaining

                new_flight = {
                    "provider_name": self.provider_name,
                    "origin": origin_code,
                    "destination": destination_code,
                    "departure_date_time": departure_date_time,
                    "arrival_date_time": arrival_date_time,
                    "adult_price": price,
                    "airline_name_fa": airline_name_fa,
                    "airline_name_en": airline_name_en,
                    "airline_code": airline_code,
                    "flight_number": str(flight_number),
                    "capacity": capacity,
                    "is_foreign_flight": is_foreign_flight,
                    "rules": "",
                }
                transformed_flight_list.append(new_flight)
                
            except Exception as e:
                print(f"There is something wrong in this flight: {flight}. The error was: {e}")
                continue

        return transformed_flight_list
