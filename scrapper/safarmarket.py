import re
import json
import requests
import aiohttp

from fake_useragent import UserAgent

from conf import SafarMarketConfig


class SafarMarket:
    api = SafarMarketConfig.safarmarket_api
    provider_name = "safarmarket"

    def __init__(self):
        self.ua = UserAgent()

    async def crawl_flights(self, origin: str, destination: str, date: str, is_foreign_flight: bool) -> list:
        print("Crawling safarmarket ...")
        headers = {
            "User-Agent": self.ua.random,
            "Content-Type": "application/json",
        }

        payload = {
            "searchFilter": {
                "sourceAirportCode": origin,
                "targetAirportCode": destination,
                "sourceIsCity": True,
                "targetIsCity": True,
                "leaveDate": date,
                "returnDate": "",
                "adultCount": 1,
                "childCount": 0,
                "infantCount": 0,
                "economy": True,
                "business": True
            }
        }
        
        timeout = aiohttp.ClientTimeout(total=60, connect=10)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            try:
                async with session.post(self.api, headers=headers, json=payload) as response:
                    # print(response.status)
                    if response.status != 200:
                        print(f"⚠️ SafarMarket API returned status {response.status}")
                        return []
                    
                    json_response = await response.json()
                    
                    # Debug: Print response structure to diagnose issues
                    print(f"✓ SafarMarket API response keys: {list(json_response.keys()) if json_response else 'None'}")
                    
                    if json_response and "result" in json_response:
                        result = json_response.get("result", {})
                        if isinstance(result, dict):
                            print(f"  Result keys: {list(result.keys())}")
                            flight_list = result.get("flights", [])
                            print(f"  Found {len(flight_list) if flight_list else 0} flights in response")
                        else:
                            print(f"  ⚠️ Result is not a dict, got: {type(result)}")
                            flight_list = []
                    else:
                        print(f"⚠️ SafarMarket: No 'result' in response")
                        flight_list = []
                    
            except aiohttp.ClientError as e:
                print(f"⚠️ SafarMarket connection error: {type(e).__name__}: {str(e)}")
                return []
            except Exception as e:
                print(f"⚠️ SafarMarket unexpected error: {type(e).__name__}: {str(e)}")
                return []
            
            if len(flight_list) > 0:
                flight_list = self.output_wrapper(flight_list)
                flight_list = self.transform_flight_data(flight_list, is_foreign_flight)
            else:
                print(f"There were no flights for following date & endpoints in {self.provider_name}: origin: {origin}, "
                        f"destination: {destination}, date: {date}.")

            print("safarmarket crawled.")
            return flight_list if flight_list is not None else []

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
        try:
            return int(flight.get("price", 0))
        except Exception as e:
            print(f"Error getting price from flight data: {e}\nFlight: {flight}")
            return 0

    def transform_flight_data(self, flight_list: list, is_foreign_flight: bool) -> list:
        transformed_flight_list = list()
        
        if not flight_list or len(flight_list) == 0:
            print(f"⚠️ SafarMarket: Empty flight_list provided")
            return transformed_flight_list
            
        try:
            origin, destination = self.find_flight_endpoints(flight_list[0])
        except Exception as e:
            print(f"⚠️ SafarMarket: Could not find flight endpoints: {e}")
            return transformed_flight_list

        for item in flight_list:
            try:
                flights = item.get("providers")
                
                # Check if providers exists and is iterable
                if not flights:
                    # Skip silently - some items may not have providers
                    continue
                    
                if not isinstance(flights, list):
                    print(f"⚠️ SafarMarket: providers is not a list, got: {type(flights)}")
                    continue
                
                for flight in flights:
                    try:
                        price = self.find_price(flight)
                        new_flight = {
                            "provider_name": self.provider_name + " - " + flight.get("title"),
                            "origin": origin,
                            "destination": destination,
                            "departure_date_time": item.get("leave").get("legs")[0].get("departure_time", ""),
                            "arrival_date_time": item.get("leave").get("legs")[0].get("arrival_time", ""),
                            "adult_price": price,
                            "airline_name_fa": item.get("leave").get("legs")[0].get("airline_name_fa", ""),
                            "airline_name_en": item.get("leave").get("legs")[0].get("airline_name", ""),
                            "flight_number": item.get("leave").get("legs")[0].get("flight_no", ""),
                            "capacity": 0 if price == 0 else flight.get("capacity", -1),
                            "is_foreign_flight": is_foreign_flight,
                            "rules": "",
                        }
                        transformed_flight_list.append(new_flight)
                    except Exception as e:
                        print(f"There is something wrong in this flight: {flight}. The error was: {e}")
                        continue
            except Exception as e:
                print(f"There is something wrong in this item: {item}. The error was: {e}")
                continue

        return transformed_flight_list

    @classmethod
    def find_flight_endpoints(cls, flight: dict) -> tuple:
        origin = flight.get("leave").get("legs")[0].get("departure_airport_code")
        destination = flight.get("leave").get("legs")[-1].get("arrival_airport_code")
        return origin, destination
