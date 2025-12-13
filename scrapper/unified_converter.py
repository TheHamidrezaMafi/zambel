"""
Unified Flight Data Format Converter

This module provides converters to transform raw scraper outputs from different
flight booking APIs (Alibaba, MrBilit, SafarMarket, Safar366) into a unified
JSON format.

The unified format is designed to:
1. Maximize data retention from all sources
2. Eliminate duplicate/redundant fields
3. Provide consistent naming conventions
4. Support both domestic and international flights
5. Include all pricing, baggage, and policy information
"""

import json
import re
from typing import Dict, List, Any, Optional
from datetime import datetime
from enum import Enum

# Import flight ID generator
from flight_id_generator import FlightIDGenerator


class CabinClass(str, Enum):
    """Standardized cabin class types"""
    ECONOMY = "economy"
    BUSINESS = "business"
    FIRST = "first"
    PREMIUM_ECONOMY = "premium_economy"


class TicketType(str, Enum):
    """Standardized ticket types"""
    CHARTER = "charter"
    SYSTEM = "system"
    TOUR = "tour"


class PassengerType(str, Enum):
    """Standardized passenger types"""
    ADULT = "adult"
    CHILD = "child"
    INFANT = "infant"


# ============================================================================
# UNIFIED FLIGHT DATA FORMAT
# ============================================================================

UNIFIED_FORMAT_SCHEMA = {
    # Flight Identification
    "flight_id": str,  # Unique identifier
    "provider_source": str,  # Original scraper name
    
    # Flight Basic Info
    "flight_number": str,
    "airline": {
        "code": str,  # IATA code (e.g., "IR", "MEH", "W5")
        "name_en": str,
        "name_fa": str,
        "logo_url": Optional[str]
    },
    "operating_airline": {  # If different from marketing airline
        "code": Optional[str],
        "name_en": Optional[str],
        "name_fa": Optional[str]
    },
    "aircraft": {
        "type": Optional[str],  # e.g., "Boeing 737", "Embraer 170"
        "code": Optional[str]   # e.g., "B737", "E170"
    },
    
    # Route Information
    "route": {
        "origin": {
            "airport_code": str,  # IATA code (e.g., "THR")
            "airport_name_en": Optional[str],
            "airport_name_fa": Optional[str],
            "city_code": str,
            "city_name_en": Optional[str],
            "city_name_fa": str,
            "terminal": Optional[str]
        },
        "destination": {
            "airport_code": str,
            "airport_name_en": Optional[str],
            "airport_name_fa": Optional[str],
            "city_code": str,
            "city_name_en": Optional[str],
            "city_name_fa": str,
            "terminal": Optional[str]
        }
    },
    
    # Schedule
    "schedule": {
        "departure_datetime": str,  # ISO 8601 format
        "arrival_datetime": str,    # ISO 8601 format
        "departure_date_jalali": Optional[str],  # e.g., "دوشنبه 24 آذر"
        "arrival_date_jalali": Optional[str],
        "duration_minutes": int,
        "stops": int,  # 0 for direct flights
        "connection_time_minutes": Optional[int]  # For connecting flights
    },
    
    # Pricing (all in IRR)
    "pricing": {
        "adult": {
            "base_fare": int,
            "total_fare": int,
            "taxes": Optional[int],
            "service_charge": Optional[int],
            "commission": Optional[int]
        },
        "child": {
            "base_fare": int,
            "total_fare": int,
            "taxes": Optional[int],
            "service_charge": Optional[int],
            "commission": Optional[int]
        },
        "infant": {
            "base_fare": int,
            "total_fare": int,
            "taxes": Optional[int],
            "service_charge": Optional[int],
            "commission": Optional[int]
        },
        "currency": str  # "IRR"
    },
    
    # Cabin & Class
    "cabin": {
        "class": str,  # Using CabinClass enum
        "class_display_name_fa": str,  # e.g., "اکونومی", "بیزینس"
        "booking_class": Optional[str]  # Fare class code (e.g., "Y", "W", "C")
    },
    
    # Ticket Type & Availability
    "ticket_info": {
        "type": str,  # Using TicketType enum
        "is_charter": bool,
        "is_refundable": bool,
        "is_domestic": bool,
        "capacity": int,
        "reservable": bool,
        "requires_passport": Optional[bool]
    },
    
    # Baggage Allowance
    "baggage": {
        "checked": {
            "adult_kg": Optional[int],
            "child_kg": Optional[int],
            "infant_kg": Optional[int],
            "pieces": Optional[int]
        },
        "cabin": {
            "kg": Optional[int],
            "pieces": Optional[int]
        }
    },
    
    # Cancellation & Refund Policies
    "policies": {
        "cancellation_rules": List[Dict[str, Any]],  # Time-based refund percentages
        "fare_rules": Optional[str],
        "terms": Optional[str]
    },
    
    # Additional Information
    "additional_info": {
        "promoted": bool,
        "discount_percent": Optional[float],
        "special_offers": List[str],
        "tags": List[str],
        "rating": Optional[float]
    },
    
    # Multi-Provider Data (for aggregators like SafarMarket)
    "providers": List[Dict[str, Any]],  # If flight available from multiple providers
    
    # Original Data Reference
    "metadata": {
        "scraped_at": str,  # ISO timestamp
        "original_id": str,  # Original flight ID from source
        "proposal_id": Optional[str],  # Booking proposal ID
        "search_id": Optional[str]
    }
}


# ============================================================================
# CONVERTER: ALIBABA
# ============================================================================

class AlibabaConverter:
    """Convert Alibaba flight data to unified format"""
    
    @staticmethod
    def normalize_cabin_class(class_type: str) -> str:
        """Normalize Alibaba cabin class codes"""
        mapping = {
            "E": CabinClass.ECONOMY,
            "B": CabinClass.BUSINESS,
            "F": CabinClass.FIRST,
            "P": CabinClass.PREMIUM_ECONOMY
        }
        return mapping.get(class_type, CabinClass.ECONOMY)
    
    @staticmethod
    def parse_cancellation_rules(crcn: Dict[str, str]) -> List[Dict[str, Any]]:
        """Parse Alibaba cancellation rules"""
        rules = []
        for time_period, refund_percent in crcn.items():
            rules.append({
                "time_period": time_period,
                "refund_percentage": int(refund_percent.replace('%', '')),
                "penalty_percentage": 100 - int(refund_percent.replace('%', ''))
            })
        return rules
    
    @classmethod
    def convert(cls, alibaba_flight: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Alibaba flight to unified format"""
        # Generate flight IDs
        departure_time = alibaba_flight.get("leaveDateTime", "").split("T")[1][:5] if "T" in alibaba_flight.get("leaveDateTime", "") else ""
        
        # Clean flight number
        clean_flight_num = FlightIDGenerator.clean_flight_number(
            alibaba_flight.get("flightNumber", ""),
            alibaba_flight.get("airlineCode", "")
        )
        
        # Base ID for cross-scraper matching (same flight, different prices)
        base_flight_id = FlightIDGenerator.generate_base_id(
            origin=alibaba_flight.get("origin", ""),
            destination=alibaba_flight.get("destination", ""),
            departure_date=alibaba_flight.get("leaveDateTime", ""),
            airline_code=alibaba_flight.get("airlineCode", ""),
            flight_number=clean_flight_num,
            departure_time=departure_time
        )
        
        # Full ID including price (unique per pricing option)
        flight_id = FlightIDGenerator.generate(
            origin=alibaba_flight.get("origin", ""),
            destination=alibaba_flight.get("destination", ""),
            departure_date=alibaba_flight.get("leaveDateTime", ""),
            airline_code=alibaba_flight.get("airlineCode", ""),
            flight_number=clean_flight_num,
            cabin_class=alibaba_flight.get("class", "B"),
            cabin_type=alibaba_flight.get("classTypeName", "اکونومی"),
            is_charter=alibaba_flight.get("isCharter", False),
            adult_price=alibaba_flight.get("priceAdult", 0),
            departure_time=departure_time
        )
        
        return {
            "base_flight_id": base_flight_id,  # For cross-scraper matching
            "flight_id": flight_id,  # Unique per pricing tier
            "provider_source": "alibaba",
            "original_id": alibaba_flight.get("uniqueKey"),  # Keep original for reference
            
            "flight_number": clean_flight_num,
            "airline": {
                "code": alibaba_flight.get("airlineCode"),
                "name_en": None,  # Not provided by Alibaba
                "name_fa": None,  # Not provided directly
                "logo_url": None
            },
            "operating_airline": {
                "code": None,
                "name_en": None,
                "name_fa": None
            },
            "aircraft": {
                "type": alibaba_flight.get("aircraft"),
                "code": None
            },
            
            "route": {
                "origin": {
                    "airport_code": alibaba_flight.get("origin"),
                    "airport_name_en": None,
                    "airport_name_fa": None,
                    "city_code": alibaba_flight.get("origin"),
                    "city_name_en": None,
                    "city_name_fa": None,
                    "terminal": alibaba_flight.get("terminal")
                },
                "destination": {
                    "airport_code": alibaba_flight.get("destination"),
                    "airport_name_en": None,
                    "airport_name_fa": None,
                    "city_code": alibaba_flight.get("destination"),
                    "city_name_en": None,
                    "city_name_fa": None,
                    "terminal": None
                }
            },
            
            "schedule": {
                "departure_datetime": alibaba_flight.get("leaveDateTime"),
                "arrival_datetime": alibaba_flight.get("arrivalDateTime"),
                "departure_date_jalali": None,
                "arrival_date_jalali": None,
                "duration_minutes": cls._calculate_duration(
                    alibaba_flight.get("leaveDateTime"),
                    alibaba_flight.get("arrivalDateTime")
                ),
                "stops": 0,
                "connection_time_minutes": None
            },
            
            "pricing": {
                "adult": {
                    "base_fare": alibaba_flight.get("priceAdult", 0),
                    "total_fare": alibaba_flight.get("priceAdult", 0),
                    "taxes": None,
                    "service_charge": None,
                    "commission": alibaba_flight.get("commission", 0)
                },
                "child": {
                    "base_fare": alibaba_flight.get("priceChild", 0),
                    "total_fare": alibaba_flight.get("priceChild", 0),
                    "taxes": None,
                    "service_charge": None,
                    "commission": None
                },
                "infant": {
                    "base_fare": alibaba_flight.get("priceInfant", 0),
                    "total_fare": alibaba_flight.get("priceInfant", 0),
                    "taxes": None,
                    "service_charge": None,
                    "commission": None
                },
                "currency": "IRR"
            },
            
            "cabin": {
                "class": cls.normalize_cabin_class(alibaba_flight.get("classType", "E")),
                "class_display_name_fa": alibaba_flight.get("classTypeName", "اکونومی"),
                "booking_class": alibaba_flight.get("class")
            },
            
            "ticket_info": {
                "type": TicketType.CHARTER if alibaba_flight.get("isCharter") else TicketType.SYSTEM,
                "is_charter": alibaba_flight.get("isCharter", False),
                "is_refundable": alibaba_flight.get("isRefundable", False),
                "is_domestic": True,  # Alibaba domestic API
                "capacity": alibaba_flight.get("seat", 0),
                "reservable": True,
                "requires_passport": None
            },
            
            "baggage": {
                "checked": {
                    "adult_kg": alibaba_flight.get("maxAllowedBaggage"),
                    "child_kg": alibaba_flight.get("maxAllowedBaggage"),
                    "infant_kg": 10,  # Standard for infants
                    "pieces": None
                },
                "cabin": {
                    "kg": None,
                    "pieces": None
                }
            },
            
            "policies": {
                "cancellation_rules": cls.parse_cancellation_rules(alibaba_flight.get("crcn", {})),
                "fare_rules": None,
                "terms": alibaba_flight.get("description")
            },
            
            "additional_info": {
                "promoted": alibaba_flight.get("promoted", 0) > 0,
                "discount_percent": alibaba_flight.get("discount"),
                "special_offers": [],
                "tags": [],
                "rating": alibaba_flight.get("stars")
            },
            
            "providers": [],
            
            "metadata": {
                "scraped_at": datetime.now().isoformat(),
                "original_id": alibaba_flight.get("flightId"),
                "proposal_id": alibaba_flight.get("proposalId"),
                "search_id": None
            }
        }
    
    @staticmethod
    def _calculate_duration(departure: str, arrival: str) -> int:
        """Calculate flight duration in minutes"""
        try:
            dep = datetime.fromisoformat(departure.replace('Z', '+00:00'))
            arr = datetime.fromisoformat(arrival.replace('Z', '+00:00'))
            return int((arr - dep).total_seconds() / 60)
        except:
            return 0


# ============================================================================
# CONVERTER: MRBILIT
# ============================================================================

class MrBilitConverter:
    """Convert MrBilit flight data to unified format"""
    
    @staticmethod
    def normalize_cabin_class(cabin_class: str) -> str:
        """Normalize MrBilit cabin class"""
        mapping = {
            "Economy": CabinClass.ECONOMY,
            "Business": CabinClass.BUSINESS,
            "First": CabinClass.FIRST
        }
        return mapping.get(cabin_class, CabinClass.ECONOMY)
    
    @classmethod
    def convert(cls, mrbilit_flight: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Convert MrBilit flight to unified format
        Returns list because MrBilit has multiple prices per flight
        """
        segments = mrbilit_flight.get("Segments", [])
        if not segments or not segments[0].get("Legs"):
            return []
        
        leg = segments[0]["Legs"][0]
        prices = mrbilit_flight.get("Prices", [])
        
        unified_flights = []
        
        for price in prices:
            passenger_fares = {pf["PaxType"]: pf for pf in price.get("PassengerFares", [])}
            adult_fare = passenger_fares.get("Adult", {})
            
            # Generate flight IDs
            departure_time = leg.get("DepartureTime", "").split("T")[1][:5] if "T" in leg.get("DepartureTime", "") else ""
            
            airline_code = leg.get("AirlineCode", "")
            flight_number = leg.get("FlightNumber", "")
            
            # Fallback: If airline_code is missing, try to extract from flight_number
            if not airline_code and flight_number:
                match = re.match(r'^([A-Z0-9]*[A-Z][A-Z0-9]*)(\d+)$', str(flight_number).upper())
                if match:
                    code = match.group(1)
                    if 2 <= len(code) <= 3:
                        airline_code = code

            # Clean flight number
            clean_flight_num = FlightIDGenerator.clean_flight_number(
                flight_number,
                airline_code
            )
            
            base_flight_id = FlightIDGenerator.generate_base_id(
                origin=leg.get("OriginCode", ""),
                destination=leg.get("DestinationCode", ""),
                departure_date=leg.get("DepartureTime", ""),
                airline_code=airline_code,
                flight_number=clean_flight_num,
                departure_time=departure_time
            )
            
            flight_id = FlightIDGenerator.generate(
                origin=leg.get("OriginCode", ""),
                destination=leg.get("DestinationCode", ""),
                departure_date=leg.get("DepartureTime", ""),
                airline_code=airline_code,
                flight_number=clean_flight_num,
                cabin_class=price.get("BookingClass", "Y"),
                cabin_type=price.get("CabinClass", "ECONOMY"),
                is_charter=price.get("IsCharter", False),
                adult_price=adult_fare.get("TotalPrice", 0),
                departure_time=departure_time
            )
            
            unified_flight = {
                "base_flight_id": base_flight_id,
                "flight_id": flight_id,
                "provider_source": "mrbilit",
                "original_id": f"{mrbilit_flight.get('Id')}_{price.get('BookingClass')}",
                
                "flight_number": clean_flight_num,
                "airline": {
                    "code": airline_code,
                    "name_en": leg.get("Airline", {}).get("EnglishTitle"),
                    "name_fa": leg.get("Airline", {}).get("PersianTitle"),
                    "logo_url": leg.get("Airline", {}).get("Logo")
                },
                "operating_airline": {
                    "code": leg.get("OperatingAirlineCode"),
                    "name_en": leg.get("OperatingAirline", {}).get("EnglishTitle"),
                    "name_fa": leg.get("OperatingAirline", {}).get("PersianTitle")
                },
                "aircraft": {
                    "type": leg.get("AirCraft", {}).get("EnglishTitle"),
                    "code": leg.get("AirCraft", {}).get("Iatacode")
                },
                
                "route": {
                    "origin": {
                        "airport_code": leg.get("OriginCode"),
                        "airport_name_en": leg.get("OriginAirport"),
                        "airport_name_fa": None,
                        "city_code": leg.get("OriginCode"),
                        "city_name_en": None,
                        "city_name_fa": leg.get("Origin"),
                        "terminal": leg.get("DepartureTerminal")
                    },
                    "destination": {
                        "airport_code": leg.get("DestinationCode"),
                        "airport_name_en": leg.get("DestinationAirport"),
                        "airport_name_fa": None,
                        "city_code": leg.get("DestinationCode"),
                        "city_name_en": None,
                        "city_name_fa": leg.get("Destination"),
                        "terminal": leg.get("ArrivalTerminal")
                    }
                },
                
                "schedule": {
                    "departure_datetime": leg.get("DepartureTime"),
                    "arrival_datetime": leg.get("ArrivalTime"),
                    "departure_date_jalali": f"{leg.get('DepartureWeekDay')} {leg.get('DepartureDateString')}",
                    "arrival_date_jalali": None,
                    "duration_minutes": cls._parse_duration(leg.get("JourneyTime")),
                    "stops": leg.get("Stops", 0),
                    "connection_time_minutes": None
                },
                
                "pricing": {
                    "adult": {
                        "base_fare": passenger_fares.get("ADL", {}).get("TotalFare", 0),
                        "total_fare": passenger_fares.get("ADL", {}).get("TotalFare", 0),
                        "taxes": None,
                        "service_charge": None,
                        "commission": None
                    },
                    "child": {
                        "base_fare": passenger_fares.get("CHD", {}).get("TotalFare", 0),
                        "total_fare": passenger_fares.get("CHD", {}).get("TotalFare", 0),
                        "taxes": None,
                        "service_charge": None,
                        "commission": None
                    },
                    "infant": {
                        "base_fare": passenger_fares.get("INF", {}).get("TotalFare", 0),
                        "total_fare": passenger_fares.get("INF", {}).get("TotalFare", 0),
                        "taxes": None,
                        "service_charge": None,
                        "commission": None
                    },
                    "currency": "IRR"
                },
                
                "cabin": {
                    "class": cls.normalize_cabin_class(price.get("CabinClass", "Economy")),
                    "class_display_name_fa": price.get("CabinClassDisplayName", "اکونومی"),
                    "booking_class": price.get("BookingClass")
                },
                
                "ticket_info": {
                    "type": TicketType.CHARTER if price.get("IsCharter") else TicketType.SYSTEM,
                    "is_charter": price.get("IsCharter", False),
                    "is_refundable": True,  # Based on fare rules
                    "is_domestic": True,
                    "capacity": price.get("Capacity", 0),
                    "reservable": True,
                    "requires_passport": None
                },
                
                "baggage": {
                    "checked": {
                        "adult_kg": price.get("Baggage"),
                        "child_kg": price.get("Baggage"),
                        "infant_kg": 10,
                        "pieces": None
                    },
                    "cabin": {
                        "kg": None,
                        "pieces": None
                    }
                },
                
                "policies": {
                    "cancellation_rules": cls._parse_cancellation_terms(price.get("CancellationTernEntities", [])),
                    "fare_rules": price.get("FareRules"),
                    "terms": price.get("ExtraTerms")
                },
                
                "additional_info": {
                    "promoted": False,
                    "discount_percent": None,
                    "special_offers": [offer.get("Title") for offer in price.get("FlightSpecialOffers", [])],
                    "tags": [],
                    "rating": None
                },
                
                "providers": [],
                
                "metadata": {
                    "scraped_at": datetime.now().isoformat(),
                    "original_id": mrbilit_flight.get("Id"),
                    "proposal_id": price.get("ProposalId"),
                    "search_id": None
                }
            }
            
            unified_flights.append(unified_flight)
        
        return unified_flights
    
    @staticmethod
    def _parse_duration(journey_time: str) -> int:
        """Parse duration string like '01:00:00' to minutes"""
        try:
            hours, minutes, seconds = map(int, journey_time.split(':'))
            return hours * 60 + minutes
        except:
            return 0
    
    @staticmethod
    def _parse_cancellation_terms(terms: List[Dict]) -> List[Dict[str, Any]]:
        """Parse MrBilit cancellation terms"""
        return [
            {
                "time_period": f"From {term.get('FromTime', 'start')} to {term.get('ToTime', 'end')}",
                "refund_percentage": 100 - term.get("Percent", 0),
                "penalty_percentage": term.get("Percent", 0)
            }
            for term in terms
        ]


# ============================================================================
# CONVERTER: SAFARMARKET
# ============================================================================

class SafarMarketConverter:
    """Convert SafarMarket flight data to unified format"""
    
    @staticmethod
    def normalize_cabin_class(flight_class: str) -> str:
        """Normalize SafarMarket flight class"""
        mapping = {
            "ECONOMY": CabinClass.ECONOMY,
            "BUSINESS": CabinClass.BUSINESS,
            "FIRST": CabinClass.FIRST
        }
        return mapping.get(flight_class, CabinClass.ECONOMY)
    
    @classmethod
    def convert(cls, safarmarket_flight: Dict[str, Any]) -> Dict[str, Any]:
        """Convert SafarMarket flight to unified format"""
        leave = safarmarket_flight.get("leave", {})
        legs = leave.get("legs", [{}])
        leg = legs[0] if legs else {}
        price_types = leave.get("priceTypes", {})
        providers = safarmarket_flight.get("providers", [])
        
        # Get best provider (lowest price)
        best_provider = min(providers, key=lambda p: p.get("price", float('inf'))) if providers else {}
        
        # Generate flight IDs
        departure_time = leg.get("departureTime", "").split(" ")[1] if " " in leg.get("departureTime", "") else ""
        
        # Extract airline code (SafarMarket sometimes doesn't provide it)
        airline_code = leave.get("airlineCode", "")
        flight_no = leave.get("flightNo", "")
        
        # Fallback: If airline_code is missing, try to extract from flight_no
        if not airline_code and flight_no:
            match = re.match(r'^([A-Z0-9]*[A-Z][A-Z0-9]*)(\d+)$', str(flight_no).upper())
            if match:
                code = match.group(1)
                if 2 <= len(code) <= 4:
                    airline_code = code
        
        # Clean flight number using utility function
        clean_flight_num = FlightIDGenerator.clean_flight_number(
            flight_no,
            airline_code
        )
        
        base_flight_id = FlightIDGenerator.generate_base_id(
            origin=leg.get("departureAirportCode", ""),
            destination=leg.get("arrivalAirportCode", ""),
            departure_date=leg.get("departureTime", ""),
            airline_code=airline_code,
            flight_number=clean_flight_num,
            departure_time=departure_time
        )
        
        flight_id = FlightIDGenerator.generate(
            origin=leg.get("departureAirportCode", ""),
            destination=leg.get("arrivalAirportCode", ""),
            departure_date=leg.get("departureTime", ""),
            airline_code=airline_code,
            flight_number=clean_flight_num,
            cabin_class=leg.get("flightType", "ECONOMY")[:1],  # First letter
            cabin_type=safarmarket_flight.get("flightClass", "ECONOMY"),
            is_charter=leave.get("sellType") == "CHARTER",
            adult_price=best_provider.get("price", 0),
            departure_time=departure_time
        )
        
        return {
            "base_flight_id": base_flight_id,
            "flight_id": flight_id,
            "provider_source": "safarmarket",
            "original_id": safarmarket_flight.get("flightId"),
            
            "flight_number": clean_flight_num,
            "airline": {
                "code": airline_code,
                "name_en": leave.get("airlineName"),
                "name_fa": leave.get("airlineNameFa"),
                "logo_url": leave.get("airlineLogo")
            },
            "operating_airline": {
                "code": None,
                "name_en": None,
                "name_fa": None
            },
            "aircraft": {
                "type": leg.get("airPlaneType"),
                "code": None
            },
            
            "route": {
                "origin": {
                    "airport_code": leg.get("departureAirportCode"),
                    "airport_name_en": leg.get("departureAirport"),
                    "airport_name_fa": None,
                    "city_code": leg.get("departureAirportCode"),
                    "city_name_en": leg.get("departureCityName"),
                    "city_name_fa": leg.get("departureCityNamePersian"),
                    "terminal": None
                },
                "destination": {
                    "airport_code": leg.get("arrivalAirportCode"),
                    "airport_name_en": leg.get("arrivalAirport"),
                    "airport_name_fa": None,
                    "city_code": leg.get("arrivalAirportCode"),
                    "city_name_en": leg.get("arrivalCityName"),
                    "city_name_fa": leg.get("arrivalCityNamePersian"),
                    "terminal": None
                }
            },
            
            "schedule": {
                "departure_datetime": leave.get("departureTime"),
                "arrival_datetime": leave.get("arrivalTime"),
                "departure_date_jalali": None,
                "arrival_date_jalali": None,
                "duration_minutes": leave.get("duration", 0),
                "stops": leave.get("stopsCount", 0),
                "connection_time_minutes": leg.get("waitDuration")
            },
            
            "pricing": {
                "adult": {
                    "base_fare": price_types.get("adultPrice", 0),
                    "total_fare": price_types.get("adultPrice", 0),
                    "taxes": None,
                    "service_charge": None,
                    "commission": None
                },
                "child": {
                    "base_fare": price_types.get("childPrice", 0),
                    "total_fare": price_types.get("childPrice", 0),
                    "taxes": None,
                    "service_charge": None,
                    "commission": None
                },
                "infant": {
                    "base_fare": price_types.get("infantPrice", 0),
                    "total_fare": price_types.get("infantPrice", 0),
                    "taxes": None,
                    "service_charge": None,
                    "commission": None
                },
                "currency": "IRR"
            },
            
            "cabin": {
                "class": cls.normalize_cabin_class(safarmarket_flight.get("flightClass", "ECONOMY")),
                "class_display_name_fa": "اکونومی" if safarmarket_flight.get("flightClass") == "ECONOMY" else "بیزینس",
                "booking_class": None
            },
            
            "ticket_info": {
                "type": TicketType.CHARTER if leave.get("charter") else TicketType.SYSTEM,
                "is_charter": leave.get("charter", False),
                "is_refundable": True,
                "is_domestic": True,
                "capacity": safarmarket_flight.get("capacity", 0),
                "reservable": safarmarket_flight.get("reservable", True),
                "requires_passport": None
            },
            
            "baggage": {
                "checked": cls._extract_baggage(best_provider.get("outBoundBaggages", [])),
                "cabin": {
                    "kg": None,
                    "pieces": None
                }
            },
            
            "policies": {
                "cancellation_rules": cls._parse_cancellation_policies(
                    leave.get("cancellationPolicies") or best_provider.get("outBoundCancellationPolicies", [])
                ),
                "fare_rules": None,
                "terms": None
            },
            
            "additional_info": {
                "promoted": safarmarket_flight.get("promote", False),
                "discount_percent": safarmarket_flight.get("discountPercent"),
                "special_offers": [],
                "tags": safarmarket_flight.get("tags", []),
                "rating": None
            },
            
            "providers": cls._convert_providers(providers),
            
            "metadata": {
                "scraped_at": datetime.now().isoformat(),
                "original_id": safarmarket_flight.get("flightId"),
                "proposal_id": None,
                "search_id": None
            }
        }
    
    @staticmethod
    def _extract_baggage(baggages) -> Dict[str, Any]:
        """Extract baggage information"""
        if not baggages or not isinstance(baggages, list):
            return {
                "adult_kg": None,
                "child_kg": None,
                "infant_kg": None,
                "pieces": None
            }
        baggage_map = {item.get("passengerType"): item for item in baggages}
        return {
            "adult_kg": int(baggage_map.get("ADULT", {}).get("weightKg", 0) or 0) or None,
            "child_kg": int(baggage_map.get("CHILD", {}).get("weightKg", 0) or 0) or None,
            "infant_kg": int(baggage_map.get("INFANT", {}).get("weightKg", 0) or 0) or None,
            "pieces": baggage_map.get("ADULT", {}).get("pieces")
        }
    
    @staticmethod
    def _parse_cancellation_policies(policies) -> List[Dict[str, Any]]:
        """Parse cancellation policies"""
        if not policies or not isinstance(policies, list):
            return []
        return [
            {
                "policy_code": policy.get("policy"),
                "description": policy.get("description"),
                "refund_percentage": None,
                "penalty_percentage": None
            }
            for policy in policies
        ]
    
    @staticmethod
    def _convert_providers(providers: List[Dict]) -> List[Dict[str, Any]]:
        """Convert provider information"""
        return [
            {
                "provider_id": provider.get("id"),
                "provider_name": provider.get("title"),
                "provider_name_en": provider.get("titleEn"),
                "price": provider.get("price"),
                "old_price": provider.get("oldPrice"),
                "capacity": provider.get("capacity"),
                "logo_url": provider.get("logo"),
                "booking_url": provider.get("url")
            }
            for provider in providers
        ]


# ============================================================================
# CONVERTER: SAFAR366
# ============================================================================

class Safar366Converter:
    """Convert Safar366 flight data to unified format"""
    
    @staticmethod
    def normalize_cabin_class(cabin_code: str) -> str:
        """Normalize Safar366 cabin class"""
        mapping = {
            "Economy": CabinClass.ECONOMY,
            "Business": CabinClass.BUSINESS,
            "First": CabinClass.FIRST
        }
        return mapping.get(cabin_code, CabinClass.ECONOMY)
    
    @classmethod
    def convert(cls, safar366_flight: Dict[str, Any]) -> Dict[str, Any]:
        """Convert Safar366 flight to unified format"""
        origin_dest_info = safar366_flight.get("OriginDestinationInformation", {})
        options = origin_dest_info.get("OriginDestinationOption", [])
        option = options[0] if options else {}
        
        segments = option.get("FlightSegment", [])
        segment = segments[0] if segments else {}
        
        pricing_info = safar366_flight.get("AirItineraryPricingInfo", {})
        fare_breakdowns = pricing_info.get("PTC_FareBreakdowns", [])
        
        passenger_fares = {fb.get("PassengerTypeQuantity", {}).get("Code"): fb for fb in fare_breakdowns}
        
        tpa_ext = option.get("TPA_Extensions", {})
        segment_tpa = segment.get("TPA_Extensions", {})
        
        adult_fare = passenger_fares.get("ADT", {}).get("PassengerFare", {})
        
        # Generate flight IDs
        departure_time = segment.get("DepartureDateTime", "").split("T")[1][:5] if "T" in segment.get("DepartureDateTime", "") else ""
        
        # Clean flight number
        clean_flight_num = FlightIDGenerator.clean_flight_number(
            str(segment.get("FlightNumber", "")),
            segment.get("MarketingAirline", {}).get("Code", "")
        )
        
        base_flight_id = FlightIDGenerator.generate_base_id(
            origin=segment.get("DepartureAirport", {}).get("LocationCode", ""),
            destination=segment.get("ArrivalAirport", {}).get("LocationCode", ""),
            departure_date=segment.get("DepartureDateTime", "") or option.get("FlightDate", ""),
            airline_code=segment.get("MarketingAirline", {}).get("Code", ""),
            flight_number=clean_flight_num,
            departure_time=departure_time
        )
        
        flight_id = FlightIDGenerator.generate(
            origin=segment.get("DepartureAirport", {}).get("LocationCode", ""),
            destination=segment.get("ArrivalAirport", {}).get("LocationCode", ""),
            departure_date=segment.get("DepartureDateTime", "") or option.get("FlightDate", ""),
            airline_code=segment.get("MarketingAirline", {}).get("Code", ""),
            flight_number=clean_flight_num,
            cabin_class=segment.get("ResBookDesigCode", "Y"),
            cabin_type=segment.get("MarketingCabin", {}).get("Name", "Economy"),
            is_charter=segment_tpa.get("FlightType") == "Charter",
            adult_price=adult_fare.get("TotalFare", 0),
            departure_time=departure_time
        )
        
        return {
            "base_flight_id": base_flight_id,
            "flight_id": flight_id,
            "provider_source": "safar366",
            "original_id": segment_tpa.get("UniqueId"),
            
            "flight_number": clean_flight_num,
            "airline": {
                "code": segment.get("MarketingAirline", {}).get("Code"),
                "name_en": segment.get("MarketingAirline", {}).get("CompanyShortName"),
                "name_fa": segment_tpa.get("AirlineNameFa"),
                "logo_url": None
            },
            "operating_airline": {
                "code": segment.get("OperatingAirline", {}).get("Code"),
                "name_en": segment.get("OperatingAirline", {}).get("CompanyShortName"),
                "name_fa": None
            },
            "aircraft": {
                "type": segment.get("Equipment", {}).get("AirEquipType"),
                "code": segment.get("Equipment", {}).get("AircraftTailNumber")
            },
            
            "route": {
                "origin": {
                    "airport_code": segment.get("DepartureAirport", {}).get("LocationCode"),
                    "airport_name_en": segment.get("DepartureAirport", {}).get("AirportName"),
                    "airport_name_fa": None,
                    "city_code": option.get("OriginLocation"),
                    "city_name_en": segment_tpa.get("Origin") or tpa_ext.get("Origin"),
                    "city_name_fa": segment_tpa.get("OriginFa") or tpa_ext.get("OriginFa"),
                    "terminal": segment.get("DepartureAirport", {}).get("Terminal")
                },
                "destination": {
                    "airport_code": segment.get("ArrivalAirport", {}).get("LocationCode"),
                    "airport_name_en": segment.get("ArrivalAirport", {}).get("AirportName"),
                    "airport_name_fa": None,
                    "city_code": option.get("DestinationLocation"),
                    "city_name_en": segment_tpa.get("Destination") or tpa_ext.get("Destination"),
                    "city_name_fa": segment_tpa.get("DestinationFa") or tpa_ext.get("DestinationFa"),
                    "terminal": segment.get("ArrivalAirport", {}).get("Terminal")
                }
            },
            
            "schedule": {
                "departure_datetime": segment.get("DepartureDateTime"),
                "arrival_datetime": segment.get("ArrivalDateTime"),
                "departure_date_jalali": segment_tpa.get("DepartureDateJ") or option.get("DepartureDateJ"),
                "arrival_date_jalali": segment_tpa.get("ArrivalDateJ") or option.get("ArrivalDateJ"),
                "duration_minutes": segment.get("JourneyDurationPerMinute") or option.get("JourneyDurationPerMinute", 0),
                "stops": tpa_ext.get("stop") or tpa_ext.get("Stop", 0),
                "connection_time_minutes": segment.get("ConnectionTimePerMinute")
            },
            
            "pricing": cls._extract_pricing(passenger_fares),
            
            "cabin": {
                "class": cls.normalize_cabin_class(segment.get("CabinClassCode", "Economy")),
                "class_display_name_fa": segment.get("TPA_Extensions", {}).get("CabinClassNameFa", "اکونومی"),
                "booking_class": segment.get("ResBookDesigCode")
            },
            
            "ticket_info": {
                "type": TicketType.CHARTER if tpa_ext.get("IsCharter") else TicketType.SYSTEM,
                "is_charter": tpa_ext.get("IsCharter", False),
                "is_refundable": True,
                "is_domestic": not tpa_ext.get("IsForeign", False),
                "capacity": int(segment.get("SeatsRemaining") or 0) if segment.get("SeatsRemaining") else 0,
                "reservable": not tpa_ext.get("IsLock", False),
                "requires_passport": tpa_ext.get("IsNationalIdOptional") == 0
            },
            
            "baggage": {
                "checked": {
                    "adult_kg": segment.get("MarketingCabin", {}).get("BaggageAllowance", {}).get("UnitOfMeasureQuantity"),
                    "child_kg": segment.get("MarketingCabin", {}).get("BaggageAllowance", {}).get("UnitOfMeasureQuantity"),
                    "infant_kg": 10,
                    "pieces": None
                },
                "cabin": {
                    "kg": segment_tpa.get("CabinBaggage"),
                    "pieces": None
                }
            },
            
            "policies": {
                "cancellation_rules": [],  # Not provided in this format
                "fare_rules": segment_tpa.get("Rule"),
                "terms": segment.get("Comment")
            },
            
            "additional_info": {
                "promoted": False,
                "discount_percent": None,
                "special_offers": [],
                "tags": [],
                "rating": None
            },
            
            "providers": [],
            
            "metadata": {
                "scraped_at": datetime.now().isoformat(),
                "original_id": segment_tpa.get("FlightId"),
                "proposal_id": segment.get("BookingClassAvail", {}).get("ResBookDesigCode"),
                "search_id": safar366_flight.get("AirItinerary", [{}])[0].get("SessionId")
            }
        }
    
    @staticmethod
    def _extract_pricing(passenger_fares: Dict[str, Dict]) -> Dict[str, Any]:
        """Extract pricing from passenger fare breakdowns"""
        def get_fare(code: str) -> Dict[str, int]:
            fare = passenger_fares.get(code, {}).get("PassengerFare", {})
            return {
                "base_fare": fare.get("BaseFare", 0),
                "total_fare": fare.get("TotalFare", 0),
                "taxes": fare.get("Taxes"),
                "service_charge": fare.get("ServiceTax"),
                "commission": fare.get("Commission")
            }
        
        return {
            "adult": get_fare("ADT"),
            "child": get_fare("CHD"),
            "infant": get_fare("INF"),
            "currency": "IRR"
        }


# ============================================================================
# MAIN CONVERTER FACTORY
# ============================================================================

class FlightDataConverter:
    """Main converter factory for all scrapers"""
    
    @staticmethod
    def convert_alibaba(data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Convert Alibaba response to unified format"""
        flights = data.get("result", {}).get("departing", [])
        return [AlibabaConverter.convert(flight) for flight in flights]
    
    @staticmethod
    def convert_mrbilit(data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Convert MrBilit response to unified format"""
        flights = data.get("Flights", [])
        unified_flights = []
        for flight in flights:
            unified_flights.extend(MrBilitConverter.convert(flight))
        return unified_flights
    
    @staticmethod
    def convert_safarmarket(data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Convert SafarMarket response to unified format"""
        flights = data.get("result", {}).get("flights", [])
        return [SafarMarketConverter.convert(flight) for flight in flights]
    
    @staticmethod
    def convert_safar366(data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Convert Safar366 response to unified format"""
        flights = data.get("Items", [])
        return [Safar366Converter.convert(flight) for flight in flights]
    
    @staticmethod
    def convert_all(scraper_name: str, raw_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Convert any scraper data to unified format
        
        Args:
            scraper_name: Name of the scraper ('alibaba', 'mrbilit', 'safarmarket', 'safar366')
            raw_data: Raw JSON data from the scraper
            
        Returns:
            List of flights in unified format
        """
        converters = {
            'alibaba': FlightDataConverter.convert_alibaba,
            'mrbilit': FlightDataConverter.convert_mrbilit,
            'safarmarket': FlightDataConverter.convert_safarmarket,
            'safar366': FlightDataConverter.convert_safar366
        }
        
        converter = converters.get(scraper_name.lower())
        if not converter:
            raise ValueError(f"Unknown scraper: {scraper_name}")
        
        return converter(raw_data)


# ============================================================================
# USAGE EXAMPLE
# ============================================================================

if __name__ == "__main__":
    # Example usage
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python unified_converter.py <scraper_name> <input_file> [output_file]")
        print("Example: python unified_converter.py alibaba alibaba_raw_2025-12-15.json unified_alibaba.json")
        sys.exit(1)
    
    scraper_name = sys.argv[1]
    input_file = sys.argv[2]
    output_file = sys.argv[3] if len(sys.argv) > 3 else f"unified_{scraper_name}.json"
    
    # Load raw data
    with open(input_file, 'r', encoding='utf-8') as f:
        raw_data = json.load(f)
    
    # Convert to unified format
    unified_flights = FlightDataConverter.convert_all(scraper_name, raw_data)
    
    # Save unified data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unified_flights, f, ensure_ascii=False, indent=2)
    
    print(f"✓ Converted {len(unified_flights)} flights from {scraper_name}")
    print(f"✓ Saved to {output_file}")
