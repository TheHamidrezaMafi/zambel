import requests
import jdatetime
import aiohttp
from datetime import datetime
from fake_useragent import UserAgent

from conf import PatehConfig

class Pateh:
    api = PatehConfig.pateh_api
    provider_name = "pateh"

    def __init__(self):
        self.ua = UserAgent()

    async def crawl_flights(self, origin: str, destination: str, date: str, is_foreign_flight: bool) -> list:
        print("Crawling pateh ...")
        headers = {
            "User-Agent": self.ua.random,
            "Content-Type": "application/json"
        }
        jalali_date = self.convert_date_to_jalali(date)

        params = {
            "origins[]": origin,
            "destinations[]": destination,
            "departure_dates[]": jalali_date,
            "returning": "",
            "adults_len": "1",
            "childs_len": "0",
            "infants_len": "0"
        }

        async with aiohttp.ClientSession() as session:
            async with session.get(self.api, headers=headers, params=params) as response:
                # print(response.status)
                json_response = await response.json()
                # response = requests.get(self.api, headers=headers, params=params)
                # response.raise_for_status()
                flight_list = json_response.get("data", [])

                if len(flight_list) > 0:
                    flight_list = self.transform_flight_data(flight_list, is_foreign_flight)
                else:
                    print(f"There were no flights for following date & endpoints in {self.provider_name}: origin: {origin}, "
                        f"destination: {destination}, date: {date}.")

                print("pateh crawled.")
                return flight_list

    @staticmethod
    def convert_date_to_jalali(date_str: str) -> str:
        """
        Convert a Gregorian date string ('YYYY-MM-DD') to a Jalali date string ('YYYY/MM/DD').
        """
        gregorian_date = datetime.strptime(date_str, "%Y-%m-%d").date()
        jalali_date = jdatetime.date.fromgregorian(date=gregorian_date)
        return jalali_date.strftime("%Y/%m/%d")

    @classmethod
    def find_price(cls, flight: dict) -> int:
        try:
            return int(flight.get("finance").get("adult").get("fare", 0))
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
                    "departure_date_time": flight.get("depart")[0].get("flight_datetime", ""),
                    "arrival_date_time": flight.get("depart")[0].get("arrival_datetime", ""),
                    "adult_price": price,
                    "airline_name_fa": flight.get("depart")[0].get("airline_info").get("name_fa", ""),
                    "airline_name_en": flight.get("depart")[0].get("airline_info").get("name_en", ""),
                    "flight_number": flight.get("depart")[0].get("flight_no", ""),
                    "capacity": 0 if price == 0 else flight.get("depart")[0].get("available_seat_quantity", -1),
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
        origin = flight.get("depart")[0].get("origin")
        destination = flight.get("depart")[-1].get("destination")
        return origin, destination
