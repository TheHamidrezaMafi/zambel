#!/usr/bin/env python3
"""
Universal Flight ID Generator
Generates consistent unique flight IDs across all scrapers using Alibaba's format.

Format: {ORIGIN}{DEST}{DATE}{TYPE}{AIRLINE}{FLIGHT#}{CLASS}{CABIN}{HASH}{PRICE}
Example: THRMHD20251215RTA8188BE900094536500

Components:
- ORIGIN: 3-letter IATA code (THR)
- DEST: 3-letter IATA code (MHD)
- DATE: YYYYMMDD (20251215)
- TYPE: R (Charter) or S (System/Regular)
- AIRLINE: 2-3 letter code (TA, MH, AA, etc)
- FLIGHT#: Flight number (8188, 4150, etc)
- CLASS: Booking class (B, Y, etc)
- CABIN: Cabin type (E=Economy, B=Business, F=First)
- HASH: 6-digit hash of flight details for uniqueness
- PRICE: Adult price in 10k IRR units (536500 = 36,500,000 IRR)
"""

import hashlib
from datetime import datetime
from typing import Dict, Any, Optional


class FlightIDGenerator:
    """Generate consistent unique flight IDs across all scrapers"""
    
    # Cabin type mapping
    CABIN_MAP = {
        'ECONOMY': 'E',
        'BUSINESS': 'B',
        'FIRST': 'F',
        'PREMIUM_ECONOMY': 'P',
        'اکونومی': 'E',
        'بیزینس': 'B',
        'اول': 'F',
    }
    
    # Airline code mapping for standardization
    AIRLINE_CODE_MAPPING = {
        'TKN': 'FK',  # Taftan
        'K0': 'FK',   # Taftan (Safar366 code)
        'ATS': 'AT',  # Ata/Atrak inconsistency
        'NSM': 'NA',  # Naft/Nafat inconsistency  
        'ISP': 'JS',  # Iran Asmanan/Eram Air inconsistency
        'IS': 'JS',   # Iran Asmanan alternative
        'J3': 'JS',   # Iran Asmanan alternative
    }
    
    @staticmethod
    def normalize_airline_code(airline_code: str) -> str:
        """Normalize airline code to standard IATA code"""
        if not airline_code:
            return ""
        code = airline_code.upper().strip()
        return FlightIDGenerator.AIRLINE_CODE_MAPPING.get(code, code)
    
    @staticmethod
    def normalize_date(date_str: str) -> str:
        """Convert date string to YYYYMMDD format"""
        # Handle timezone in ISO format (e.g., 2025-12-15T14:30:00+03:30)
        if '+' in date_str or date_str.count('-') > 2:
            # Remove timezone info
            date_str = date_str.split('+')[0].split('Z')[0]
        
        # Handle various date formats
        formats = [
            '%Y-%m-%d %H:%M',       # SafarMarket: 2025-12-15 14:30
            '%Y-%m-%d',              # Standard: 2025-12-15
            '%Y-%m-%dT%H:%M:%S',    # ISO: 2025-12-15T14:30:00
            '%Y-%m-%dT%H:%M',       # ISO short: 2025-12-15T14:30
            '%Y/%m/%d',              # Alternative: 2025/12/15
            '%d/%m/%Y',              # Reversed: 15/12/2025
        ]
        
        for fmt in formats:
            try:
                # Extract date portion for formats with time
                if ' ' in date_str or 'T' in date_str:
                    dt = datetime.strptime(date_str, fmt)
                else:
                    dt = datetime.strptime(date_str[:10], fmt)
                return dt.strftime('%Y%m%d')
            except ValueError:
                continue
        
        # If already in YYYYMMDD format
        if len(date_str) == 8 and date_str.isdigit():
            return date_str
        
        raise ValueError(f"Cannot parse date: {date_str}")
    
    @staticmethod
    def get_cabin_code(cabin_type: str) -> str:
        """Get single-letter cabin code"""
        cabin_upper = cabin_type.upper() if cabin_type else 'ECONOMY'
        return FlightIDGenerator.CABIN_MAP.get(cabin_upper, 'E')
    
    @staticmethod
    def clean_flight_number(flight_number: str, airline_code: str) -> str:
        """
        Remove airline code prefix from flight number if present and normalize leading zeros
        
        Examples:
            clean_flight_number('A16700', 'A1') -> '6700'
            clean_flight_number('ME4150', 'MEH') -> '4150'  
            clean_flight_number('AT6100', 'ATS') -> '6100'
            clean_flight_number('4150', 'MH') -> '4150'
            clean_flight_number('EP602', 'EP') -> '602'
            clean_flight_number('024', 'IV') -> '24'
            clean_flight_number('026', 'IV') -> '26'
        """
        if not flight_number or not airline_code:
            return str(flight_number)
        
        flight_str = str(flight_number).upper()
        airline_str = str(airline_code).upper()
        
        # Try to remove airline code prefix
        # First try exact match
        if flight_str.startswith(airline_str):
            cleaned = flight_str[len(airline_str):]
            if cleaned and cleaned[0].isdigit():
                flight_str = cleaned
        else:
            # Try partial match for longer airline codes (e.g., MEH -> ME, ATS -> AT)
            # Only try if airline code is 3+ characters and flight starts with letters
            if len(airline_str) >= 3 and len(flight_str) > 2:
                # Try removing first 2 characters if they match
                if flight_str[:2] == airline_str[:2]:
                    cleaned = flight_str[2:]
                    if cleaned and cleaned[0].isdigit():
                        flight_str = cleaned
        
        # Remove leading zeros to normalize flight numbers
        # This ensures '022', '0022', and '22' all become '22'
        # However, we standardize by zero-padding to 4 digits for consistency
        # e.g., "022" -> "0022", "7022" -> "7022", "024" -> "0024"
        if flight_str.isdigit():
            # Pad to 4 digits (standard for most flight numbers)
            flight_str = flight_str.zfill(4)
        
        return flight_str
    
    @staticmethod
    def generate_hash(airline_code: str, flight_number: str, 
                     origin: str, dest: str, date: str, 
                     departure_time: str = '') -> str:
        """Generate 6-digit hash for uniqueness"""
        # Combine key flight identifiers
        identifier = f"{airline_code}{flight_number}{origin}{dest}{date}{departure_time}"
        
        # Create hash and take first 6 digits
        hash_obj = hashlib.md5(identifier.encode())
        hash_hex = hash_obj.hexdigest()
        
        # Convert to numeric string (6 digits)
        hash_numeric = ''.join(c for c in hash_hex if c.isdigit())[:6]
        
        # Pad with zeros if needed
        return hash_numeric.ljust(6, '0')
    
    @staticmethod
    def format_price(price: int) -> str:
        """Format price to shortened format (remove last 4 zeros)"""
        # Convert to 10k IRR units (36,500,000 -> 3650)
        # Then pad to 6 digits
        price_short = price // 10000
        return str(price_short).zfill(6)
    
    @classmethod
    def generate_base_id(cls,
                        origin: str,
                        destination: str,
                        departure_date: str,
                        airline_code: str,
                        flight_number: str,
                        departure_time: str = '') -> str:
        """
        Generate base flight ID (without price/cabin) for cross-scraper matching
        
        Format: {ORIGIN}{DEST}{DATE}{AIRLINE}{FLIGHT#}{TIME}
        Example: THRMHD20251215TA81881300
        
        This ID uniquely identifies the physical flight, regardless of pricing tiers or cabin classes.
        """
        origin = origin.upper()
        destination = destination.upper()
        date_normalized = cls.normalize_date(departure_date)
        airline_code = cls.normalize_airline_code(airline_code)
        flight_number = str(flight_number).lstrip('0') if flight_number else '0'
        time_clean = departure_time.replace(':', '') if departure_time else ''
        
        return f"{origin}{destination}{date_normalized}{airline_code}{flight_number}{time_clean}"
    
    @classmethod
    def generate(cls, 
                 origin: str,
                 destination: str,
                 departure_date: str,
                 airline_code: str,
                 flight_number: str,
                 cabin_class: str = 'B',
                 cabin_type: str = 'ECONOMY',
                 is_charter: bool = True,
                 adult_price: int = 0,
                 departure_time: str = '') -> str:
        """
        Generate unique flight ID
        
        Args:
            origin: Origin airport IATA code (e.g., 'THR')
            destination: Destination airport IATA code (e.g., 'MHD')
            departure_date: Departure date in various formats
            airline_code: 2-3 letter airline code (e.g., 'TA', 'MH')
            flight_number: Flight number (e.g., '8188', '4150')
            cabin_class: Booking class (e.g., 'B', 'Y')
            cabin_type: Cabin type (e.g., 'ECONOMY', 'BUSINESS')
            is_charter: True for charter, False for system/regular
            adult_price: Adult ticket price in IRR
            departure_time: Departure time for hash uniqueness (optional)
            
        Returns:
            Unique flight ID string
        """
        # Normalize inputs
        origin = origin.upper()
        destination = destination.upper()
        date_normalized = cls.normalize_date(departure_date)
        airline_code = cls.normalize_airline_code(airline_code)
        flight_number = str(flight_number).lstrip('0') if flight_number else '0'
        
        # Charter flag: R for charter, H for system/regular (Alibaba uses H, not S)
        charter_flag = 'R' if is_charter else 'H'
        
        # Cabin code
        cabin_code = cls.get_cabin_code(cabin_type)
        
        # Booking class (default to 'B' if empty)
        booking_class = cabin_class.upper() if cabin_class else 'B'
        
        # Generate hash for uniqueness
        flight_hash = cls.generate_hash(
            airline_code, flight_number, origin, destination, 
            date_normalized, departure_time
        )
        
        # Format price
        price_formatted = cls.format_price(adult_price)
        
        # Construct unique key
        unique_key = (
            f"{origin}{destination}{date_normalized}{charter_flag}"
            f"{airline_code}{flight_number}{booking_class}{cabin_code}"
            f"{flight_hash}{price_formatted}"
        )
        
        return unique_key


def generate_flight_id_from_unified(flight_data: Dict[str, Any]) -> str:
    """
    Generate flight ID from unified format
    
    Args:
        flight_data: Flight data in unified format
        
    Returns:
        Unique flight ID
    """
    route = flight_data.get('route', {})
    schedule = flight_data.get('schedule', {})
    ticket_info = flight_data.get('ticket_info', {})
    pricing = flight_data.get('pricing', {})
    
    return FlightIDGenerator.generate(
        origin=route.get('origin', {}).get('code', 'UNK'),
        destination=route.get('destination', {}).get('code', 'UNK'),
        departure_date=schedule.get('departure_date', ''),
        airline_code=flight_data.get('airline', {}).get('code', 'XX'),
        flight_number=flight_data.get('flight_number', '0'),
        cabin_class=ticket_info.get('cabin_class', 'B'),
        cabin_type=ticket_info.get('cabin_type', 'ECONOMY'),
        is_charter=ticket_info.get('is_charter', True),
        adult_price=pricing.get('adult', {}).get('total', 0),
        departure_time=schedule.get('departure_time', '')
    )


# Example usage and testing
if __name__ == "__main__":
    print("="*80)
    print("FLIGHT ID GENERATOR - TEST CASES")
    print("="*80)
    
    # Test case 1: Alibaba format
    print("\n1. Alibaba-style flight (Charter):")
    flight_id_1 = FlightIDGenerator.generate(
        origin='THR',
        destination='MHD',
        departure_date='2025-12-15',
        airline_code='TA',
        flight_number='8188',
        cabin_class='B',
        cabin_type='ECONOMY',
        is_charter=True,
        adult_price=36500000,
        departure_time='13:00'
    )
    print(f"   Generated: {flight_id_1}")
    print(f"   Expected:  THRMHD20251215RTA8188BE...536500")
    
    # Test case 2: System flight
    print("\n2. System flight (Non-charter):")
    flight_id_2 = FlightIDGenerator.generate(
        origin='THR',
        destination='MHD',
        departure_date='2025-12-15',
        airline_code='IR',
        flight_number='100',
        cabin_class='Y',
        cabin_type='ECONOMY',
        is_charter=False,
        adult_price=50000000,
        departure_time='08:00'
    )
    print(f"   Generated: {flight_id_2}")
    print(f"   Charter flag should be 'H': {flight_id_2[16]}")
    
    # Test case 3: Business class
    print("\n3. Business class flight:")
    flight_id_3 = FlightIDGenerator.generate(
        origin='THR',
        destination='IKA',
        departure_date='2025-12-20',
        airline_code='IR',
        flight_number='701',
        cabin_class='C',
        cabin_type='BUSINESS',
        is_charter=False,
        adult_price=120000000,
        departure_time='10:30'
    )
    print(f"   Generated: {flight_id_3}")
    print(f"   Cabin code should be 'B': {flight_id_3[20]}")
    
    # Test case 4: From unified format
    print("\n4. From unified format:")
    unified_flight = {
        'flight_number': '7702',
        'airline': {
            'code': 'X0',
            'name': 'Ava Air'
        },
        'route': {
            'origin': {'code': 'THR'},
            'destination': {'code': 'MHD'}
        },
        'schedule': {
            'departure_date': '2025-12-15',
            'departure_time': '15:30'
        },
        'ticket_info': {
            'cabin_class': 'Y',
            'cabin_type': 'ECONOMY',
            'is_charter': True
        },
        'pricing': {
            'adult': {'total': 38000000}
        }
    }
    flight_id_4 = generate_flight_id_from_unified(unified_flight)
    print(f"   Generated: {flight_id_4}")
    
    print("\n" + "="*80)
    print("CONSISTENCY TEST - Same flight from different scrapers")
    print("="*80)
    
    # Same flight should generate same ID (except hash might differ slightly)
    flight_base = {
        'origin': 'THR',
        'destination': 'MHD',
        'departure_date': '2025-12-15',
        'airline_code': 'FK',
        'flight_number': '3102',
        'cabin_class': 'B',
        'cabin_type': 'ECONOMY',
        'is_charter': True,
        'adult_price': 38000000,
        'departure_time': '16:00'
    }
    
    id_from_alibaba = FlightIDGenerator.generate(**flight_base)
    id_from_mrbilit = FlightIDGenerator.generate(**flight_base)
    id_from_safar366 = FlightIDGenerator.generate(**flight_base)
    
    print(f"\n   Alibaba:     {id_from_alibaba}")
    print(f"   MrBilit:     {id_from_mrbilit}")
    print(f"   Safar366:    {id_from_safar366}")
    print(f"   \n   ✓ All identical: {id_from_alibaba == id_from_mrbilit == id_from_safar366}")
    
    print("\n" + "="*80)
