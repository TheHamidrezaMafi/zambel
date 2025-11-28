import Header from '@/components/common/header';
import { useFetchFlights } from '@/hooks/useFetchFlights';
import DateHeader from '@/components/date-header';
import { useListing } from '@/hooks/useListing';
import SortModal from '@/components/sort-modal/sort-modal';
import FilterModal from '@/components/filter-modal/filter-modal';
import ResultList from '@/components/result-list';
import { useEffect, useState } from 'react';
import { createFilterSchema } from '@/helper/createFilterSchema';
import { useRouter } from 'next/router';

const Flight = () => {
  const { data, isLoading } = useFetchFlights();
  const { flights, unavailableTicket } = useListing(data);
  
  const [allAirlines, setAllAirlines] = useState<Array<any>>([]);
  const [allProviders, setAllProviders] = useState<Array<any>>([]);
  const [flightsCount, setFlightsCount] = useState<number>(0);
  const { query } = useRouter();
  
  // Check if we should show unavailable flights
  let availableFilter: any = query['available'] || '';
  availableFilter = availableFilter.split(',').filter((item: string) => item);
  const isUnavailable = availableFilter?.includes('ناموجود');

  useEffect(() => {
    if (data.length) {
      const { airlines, providers } = createFilterSchema(data);
      setAllProviders(providers);
      setAllAirlines(airlines);
    }
  }, [data]);

  return (
    <div className="bg-background min-h-screen pb-20">
      <Header />
      <div className="sticky top-0 z-10 bg-card shadow-md border-b border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <DateHeader />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">
        {/* Filter and Sort Buttons - Centered at Top */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="flex gap-3 md:gap-4 max-w-md w-full">
            <FilterModal 
              allProviders={allProviders}
              allAirlines={allAirlines}
              resultCount={flights.length}
              isLoading={isLoading}
            />
            <SortModal isLoading={isLoading} />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <ResultList 
              list={flights} 
              isLoading={isLoading}
              unAvailableList={unavailableTicket}
              isUnavailable={isUnavailable}
              setFlightsCount={setFlightsCount} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Flight;

export async function getServerSideProps() {
  return { props: {} };
}
