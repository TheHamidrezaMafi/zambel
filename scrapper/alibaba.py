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
            self.get_request_id(origin, destination, date, is_foreign_flight)

        # while True:
        get_flights_url = f"{api}{self.request_id}"
            
        async with aiohttp.ClientSession() as session:
            async with session.get(get_flights_url, headers=self.get_api_header) as flights_url_response:

                if flights_url_response.status != 200 and self.new_request_id:
                    raise Exception(f"GET API call failed with status code {flights_url_response.status}")

                elif flights_url_response.status != 200 and not self.new_request_id:
                    print(f"GET API call failed with status code {flights_url_response.status}\n"
                        f"We change request id and try one more time")

                    self.get_request_id(origin, destination, date, is_foreign_flight)
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

    def get_request_id(self, origin: str, destination: str, date: str, is_foreign_flight: bool):
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
        post_response = requests.post(api, json=payload, headers=self.get_api_header)

        if post_response.status_code != 200:
            raise Exception(f"POST API call failed with status code {post_response.status_code}."
                            f"Error is: {post_response.text}")

        post_data = post_response.json()
        self.request_id = post_data.get("result", {}).get("requestId")
        self.new_request_id = True

    def transform_flight_data(self, flight_list: list, is_foreign_flight: bool) -> list:
        transformed_flight_list = list()

        if not is_foreign_flight:
            for flight in flight_list:
                try:
                    new_flight = {
                        "provider_name": self.provider_name,
                        "origin": flight.get("origin", ""),
                        "destination": flight.get("destination", ""),
                        "departure_date_time": flight.get("leave_date_time", ""),
                        "arrival_date_time": flight.get("arrival_date_time", ""),
                        "adult_price": int(flight.get("price_adult", 0)),
                        "airline_name_fa": flight.get("airline_name", ""),
                        "airline_name_en": "",
                        "flight_number": flight.get("flight_number", ""),
                        "capacity": flight.get("seat", -1),
                        "is_foreign_flight": is_foreign_flight,
                        "rules": str(flight.get("crcn", "")),
                    }
                    transformed_flight_list.append(new_flight)
                except Exception as e:
                    print(f"There is something wrong in this flight: {flight}. The error was: {e}")
                    continue

        else:
             for flight in flight_list:
                try:
                    new_flight = {
                        "provider_name": self.provider_name,
                        "origin": flight.get("leaving_flight_group").get("origin", ""),
                        "destination": flight.get("leaving_flight_group").get("destination", ""),
                        "departure_date_time": flight.get("leaving_flight_group").get("departure_date_time", ""),
                        "arrival_date_time": flight.get("leaving_flight_group").get("arrival_date_time", ""),
                        "adult_price": int(flight.get("prices")[0].get("per_passenger", 0)),
                        "airline_name_fa": flight.get("leaving_flight_group").get("airline_name", ""),
                        "airline_name_en": "",
                        "flight_number": flight.get(
                            "leaving_flight_group").get("flight_details")[0].get("flight_number", ""),
                        "capacity": flight.get("seat", -1),
                        "is_foreign_flight": is_foreign_flight,
                        "rules": flight.get("cabin_baggage", ""),
                    }
                    transformed_flight_list.append(new_flight)
                except Exception as e:
                    print(f"There is something wrong in this flight: {flight}. The error was: {e}")
                    continue

        return transformed_flight_list
