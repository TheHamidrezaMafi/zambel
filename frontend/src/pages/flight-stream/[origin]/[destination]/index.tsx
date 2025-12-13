import React, { useMemo, useState, useEffect } from 'react';
import { useStreamingFlights } from '@/hooks/useStreamingFlights';
import Header from '@/components/common/header';
import DateHeader from '@/components/date-header';
import AnimatedFlightCard from '@/components/flight-card/animated-flight-card';
import { GroupedFlight } from '@/types/unified-flight.types';

const StreamingFlightSearch = () => {
  const {
    flights,
    metadata,
    isLoading,
    error,
    providerProgress,
    completedProviders,
    totalProviders,
  } = useStreamingFlights();

  const [sortBy, setSortBy] = useState<'price' | 'time' | 'duration'>('price');
  const [filterProvider, setFilterProvider] = useState<string | null>(null);
  const [filterAirline, setFilterAirline] = useState<string | null>(null);
  const [newFlightIds, setNewFlightIds] = useState<Set<string>>(new Set());
  const [updatedFlightIds, setUpdatedFlightIds] = useState<Set<string>>(new Set());

  // Track new and updated flights
  const previousFlightsRef = React.useRef<Map<string, GroupedFlight>>(new Map());

  useEffect(() => {
    const prevMap = previousFlightsRef.current;
    const newIds = new Set<string>();
    const updatedIds = new Set<string>();

    flights.forEach((flight) => {
      const prevFlight = prevMap.get(flight.base_flight_id);

      if (!prevFlight) {
        // New flight
        newIds.add(flight.base_flight_id);
      } else if (
        prevFlight.pricingOptions.length !== flight.pricingOptions.length ||
        prevFlight.lowestPrice !== flight.lowestPrice
      ) {
        // Updated flight
        updatedIds.add(flight.base_flight_id);
      }

      prevMap.set(flight.base_flight_id, flight);
    });

    setNewFlightIds(newIds);
    setUpdatedFlightIds(updatedIds);

    // Clear flags after animation
    if (newIds.size > 0 || updatedIds.size > 0) {
      setTimeout(() => {
        setNewFlightIds(new Set());
        setUpdatedFlightIds(new Set());
      }, 1000);
    }
  }, [flights]);

  // Generate dynamic airline and provider lists
  const { allAirlines, allProviders } = useMemo(() => {
    if (!flights || flights.length === 0) {
      return { allAirlines: [], allProviders: [] };
    }

    const airlinesSet = new Set<string>();
    const providersSet = new Set<string>();

    flights.forEach((flight) => {
      airlinesSet.add(flight.airline.name_fa);
      flight.pricingOptions.forEach((option) => {
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
    let filtered = [...flights];

    // Filter by provider
    if (filterProvider) {
      filtered = filtered.filter((flight) =>
        flight.pricingOptions.some((opt) => opt.provider === filterProvider),
      );
    }

    // Filter by airline
    if (filterAirline) {
      filtered = filtered.filter(
        (flight) => flight.airline.name_fa === filterAirline,
      );
    }

    // Sort flights
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          return a.lowestPrice - b.lowestPrice;
        case 'time':
          return (
            new Date(a.schedule.departure_datetime).getTime() -
            new Date(b.schedule.departure_datetime).getTime()
          );
        case 'duration':
          return a.schedule.duration_minutes - b.schedule.duration_minutes;
        default:
          return 0;
      }
    });

    return filtered;
  }, [flights, filterProvider, filterAirline, sortBy]);

  return (
    <div className="min-h-screen relative">
      <Header />
      <DateHeader />

      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl relative z-10">
        {/* Progress Bar */}
        {isLoading && (
          <div className="mb-6">
            <div className="glass-strong rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">
                  جستجو در حال انجام...
                </span>
                <span className="text-sm text-muted-foreground">
                  {completedProviders} از {totalProviders}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-3">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(completedProviders / totalProviders) * 100}%`,
                  }}
                />
              </div>
              {/* Provider status indicators */}
              <div className="flex flex-wrap gap-2">
                {providerProgress.map((provider) => (
                  <div
                    key={provider.name}
                    className={`
                      glass rounded-full px-3 py-1 text-xs font-medium transition-all duration-300
                      ${
                        provider.status === 'completed'
                          ? 'bg-success/20 text-success'
                          : provider.status === 'loading'
                          ? 'bg-primary/20 text-primary animate-pulse'
                          : provider.status === 'failed'
                          ? 'bg-destructive/20 text-destructive'
                          : 'bg-muted/50 text-muted-foreground'
                      }
                    `}
                  >
                    {provider.name}
                    {provider.flightCount !== undefined &&
                      ` (${provider.flightCount})`}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Results Summary */}
        {flights.length > 0 && (
          <div className="mb-6 animate-fade-in">
            <div className="glass-strong rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-foreground">
                    {processedFlights.length} پرواز یافت شد
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {metadata?.total_options || 0} گزینه قیمتی از{' '}
                    {metadata?.providers_successful.length || 0} منبع
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    زمان جستجو: {((metadata?.search_time_ms || 0) / 1000).toFixed(1)}
                    ثانیه
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Sort Bar */}
        {flights.length > 0 && (
          <div className="flex justify-center mb-6 md:mb-8 animate-fade-in">
            <div className="flex items-center gap-3 md:gap-4 max-w-4xl w-full flex-wrap">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
              >
                <option value="price">ارزان‌ترین</option>
                <option value="time">زودترین پرواز</option>
                <option value="duration">کوتاه‌ترین مدت</option>
              </select>

              {/* Provider Filter */}
              <select
                value={filterProvider || ''}
                onChange={(e) => setFilterProvider(e.target.value || null)}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
              >
                <option value="">همه منابع</option>
                {allProviders.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>

              {/* Airline Filter */}
              <select
                value={filterAirline || ''}
                onChange={(e) => setFilterAirline(e.target.value || null)}
                className="px-3 py-2 text-sm rounded-lg border border-border bg-card text-foreground"
              >
                <option value="">همه ایرلاین‌ها</option>
                {allAirlines.map((airline) => (
                  <option key={airline} value={airline}>
                    {airline}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Flight List */}
        <div className="flex justify-center">
          <div className="w-full max-w-4xl space-y-4">
            {isLoading && flights.length === 0 ? (
              <div className="flex justify-center items-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">
                    در حال جستجو در {totalProviders} منبع...
                  </p>
                </div>
              </div>
            ) : processedFlights.length === 0 && !isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="text-center">
                  <p className="text-xl text-muted-foreground mb-2">
                    پروازی یافت نشد
                  </p>
                  <p className="text-sm text-muted-foreground">
                    لطفاً معیارهای جستجو را تغییر دهید
                  </p>
                </div>
              </div>
            ) : (
              processedFlights.map((flight, index) => (
                <AnimatedFlightCard
                  key={flight.base_flight_id}
                  flight={flight}
                  isNew={newFlightIds.has(flight.base_flight_id)}
                  hasUpdate={updatedFlightIds.has(flight.base_flight_id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center">
              <p className="text-xl text-destructive mb-2">خطا در جستجو</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StreamingFlightSearch;
