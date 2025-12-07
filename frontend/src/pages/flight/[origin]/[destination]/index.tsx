import Header from '@/components/common/header';
import { useFetchFlights } from '@/hooks/useFetchFlights';
import DateHeader from '@/components/date-header';
import { useListing } from '@/hooks/useListing';
import SortModal from '@/components/sort-modal/sort-modal';
import FilterModal from '@/components/filter-modal/filter-modal';
import ResultList from '@/components/result-list';
import { useMemo } from 'react';
import { normalizeAirlineName } from '@/helper/utils';

const Flight = () => {
  const { data, isLoading } = useFetchFlights();
  const { flights } = useListing(data);

  // Generate dynamic airline and provider lists from actual flight data
  const { allAirlines, allProviders } = useMemo(() => {
    if (!data || data.length === 0) {
      return { allAirlines: [], allProviders: [] };
    }
    
    // Get unique normalized airline names
    const airlinesSet = new Set<string>();
    const providersSet = new Set<string>();
    
    data.forEach((flight) => {
      // Use normalized airline name for consistency
      const normalizedAirline = normalizeAirlineName(flight.airline_name_fa);
      airlinesSet.add(normalizedAirline);
      providersSet.add(flight.provider_name);
    });
    
    return {
      allAirlines: Array.from(airlinesSet).sort(),
      allProviders: Array.from(providersSet).sort(),
    };
  }, [data]);

  // Calculate flight and offer counts
  const { flightCount, offerCount } = useMemo(() => {
    if (!flights || flights.length === 0) {
      return { flightCount: 0, offerCount: 0 };
    }
    
    // Count total offers (individual flight entries)
    const offerCount = flights.length;
    
    // Count unique flights by grouping by normalized airline + flight number
    const uniqueFlights = new Set<string>();
    flights.forEach((flight) => {
      const normalizedAirline = normalizeAirlineName(flight.airline_name_fa);
      // Normalize flight number - remove letters and leading zeros
      const flightNum = flight.flight_number?.replace(/[A-Za-z]/g, '').replace(/^0+/, '') || '';
      const key = `${normalizedAirline}-${flightNum}`;
      uniqueFlights.add(key);
    });
    
    return {
      flightCount: uniqueFlights.size,
      offerCount,
    };
  }, [flights]);

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-[10%] w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 left-[10%] w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <Header />
      
      <div className="sticky top-0 z-10 glass-strong border-b border-border/30">
        <div className="container mx-auto px-4 max-w-6xl">
          <DateHeader />
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl relative z-10">
        {/* Filter and Sort Buttons */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 max-w-xl w-full">
            <FilterModal 
              allProviders={allProviders}
              allAirlines={allAirlines}
              resultCount={flights.length}
              isLoading={isLoading}
            />
            
            {/* Flight Stats */}
            {!isLoading && (flightCount > 0 || offerCount > 0) && (
              <div className="flex flex-col items-center justify-center px-3 py-1.5 text-center min-w-fit">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg md:text-xl font-bold text-primary">{flightCount}</span>
                  <span className="text-xs md:text-sm text-muted-foreground">پرواز</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm md:text-base font-semibold text-foreground">{offerCount}</span>
                  <span className="text-xs text-muted-foreground">پیشنهاد</span>
                </div>
              </div>
            )}
            
            <SortModal isLoading={isLoading} />
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-4xl">
            <ResultList 
              list={flights} 
              isLoading={isLoading}
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
