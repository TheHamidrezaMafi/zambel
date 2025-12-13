import { fetchCities } from '@/services/cities';
import { useEffect, useState } from 'react';

type City = {
  id: number;
  iata_code: string;
  icao_code: string;
  persian_name: string;
  country_code: string;
  english_name: string;
  featured: boolean;
};

export const useCities = (flightDirection: string) => {
  const [list, setList] = useState([]);
  const [data, setData] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    fetchCities().then((response) => {
      setList(response?.data);
    });
  }, []);

  useEffect(() => {
    let filteredList = list;
    if (flightDirection === 'domestic')
      filteredList = list?.filter((city: City) => city.country_code === 'IR');
    else if (flightDirection === 'international')
      filteredList = list?.filter((city: City) => city.country_code !== 'IR');

    // Deduplicate by city name (not airport code) to avoid showing Tehran twice
    const seenCities = new Map();
    filteredList = filteredList?.filter((item: City) => {
      const cityKey = item.persian_name + '_' + item.country_code;
      if (seenCities.has(cityKey)) {
        // If duplicate city, prefer IKA over THR for Tehran
        const existing = seenCities.get(cityKey);
        if (item.iata_code === 'IKA' && existing === 'THR') {
          seenCities.set(cityKey, item.iata_code);
          return true;
        }
        return false;
      }
      seenCities.set(cityKey, item.iata_code);
      return true;
    });

    const formattedData = filteredList?.map((city: City) => ({
      value: city.iata_code,
      label: city.persian_name,
    }));
    setData(formattedData);
  }, [flightDirection, list?.length]);

  return {
    data,
  };
};
