import { useState, useCallback, useRef, useEffect } from 'react';
import { fetchFlights } from '../services/flights';
import { useRouter } from 'next/router';
import { FlightData } from '@/types/flight-response';
import { normalizeAirlineName } from '@/helper/utils';

export const useFetchFlights = () => {
  const [data, setData] = useState<Array<FlightData>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const UUID = useRef(crypto.randomUUID());
  const { query } = useRouter();
  const {
    departureDate,
    returnDate,
    origin = '',
    destination = '',
    flightDirection = 'domestic',
  } = query ?? {};

  useEffect(() => {
    fetchData();
  }, [flightDirection, departureDate, returnDate, origin, destination]);

  const fetchData = useCallback(async () => {
    const _origin = Array.isArray(origin) ? origin[0] : origin;
    const _destination = Array.isArray(destination)
      ? destination[0]
      : destination;

    if (!departureDate || !_origin || !_destination) return;

    // Reset data when fetching new data
    setData([]);
    setIsLoading(true);
    UUID.current = crypto.randomUUID();

    const requests = [
      {
        requested_by_user_id: '1',
        from_date: departureDate,
        to_date: returnDate || "",
        from_destination: _origin,
        to_destination: _destination,
        is_foreign_flight: flightDirection === 'domestic' ? 'false' : 'true',
        uuid: UUID.current,
        type: '1',
      },
    ];
    const providers = [
      'alibaba',
      'flytoday',
      'mrbilit',
      'pateh',
      'safarmarket',
      'safar366',
    ];

    for (const provider of providers) {
      fetchFlights({ provider_name: provider, requests })
        .then((result) => {
          if (result) {
            // ... existing history logic ...
            const searchHistory = localStorage.getItem('searchHistory');
            let parsedHistory = searchHistory ? JSON.parse(searchHistory) : [];
            if (
              !parsedHistory.some(
                (item: any) =>
                  item.from_destination === origin &&
                  item.to_destination === destination &&
                  item.from_date === departureDate
              )
            ) {
              parsedHistory.unshift({
                from_destination: origin,
                to_destination: destination,
                from_date: departureDate,
                to_date: returnDate,
                is_domestic_flight: flightDirection === 'domestic',
              });
              const now = new Date();
              parsedHistory = parsedHistory.filter(
                (item: any) =>
                  new Date(item.from_date).setHours(23, 59, 59, 999) >=
                  now.getTime()
              );
              parsedHistory = parsedHistory.slice(0, 5);
              localStorage.setItem(
                'searchHistory',
                JSON.stringify(parsedHistory)
              );
            }

            setIsLoading(false);

            setData((prevData) => [
              ...prevData,
              ...result.map((flight: any) => ({
                ...flight,
                airline_name_fa: normalizeAirlineName(flight.airline_name_fa),
                id: crypto.randomUUID(),
              })),
            ]);
          }
        })
        .catch((err) => {
          console.error(`Error fetching ${provider}:`, err);
          setErrors(prev => [...prev, `${provider}: ${err.message}`]);
          if (isLoading) setIsLoading(false);
        });
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departureDate, destination, origin, returnDate]);

  return { data, isLoading, errors };
};
