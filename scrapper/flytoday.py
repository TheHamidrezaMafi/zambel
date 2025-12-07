import os
import re
import json
import requests
import aiohttp
from dotenv import load_dotenv
from fake_useragent import UserAgent

from conf import FlyTodayConfig

load_dotenv()


class FlyToday:
    api = FlyTodayConfig.flytoday_api
    x_token = os.getenv('X_TOKEN')
    provider_name = "flytoday"

    def __init__(self):
        self.ua = UserAgent()

    async def crawl_flights(self, origin: str, destination: str, date: str, is_foreign_flight: bool) -> list:
        print("Crawling flytoday ...")

        headers = {
            "User-Agent": self.ua.random,
            "Content-Type": "application/json",
            "X-TOKEN": self.x_token
        }

        payload = {
            "pricingSourceType": 0,
            "adultCount": 1,
            "childCount": 0,
            "infantCount": 0,
            "travelPreference": {
                "cabinType": "Y",
                "maxStopsQuantity": "All",
                "airTripType": "OneWay"
            },
            "originDestinationInformations": [
                {
                    "departureDateTime": date,
                    "destinationLocationCode": destination,
                    "destinationType": "City",
                    "originLocationCode": origin,
                    "originType": "City"
                }
            ],
            "isJalali": True
        }

        print("------tttttttttttttt 3-------\n")
        async with aiohttp.ClientSession() as session:
            print("------tttttttttttttt2-------\n")
            print(headers)
            print("------tttttttttttttt2-------\n")
            print(payload)
            print("\n------tttttttttttttt2-------\n")
            async with session.post(self.api, headers=headers, json=payload) as response:
                # print(response.status)
                print("------tttttttttttttt1-------\n")
                json_response = await response.json()
                print("------tttttttttttttt-------\n")

                print(json_response)

                print("\n------tttttttttttttt------")
                flight_list = json_response.get("pricedItineraries", [])

                if len(flight_list) > 0:
                    flight_list = self.output_wrapper(flight_list)
                    flight_list = self.transform_flight_data(flight_list, is_foreign_flight)
                else:
                    print(f"There were no flights for following date & endpoints in {self.provider_name}: origin: {origin}, "
                        f"destination: {destination}, date: {date}.")

                print("flytoday crawled.")
                return flight_list

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
            return int(flight.get("air_itinerary_pricing_info").get("itin_total_fare").get("total_fare", 0))
        except Exception as e:
            print(f"Error getting price from flight data: {e}\nFlight: {flight}")
            return 0

    def transform_flight_data(self, flight_list: list, is_foreign_flight) -> list:
        transformed_flight_list = list()
        origin, destination = self.find_flight_endpoints(flight_list[0])

        for flight in flight_list:
            try:
                price = self.find_price(flight)
                new_flight = {
                    "provider_name": self.provider_name,
                    "origin": origin,
                    "destination": destination,
                    "departure_date_time": flight.get(
                        "origin_destination_options")[0].get("flight_segments")[0].get("departure_date_time", ""),

                    "arrival_date_time": flight.get(
                        "origin_destination_options")[0].get("flight_segments")[0].get("arrival_date_time", ""),

                    "adult_price": price,
                    "airline_name_fa": "",
                    "airline_name_en": flight.get("validating_airline_code", ""),
                    "flight_number": flight.get(
                        "origin_destination_options")[0].get("flight_segments")[0].get("flight_number", ""),

                    "capacity": 0 if price == 0 else flight.get(
                        "origin_destination_options")[0].get("flight_segments")[0].get("seats_remaining", -1),
                    "is_foreign_flight": is_foreign_flight,
                    "rules": "",
                }
                transformed_flight_list.append(new_flight)
            except Exception as e:
                print(f"There is something wrong in this flight: {flight}. The error was: {e}")
                continue

        return transformed_flight_list

    @classmethod
    def find_flight_endpoints(cls, flight: dict) -> tuple:
        origin = flight.get(
            "origin_destination_options")[0].get("flight_segments")[0].get("departure_airport_location_code")
        destination = flight.get(
            "origin_destination_options")[0].get("flight_segments")[-1].get("arrival_airport_location_code")
        return origin, destination
