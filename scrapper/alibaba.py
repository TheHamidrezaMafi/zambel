import re
import requests
import aiohttp
from fake_useragent import UserAgent

from conf import AlibabaConfig


class Alibaba:
    domestic_api = AlibabaConfig.alibaba_domestic_api
    international_api = AlibabaConfig.alibaba_international_api
    provider_name = AlibabaConfig.provider_name
    yata_code_postfix = AlibabaConfig.yata_code_postfix
    get_api_header = AlibabaConfig.get_api_header
    domestic_dict_name = AlibabaConfig.domestic_dict_name
    foreign_dict_name = AlibabaConfig.foreign_dict_name

    request_id = ""
    new_request_id = False

    def __init__(self):
        ua = UserAgent()
        self.get_api_header["User-Agent"] = ua.random

    async def crawl_flights(self, origin: str, destination: str, date: str, is_foreign_flight: bool) -> list:
        """
        Crawls the flight API for the given trip parameters.

        Parameters:
            origin (str): Origin city name (e.g., "tehran")
            destination (str): Destination city name (e.g., "shiraz")
            date (str): Departure date in YYYY-MM-DD format (e.g., "2025-03-29")
            is_foreign_flight(bool): is foreign flight or not

        Returns:
            dict: JSON response from the GET API call.
        """

        print("Crawling alibaba ...")

        flights_list = dict()

        # if is_foreign_flight:
        #     origin = origin + self.yata_code_postfix
        #     destination = destination + self.yata_code_postfix

        api = self.international_api if is_foreign_flight else self.domestic_api

        if not self.new_request_id:
            await self.get_request_id(origin, destination, date, is_foreign_flight)

        # If get_request_id failed, return empty list
        if not self.request_id:
            print(f"⚠️ Alibaba: No request ID available, skipping")
            return []

        # while True:
        get_flights_url = f"{api}{self.request_id}"
            
        async with aiohttp.ClientSession() as session:
            async with session.get(get_flights_url, headers=self.get_api_header) as flights_url_response:

                if flights_url_response.status != 200 and self.new_request_id:
                    print(f"⚠️ Alibaba GET API error (status {flights_url_response.status})")
                    return []

                elif flights_url_response.status != 200 and not self.new_request_id:
                    print(f"GET API call failed with status code {flights_url_response.status}\n"
                        f"We change request id and try one more time")

                    await self.get_request_id(origin, destination, date, is_foreign_flight)
                    self.new_request_id = False if is_foreign_flight else True
                    # continue

                dict_name = self.foreign_dict_name if is_foreign_flight else self.domestic_dict_name
                response = await flights_url_response.json()
                flights_list = response.get("result", {}).get(dict_name, [])
                print(flights_list)
                flights_list = self.output_wrapper(flights_list)
                # break

        if len(flights_list) > 0:
            flights_list = self.transform_flight_data(flights_list, is_foreign_flight)
        else:
            print(f"There were no flights for following date & endpoints in {self.provider_name}: origin: {origin}, "
                f"destination: {destination}, date: {date}.")

        print("alibaba crawled.")
        return flights_list

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

    async def get_request_id(self, origin: str, destination: str, date: str, is_foreign_flight: bool):
        payload = {
            "origin": origin,
            "destination": destination,
            "departureDate": date,
            "adult": 1,
            "child": 0,
            "infant": 0,
            "flightClass": "economy"
        }

        api = self.international_api if is_foreign_flight else self.domestic_api
        
        async with aiohttp.ClientSession() as session:
            async with session.post(api, json=payload, headers=self.get_api_header) as post_response:
                if post_response.status != 200:
                    text = await post_response.text()
                    print(f"⚠️ Alibaba API error (status {post_response.status}): {text}")
                    # Don't raise exception, just log and continue with empty results
                    return

                post_data = await post_response.json()
                self.request_id = post_data.get("result", {}).get("requestId")
                self.new_request_id = True

    def transform_flight_data(self, flight_list: list, is_foreign_flight: bool) -> list:
        transformed_flight_list = list()

        if not is_foreign_flight:
            for flight in flight_list:
                try:
                    # Extract additional details
                    crcn_rules = flight.get("crcn", {})
                    
                    new_flight = {
                        # Basic Info
                        "provider_name": self.provider_name,
                        "origin": flight.get("origin", ""),
                        "destination": flight.get("destination", ""),
                        "departure_date_time": flight.get("leave_date_time", ""),
                        "arrival_date_time": flight.get("arrival_date_time", ""),
                        "flight_number": flight.get("flight_number", ""),
                        
                        # Airline
                        "airline_name_fa": flight.get("airline_name", ""),
                        "airline_name_en": "",
                        "airline_code": flight.get("airline_code", ""),
                        "airline_logo": flight.get("airline_logo", ""),
                        
                        # Pricing
                        "adult_price": int(flight.get("price_adult", 0)),
                        "child_price": int(flight.get("price_child", 0)) if flight.get("price_child") else None,
                        "infant_price": int(flight.get("price_infant", 0)) if flight.get("price_infant") else None,
                        
                        # Capacity & Availability
                        "capacity": flight.get("seat", -1),
                        "is_foreign_flight": is_foreign_flight,
                        "is_charter": flight.get("is_charter", False),
                        "is_refundable": flight.get("is_refundable", True),
                        
                        # Cabin Class
                        "cabin_class": flight.get("class_type_name", "اکونومی"),
                        "cabin_class_code": flight.get("class", "Y"),
                        
                        # Aircraft
                        "aircraft_type": flight.get("aircraft", ""),
                        
                        # Terminal
                        "departure_terminal": flight.get("terminal", ""),
                        "arrival_terminal": flight.get("arrival_terminal", ""),
                        
                        # Baggage
                        "baggage_allowance": flight.get("baggage_allowance", ""),
                        "cabin_baggage": flight.get("cabin_baggage", ""),
                        
                        # Policies
                        "rules": crcn_rules,
                        "cancellation_rules": crcn_rules,
                        
                        # Additional
                        "unique_key": flight.get("unique_key", ""),
                        "proposal_id": flight.get("proposal_id", ""),
                        "is_promoted": flight.get("is_promoted", False),
                        "discount_percent": flight.get("discount_percent", 0),
                    }
                    transformed_flight_list.append(new_flight)
                except Exception as e:
                    print(f"There is something wrong in this flight: {flight}. The error was: {e}")
                    continue

        else:
             for flight in flight_list:
                try:
                    leaving_group = flight.get("leaving_flight_group", {})
                    flight_details = leaving_group.get("flight_details", [{}])[0]
                    prices = flight.get("prices", [{}])[0]
                    
                    new_flight = {
                        # Basic Info
                        "provider_name": self.provider_name,
                        "origin": leaving_group.get("origin", ""),
                        "destination": leaving_group.get("destination", ""),
                        "departure_date_time": leaving_group.get("departure_date_time", ""),
                        "arrival_date_time": leaving_group.get("arrival_date_time", ""),
                        "flight_number": flight_details.get("flight_number", ""),
                        
                        # Airline
                        "airline_name_fa": leaving_group.get("airline_name", ""),
                        "airline_name_en": leaving_group.get("airline_name_en", ""),
                        "airline_code": leaving_group.get("airline_code", ""),
                        
                        # Pricing
                        "adult_price": int(prices.get("per_passenger", 0)),
                        "child_price": None,
                        "infant_price": None,
                        
                        # Capacity
                        "capacity": flight.get("seat", -1),
                        "is_foreign_flight": is_foreign_flight,
                        "is_charter": False,
                        "is_refundable": True,
                        
                        # Cabin Class
                        "cabin_class": flight.get("cabin_class", "اکونومی"),
                        
                        # Aircraft
                        "aircraft_type": flight_details.get("aircraft", ""),
                        
                        # Baggage
                        "baggage_allowance": flight.get("baggage", ""),
                        "cabin_baggage": flight.get("cabin_baggage", ""),
                        
                        # Policies
                        "rules": flight.get("cabin_baggage", ""),
                        
                        # Additional
                        "unique_key": flight.get("unique_key", ""),
                    }
                    transformed_flight_list.append(new_flight)
                except Exception as e:
                    print(f"There is something wrong in this flight: {flight}. The error was: {e}")
                    continue

        return transformed_flight_list
