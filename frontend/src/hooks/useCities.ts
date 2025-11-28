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

    const seen = new Set();
    filteredList = filteredList?.filter((item: City) => {
      if (seen.has(item.iata_code)) return false;
      seen.add(item.iata_code);
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
