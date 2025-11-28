import React, { useEffect, useState } from 'react';
import { ResultListProperties } from './types';
import CardsLoading from '../common/container/loading';
import noFlight from '@/assets/images/no-flight.json';
import noResult from '@/assets/images/NoResult-any.json';

import FlightCard from '../flight-card/flight-card';
import { useClearFilters, useFilterCount } from '@/hooks/useFilters';
import { useCities } from '@/hooks/useCities';
import GroupFlightCard from '../flight-card/group-flight-card';
import { useAirlines } from '@/hooks/useAirlines';
import { useRouter } from 'next/router';
import { normalizeAirlineName } from '@/helper/utils';

const ResultList = ({
  list,
  isLoading,
  unAvailableList,
  isUnavailable,
  setFlightsCount,
}: ResultListProperties) => {
  const [groupList, setGroupList] = useState<any>([]);
  const [LottieComponent, setLottieComponent] = useState<any>(null);

  const { query } = useRouter();
  const orderBy = (query.orderBy as string) || 'lowest_price';

  useEffect(() => {
    import('lottie-react').then((mod) => {
      setLottieComponent(() => mod.default);
    });
  }, []);

  // Normalize flight number client-side to handle any backend inconsistencies
  const normalizeFlightNumber = (flightNumber: string) => {
    if (!flightNumber) return flightNumber;
    
    // Step 1: Remove all letters
    const numericPart = flightNumber.replace(/[A-Za-z]/g, '');
    
    // Step 2: Remove leading zeros
    const withoutLeadingZeros = numericPart.replace(/^0+/, '') || '0';
    
    // Step 3: Handle 5-digit numbers (airline code + 4-digit flight number)
    if (withoutLeadingZeros.length === 5 && 
        withoutLeadingZeros[0] >= '1' && 
        withoutLeadingZeros[0] <= '9') {
      return withoutLeadingZeros.slice(1).replace(/^0+/, '') || '0';
    }
    
    // Step 4: Handle 4-digit numbers starting with 9 (B9 airline code)
    if (withoutLeadingZeros.length === 4 && 
        withoutLeadingZeros[0] === '9') {
      const result = withoutLeadingZeros.slice(1).replace(/^0+/, '') || '0';
      // Only use if result is 3 digits (valid flight number)
      if (result.length === 3) {
        return result;
      }
    }
    
    return withoutLeadingZeros;
  };

  const groupFlightsByFlightNumber = (flights: any) => {
    const grouped: any = {};
    const order: string[] = [];

    flights.forEach((flight: any) => {
      // Normalize both airline name and flight number for consistent grouping
      const normalizedAirline = normalizeAirlineName(flight.airline_name_fa);
      const normalizedFlightNum = normalizeFlightNumber(flight.flight_number);
      
      // Group ONLY by airline and flight number - combine all variants regardless of time
      const key = `${normalizedAirline}-${normalizedFlightNum}`;

      if (!grouped[key]) {
        order.push(key);
        grouped[key] = {
          uniqueKey: key,
          flight_number: normalizedFlightNum,
          origin: flight.origin,
          destination: flight.destination,
          departure_date_time: flight.departure_date_time,
          arrival_date_time: flight.arrival_date_time,
          airline_name_fa: normalizedAirline,
          airline_name_en: flight.airline_name_en,
          is_foreign_flight: flight.is_foreign_flight,
          flights: [],
        };
      }

      grouped[key].flights.push(flight);
    });

    // Sort grouped flights by departure time
    return order
      .map((key) => grouped[key])
      .sort((a, b) => {
        const dateA = new Date(a.departure_date_time).getTime();
        const dateB = new Date(b.departure_date_time).getTime();
        return dateA - dateB;
      });
  };

  useEffect(() => {
    if (!list) return;

    console.log('ResultList list:', list);
    const grouped = groupFlightsByFlightNumber(list ?? []);
    console.log('ResultList grouped:', grouped);
    setGroupList(grouped);
  }, [list?.length, orderBy]);

  useEffect(() => {
    if (!isUnavailable) setFlightsCount(groupList.length);
  }, [isUnavailable, groupList.length]);

  const hasSolutions = list.length !== 0 || unAvailableList.length !== 0;
  const filterCount = useFilterCount();
  const { onClearFilters } = useClearFilters();
  const { data: cityList = [] } = useCities(
    list[0]?.is_foreign_flight.toString()
  );
  const { data: airlineList = [] } = useAirlines();

  if (isLoading) return <CardsLoading />;

  if (!hasSolutions) {
    if (filterCount === 0)
      return (
        <div className="flex flex-col items-center justify-center gap-3">
          {LottieComponent && (
            <LottieComponent animationData={noResult} loop={true} />
          )}
          <p className="font-extrabold text-lg"> پروازی یافت نشد </p>
        </div>
      );

    return (
      <div className="flex flex-col items-center justify-center gap-4 py-8">
        {LottieComponent && (
          <LottieComponent
            className="size-48 md:size-56"
            animationData={noFlight}
            loop={true}
          />
        )}
        <p className="font-bold text-lg md:text-xl text-foreground">
          با فیلتر های انتخابی پروازی یافت نشد
        </p>
        <button
          className="text-base md:text-lg bg-primary rounded-2xl flex items-center justify-center max-w-48 h-12 md:h-14 px-4 md:px-6 text-primary-foreground w-full hover:bg-primary/90 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 font-semibold"
          onClick={onClearFilters}
        >
          حذف فیلترها
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 md:gap-6">
      {isUnavailable ? (
        <>
          {list.map((flight) => (
            <FlightCard
              key={flight.id}
              flight={flight}
              cityList={cityList}
              airlineList={airlineList}
            />
          ))}
          {unAvailableList?.length > 0 && filterCount === 0 && (
            <>
              <p className="text-base md:text-lg font-bold text-foreground mt-8 mb-3 px-2">بلیط های ناموجود</p>
              {unAvailableList?.map((flight, index) => (
                <FlightCard
                  key={flight.id}
                  flight={flight}
                  cityList={cityList}
                  airlineList={airlineList}
                />
              ))}
            </>
          )}
        </>
      ) : (
        groupList.map((flight: any) => (
          <GroupFlightCard
            key={flight.uniqueKey}
            flight={flight}
            airlineList={airlineList}
          />
        ))
      )}
    </div>
  );
};

export default ResultList;
