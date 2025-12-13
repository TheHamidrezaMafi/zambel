import Header from '@/components/common/header';
import { useUnifiedFlights } from '@/hooks/useUnifiedFlights';
import DateHeader from '@/components/date-header';
import UnifiedFlightCard from '@/components/flight-card/unified-flight-card';
import { useMemo, useState } from 'react';
import { GroupedFlight } from '@/types/unified-flight.types';

const Flight = () => {
  const { flights, metadata, isLoading, error } = useUnifiedFlights();
  const [sortBy, setSortBy] = useState<'price' | 'time' | 'duration'>('price');
  const [filterProvider, setFilterProvider] = useState<string | null>(null);
  const [filterAirline, setFilterAirline] = useState<string | null>(null);

  // Generate dynamic airline and provider lists
  const { allAirlines, allProviders } = useMemo(() => {
    if (!flights || flights.length === 0) {
      return { allAirlines: [], allProviders: [] };
    }
    
    const airlinesSet = new Set<string>();
    const providersSet = new Set<string>();
    
    flights.forEach((flight) => {
      airlinesSet.add(flight.airline.name_fa);
      flight.pricingOptions.forEach(option => {
        providersSet.add(option.provider);
      });
    });
    
    return {
      allAirlines: Array.from(airlinesSet).sort(),
      allProviders: Array.from(providersSet).sort(),
    };
  }, [flights]);

  // Filter and sort flights
  const processedFlights = useMemo(() => {
    let result = [...flights];

    // Apply filters
    if (filterProvider) {
      result = result.filter(flight => 
        flight.pricingOptions.some(option => option.provider === filterProvider)
      );
    }
    if (filterAirline) {
      result = result.filter(flight => flight.airline.name_fa === filterAirline);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.lowestPrice - b.lowestPrice;
        case 'time':
          return new Date(a.schedule.departure_datetime).getTime() - 
                 new Date(b.schedule.departure_datetime).getTime();
        case 'duration':
          const durationA = new Date(a.schedule.arrival_datetime).getTime() - 
                           new Date(a.schedule.departure_datetime).getTime();
          const durationB = new Date(b.schedule.arrival_datetime).getTime() - 
                           new Date(b.schedule.departure_datetime).getTime();
          return durationA - durationB;
        default:
          return 0;
      }
    });

    return result;
  }, [flights, sortBy, filterProvider, filterAirline]);

  const flightCount = processedFlights.length;
  const offerCount = metadata?.total_options || 0;

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
        {/* Filter and Sort Bar */}
        <div className="flex justify-center mb-6 md:mb-8">
          <div className="flex items-center gap-3 md:gap-4 max-w-4xl w-full">
            {/* Filter Buttons */}
            <div className="flex gap-2 flex-wrap flex-1">
              <select
                value={filterProvider || ''}
                onChange={(e) => setFilterProvider(e.target.value || null)}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
              >
                <option value="">همه منابع</option>
                {allProviders.map(provider => (
                  <option key={provider} value={provider}>{provider}</option>
                ))}
              </select>

              <select
                value={filterAirline || ''}
                onChange={(e) => setFilterAirline(e.target.value || null)}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
              >
                <option value="">همه ایرلاین‌ها</option>
                {allAirlines.map(airline => (
                  <option key={airline} value={airline}>{airline}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
              >
                <option value="price">ارزان‌ترین</option>
                <option value="time">زودترین</option>
                <option value="duration">کوتاه‌ترین</option>
              </select>
            </div>
            
            {/* Flight Stats */}
            {!isLoading && metadata && (
              <div className="flex flex-col items-center justify-center px-4 py-1.5 bg-muted/30 rounded-lg border border-border/40">
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
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex justify-center mb-6">
            <div className="max-w-4xl w-full p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 text-center">
              خطا در دریافت اطلاعات پروازها: {error}
            </div>
          </div>
        )}

        {/* Flight List */}
        <div className="flex justify-center">
          <div className="w-full max-w-4xl space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">در حال جستجو...</p>
                </div>
              </div>
            ) : processedFlights.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <p className="text-xl text-muted-foreground mb-2">پروازی یافت نشد</p>
                  <p className="text-sm text-muted-foreground">لطفاً معیارهای جستجو را تغییر دهید</p>
                </div>
              </div>
            ) : (
              processedFlights.map((flight) => (
                <UnifiedFlightCard key={flight.base_flight_id} flight={flight} />
              ))
            )}
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
