import re
import json
import requests
import aiohttp

from fake_useragent import UserAgent

from conf import MrBilitConfig

class MrBilit:
    api = MrBilitConfig.mrbilit_api
    provider_name = "mrbilit"

    def __init__(self):
        self.ua = UserAgent()

    async def crawl_flights(self, origin: str, destination: str, date: str, is_foreign_flight: bool) -> list:
        print("Crawling mrbilit ...")
        headers = {
            "User-Agent": self.ua.random,
            "Content-Type": "application/json",
        }

        payload = {
            "AdultCount": 1,
            "ChildCount": 0,
            "InfantCount": 0,
            "CabinClass": "All",
            "Routes": [
                {
                    "OriginCode": origin,
                    "DestinationCode": destination,
                    "DepartureDate": date
                }
            ],
            "Baggage": True
        }

        async with aiohttp.ClientSession() as session:
            async with session.post(self.api, headers=headers, json=payload) as response:
                # print(response.status)
                json_response = await response.json()
                flight_list = json_response.get("Flights", [])

                if len(flight_list) > 0:
                    flight_list = self.output_wrapper(flight_list)
                    flight_list = self.transform_flight_data(flight_list, is_foreign_flight)
                else:
                    print(f"There were no flights for following date & endpoints in {self.provider_name}: origin: {origin}, "
                        f"destination: {destination}, date: {date}.")

                print("mrbilit crawled.")
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
            if len(flight.get("prices", [])) > 0:
                return int(flight.get("prices", [{}])[0].get("passenger_fares", [{}])[0].get("total_fare", 0))
            else:
                return 0
        except Exception as e:
            print(f"Error getting price from flight data: {e}\nFlight: {flight}")
            return 0

    def transform_flight_data(self, flight_list: list, is_foreign_flight: bool) -> list:
        transformed_flight_list = list()
        origin, destination = self.find_flight_endpoints(flight_list[0])

        for flight in flight_list:
            try:
                price = self.find_price(flight)
                new_flight = {
                    "provider_name": self.provider_name,
                    "origin": origin,
                    "destination": destination,
                    "departure_date_time": flight.get("segments")[0].get("legs")[0].get("departure_time"),
                    "arrival_date_time": flight.get("segments")[0].get("legs")[0].get("arrival_time"),
                    "adult_price": price,
                    "airline_name_fa": flight.get("segments")[0].get("legs")[0].get("airline").get("persian_title"),
                    "airline_name_en": flight.get("segments")[0].get("legs")[0].get("airline").get("english_title"),
                    "airline_code": flight.get("segments")[0].get("legs")[0].get("airline_code"),
                    "flight_number": flight.get("segments")[0].get("legs")[0].get("flight_number"),
                    "capacity": 0 if price == 0 else flight.get("prices")[0].get("capacity", -1),
                    "is_foreign_flight": is_foreign_flight,
                    "rules": "" if price == 0 else str(flight.get("prices")[0].get("fare_rules")),
                }
                transformed_flight_list.append(new_flight)
            except Exception as e:
                print(f"There is something wrong in this flight: {flight}. The error was: {e}")
                continue

        return transformed_flight_list

    @classmethod
    def find_flight_endpoints(cls, flight: dict) -> tuple:
        origin = flight.get("segments")[0].get("legs")[0].get("origin_code")
        destination = flight.get("segments")[0].get("legs")[-1].get("destination_code")
        return origin, destination
