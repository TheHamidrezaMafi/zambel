import React, { useEffect, useState } from 'react';
import { ResultListProperties } from './types';
import CardsLoading from '../common/container/loading';
import noFlight from '@/assets/images/no-flight.json';
import noResult from '@/assets/images/NoResult-any.json';

import { useClearFilters, useFilterCount } from '@/hooks/useFilters';
import GroupFlightCard from '../flight-card/group-flight-card';
import { useAirlines } from '@/hooks/useAirlines';
import { useRouter } from 'next/router';
import { normalizeAirlineName } from '@/helper/utils';

const ResultList = ({
  list,
  isLoading,
}: ResultListProperties) => {
  const [groupList, setGroupList] = useState<any>([]);
  const [LottieComponent, setLottieComponent] = useState<any>(null);
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);

  const { query } = useRouter();
  const orderBy = (query.orderBy as string) || 'lowest_price';

  // Set a minimum loading time of 10 seconds before showing "no flights found"
  useEffect(() => {
    setMinLoadingComplete(false);
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 10000); // 10 seconds

    return () => clearTimeout(timer);
  }, [query.origin, query.destination, query.departureDate]);

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

  const groupFlightsByFlightNumber = (flights: any, sortBy: string) => {
    const grouped: any = {};
    const order: string[] = [];

    flights.forEach((flight: any) => {
      // Normalize both airline name and flight number for consistent grouping
      const normalizedAirline = normalizeAirlineName(flight.airline_name_fa);
      const normalizedFlightNum = normalizeFlightNumber(flight.flight_number);
      
      // Group ONLY by airline and flight number - combine all variants regardless of time
      // Use base_flight_id if available, otherwise fallback to airline-flightNum
      const key = flight.base_flight_id || `${normalizedAirline}-${normalizedFlightNum}`;

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

    // Convert to array
    const groupedArray = order.map((key) => grouped[key]);

    // Calculate min price for each group (main price shown on card)
    groupedArray.forEach((group) => {
      group.minPrice = Math.min(...group.flights.map((f: any) => f.adult_price));
      group.maxPrice = Math.max(...group.flights.map((f: any) => f.adult_price));
    });

    // Sort groups based on the selected sort option
    switch (sortBy) {
      case 'lowest_price':
        return groupedArray.sort((a, b) => a.minPrice - b.minPrice);
      case 'highest_price':
        return groupedArray.sort((a, b) => b.maxPrice - a.maxPrice);
      case 'earliest':
        return groupedArray.sort((a, b) => {
          const dateA = new Date(a.departure_date_time).getTime();
          const dateB = new Date(b.departure_date_time).getTime();
          return dateA - dateB;
        });
      case 'latest':
        return groupedArray.sort((a, b) => {
          const dateA = new Date(a.departure_date_time).getTime();
          const dateB = new Date(b.departure_date_time).getTime();
          return dateB - dateA;
        });
      default:
        // Default to lowest price
        return groupedArray.sort((a, b) => a.minPrice - b.minPrice);
    }
  };

  useEffect(() => {
    if (!list) return;

    console.log('ResultList list:', list);
    const grouped = groupFlightsByFlightNumber(list ?? [], orderBy);
    console.log('ResultList grouped:', grouped);
    setGroupList(grouped);
  }, [list, orderBy]);

  const hasSolutions = list.length !== 0;
  const filterCount = useFilterCount();
  const { onClearFilters } = useClearFilters();
  const { data: airlineList = [] } = useAirlines();

  // Show loading if still loading OR if minimum loading time hasn't passed yet (and no results)
  const shouldShowLoading = isLoading || (!hasSolutions && !minLoadingComplete);

  if (shouldShowLoading) return <CardsLoading />;

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
      {groupList.map((flight: any) => (
        <GroupFlightCard
          key={flight.uniqueKey}
          flight={flight}
          airlineList={airlineList}
        />
      ))}
    </div>
  );
};

export default ResultList;
