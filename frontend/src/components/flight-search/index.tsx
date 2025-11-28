import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';

import Tabs from '@/components/common/tabs';
import { DatePicker } from '@/components/common/calendar';
import moment from 'moment-jalaali';
import { MobileSelect } from '@/components/common/mobile-select';
import {
  TakingoffAirPlane,
  LandingAirPlane,
  Swap,
} from '@/components/common/icons';

import { useCities } from '@/hooks/useCities';
import { flightDirectionList, flightTypeList } from './constants';
import { FormValues } from './types';
import { convertToJalali } from '@/helper/utils';

const FlightSearch = () => {
  const router = useRouter();
  const { query, push } = router;
  const flightDirection = (query['flight-direction'] as string) || 'domestic';
  const flightType = query['flight-type'];

  const { data: cityList = [] } = useCities(flightDirection);
  const [parsedHistory, setParsedHistory] = useState<any[]>([]);

  const { control, handleSubmit, reset, getValues, setValue } =
    useForm<FormValues>({
      mode: 'onChange',
    });

  // Calendar open control via query (keep old step flow)
  const isCalendarOpen = query.step === 'calendar';
  const openCalendar = () =>
    push({ pathname: router.pathname, query: { ...query, step: 'calendar' } });
  const closeCalendar = () => {
    const { step, ...rest } = query as Record<string, any>;
    push({ pathname: router.pathname, query: rest });
  };

  useEffect(() => {
    reset({
      origin: undefined,
      destination: undefined,
      start: undefined,
      end: undefined,
    });
  }, [reset, query.selectedTab]);

  // Ensure return date clears when switching to one-way
  useEffect(() => {
    if (flightType !== 'round-trip') {
      setValue('end', undefined);
    }
  }, [flightType, setValue]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchHistory = localStorage.getItem('searchHistory');
      let parsedHistory = searchHistory ? JSON.parse(searchHistory) : [];
      const now = new Date();
      parsedHistory = parsedHistory.filter(
        (item: any) =>
          new Date(item.from_date).setHours(23, 59, 59, 999) >= now.getTime()
      );
      localStorage.setItem('searchHistory', JSON.stringify(parsedHistory));
      const isDomesticFlight = flightDirection === 'domestic';
      setParsedHistory(
        parsedHistory.filter(
          (item: any) => item.is_domestic_flight === isDomesticFlight
        )
      );
    }
  }, [flightDirection]);

  const onSubmit = (data: FormValues) => {
    const { origin, destination, start, end } = data;

    if (!origin || !destination || !start) return;

    push({
      pathname: `/flight/${origin.code}/${destination.code}`,
      query: {
        flightDirection,
        available: 'موجود',
        departureDate: start,
        ...(end && { returnDate: end }),
        originName: origin.name,
        destinationName: destination.name,
      },
    });
  };
  const currentOrigin = getValues('origin');
  const currentDestination = getValues('destination');

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs - Mobile optimized */}
      <div className="py-2">
        <Tabs
          queryKey="flight-direction"
          variant="filled"
          list={flightDirectionList}
          defaultTab="domestic"
        />
      </div>
      <div className="py-2">
        <Tabs
          queryKey="flight-type"
          variant="underline"
          list={flightTypeList}
          defaultTab="one-way"
        />
      </div>

      {/* Origin/Destination Section - Responsive */}
      <div className="relative flex flex-col gap-4 md:gap-0">
        {/* Desktop: Two columns side by side */}
        <div className="flex flex-col gap-4 md:grid md:grid-cols-[1fr_auto_1fr] md:gap-4 md:items-center">
          <MobileSelect
            options={cityList.filter((city) =>
              currentDestination ? city.value !== currentDestination.code : true
            )}
            label="مبدا (شهر)"
            control={control}
            name="origin"
            Icon={TakingoffAirPlane}
          />

          {/* Swap Button - Desktop Position */}
          <div className="hidden md:flex justify-center items-center z-10">
            <button
              type="button"
              onClick={() => {
                const origin = getValues('origin');
                const destination = getValues('destination');
                if (origin && destination) {
                  reset({
                    ...getValues(),
                    origin: destination,
                    destination: origin,
                  });
                }
              }}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 border border-border shadow-sm hover:shadow-md ${
                getValues('origin') && getValues('destination')
                  ? 'bg-background hover:bg-accent cursor-pointer'
                  : 'bg-muted cursor-not-allowed opacity-50'
              }`}
              disabled={!getValues('origin') || !getValues('destination')}
            >
              <Swap
                width="20"
                height="20"
                className={
                  getValues('origin') && getValues('destination')
                    ? 'fill-primary'
                    : 'fill-muted-foreground'
                }
              />
            </button>
          </div>

          {/* Swap Button - Mobile Position (Absolute) */}
          <div className="md:hidden absolute top-1/2 left-8 -translate-y-1/2 z-10">
             <button
              type="button"
              onClick={() => {
                const origin = getValues('origin');
                const destination = getValues('destination');
                if (origin && destination) {
                  reset({
                    ...getValues(),
                    origin: destination,
                    destination: origin,
                  });
                }
              }}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200 border border-border shadow-sm bg-background rotate-90 ${
                getValues('origin') && getValues('destination')
                  ? 'hover:bg-accent cursor-pointer'
                  : 'opacity-50 cursor-not-allowed'
              }`}
              disabled={!getValues('origin') || !getValues('destination')}
            >
              <Swap
                width="20"
                height="20"
                className={
                  getValues('origin') && getValues('destination')
                    ? 'fill-primary'
                    : 'fill-muted-foreground'
                }
              />
            </button>
          </div>

          <MobileSelect
            options={cityList.filter((city) =>
              currentOrigin ? city.value !== currentOrigin.code : true
            )}
            label="مقصد (شهر)"
            control={control}
            name="destination"
            Icon={LandingAirPlane}
          />
        </div>
      </div>

      {/* Calendar / Date Picker - Responsive width */}
      <div className="w-full">
        <DatePicker
          isRange={flightType === 'round-trip'}
          placeholder={
            flightType === 'round-trip' ? 'تاریخ رفت و برگشت' : 'تاریخ رفت'
          }
          open={Boolean(isCalendarOpen)}
          onOpenChange={(open) => (open ? openCalendar() : closeCalendar())}
          startDate={
            getValues('start')
              ? moment(getValues('start'), 'YYYY-MM-DD', true).toDate()
              : null
          }
          endDate={
            flightType === 'round-trip' && getValues('end')
              ? moment(getValues('end'), 'YYYY-MM-DD', true).toDate()
              : null
          }
          minDate={new Date()}
          onDateSelect={({ startDate, endDate }) => {
            if (startDate) {
              setValue('start', moment(startDate).format('YYYY-MM-DD'));
            } else {
              setValue('start', undefined);
            }

            if (flightType === 'round-trip') {
              if (endDate) {
                setValue('end', moment(endDate).format('YYYY-MM-DD'));
              } else {
                setValue('end', undefined);
              }
            } else {
              setValue('end', undefined);
            }
          }}
        />
      </div>

      {/* Submit Button - Touch-friendly */}
      <button
        onClick={handleSubmit(onSubmit)}
        className={`text-base md:text-lg bg-primary rounded-xl md:rounded-2xl flex items-center justify-center h-12 md:h-14 px-6 md:px-10 text-primary-foreground w-full btn-touch transition-all duration-200 font-semibold shadow-md hover:shadow-lg active:scale-[0.98] ${
          !getValues('origin') ||
          !getValues('destination') ||
          !getValues('start')
            ? `opacity-50 cursor-not-allowed`
            : 'hover:bg-primary/90'
        }`}
        disabled={
          !getValues('origin') ||
          !getValues('destination') ||
          !getValues('start')
        }
      >
        جستجو
      </button>

      <div className="border-b border-border my-2" />

      {/* Search History - Responsive */}
      <div className="flex flex-col gap-3 md:gap-4">
        <div className="flex items-center justify-between">
          <p className="text-base md:text-lg font-bold text-foreground">تاریخچه جستجو</p>
          {parsedHistory.length > 0 && cityList.length > 0 ? (
            <button
              onClick={() => {
                localStorage.removeItem('searchHistory');
                setParsedHistory([]);
              }}
              className="btn-touch"
            >
              <p className="text-sm md:text-base font-bold text-destructive hover:text-destructive/90">
                پاک کردن
              </p>
            </button>
          ) : null}
        </div>
        {parsedHistory.length > 0 && cityList.length > 0 ? (
          <div className="flex flex-col gap-3 md:gap-4 md:grid md:grid-cols-2 md:gap-4">
            {parsedHistory.map((item: any, index: number) => (
              <div
                key={index}
                className="flex flex-col gap-2 bg-card border border-border/60 p-3 md:p-4 rounded-xl shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
                onClick={() => {
                  onSubmit({
                    origin: {
                      code: item.from_destination,
                      name:
                        cityList.find(
                          (city) => city.value === item.from_destination
                        )?.label || '',
                    },
                    destination: {
                      code: item.to_destination,
                      name:
                        cityList.find(
                          (city) => city.value === item.to_destination
                        )?.label || '',
                    },
                    start: item.from_date,
                    end: item.to_date,
                  });
                }}
              >
                <div className="flex items-center gap-2">
                  <p className="text-sm md:text-base font-medium text-card-foreground">
                    {
                      cityList.find(
                        (city) => city.value === item.from_destination
                      )?.label
                    }
                  </p>
                  <span className="text-muted-foreground">←</span>
                  <p className="text-sm md:text-base font-medium text-card-foreground">
                    {
                      cityList.find(
                        (city) => city.value === item.to_destination
                      )?.label
                    }
                  </p>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">{`تاریخ رفت: ${convertToJalali(item.from_date)
                  .split('-')
                  .reverse()
                  .join('-')}`}</p>
                {item.to_date ? (
                  <p className="text-xs md:text-sm text-muted-foreground">{`تاریخ برگشت: ${convertToJalali(item.to_date)
                    .split('-')
                    .reverse()
                    .join('-')}`}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm md:text-base text-muted-foreground">تاریخچه جستجو خالی است</p>
        )}
      </div>
    </div>
  );
};

export default FlightSearch;
