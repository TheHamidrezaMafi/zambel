import React, { useMemo } from 'react';
import { Arrow, Search, Close } from '../icons';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { convertDateToString } from '@/helper/dateConverter';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useCities } from '@/hooks/useCities';
import { MobileSelect } from '../mobile-select';
import { DatePicker } from '@/components/common/calendar';
import moment from 'moment-jalaali';
import { FormValues } from '@/components/flight-search/types';
import { Swap } from '@/components/common/icons';

const Header = () => {
  const { query, pathname, isReady, push } = useRouter();
  const {
    departureDate,
    returnDate,
    origin,
    destination,
    originName,
    destinationName,
  } = query;
  const [showSearch, setShowSearch] = useState(false);

  const flightDirection = (query['flight-direction'] as string) || 'domestic';

  const { data: cityOptions } = useCities(flightDirection);

  // Helper to get string from query
  const getString = (value: string | string[] | undefined): string => {
    if (Array.isArray(value)) return value[0] || '';
    return value || '';
  };

  // Prepare initial values for the form
  const initialOrigin =
    origin && originName
      ? { code: getString(origin), name: getString(originName) }
      : undefined;
  const initialDestination =
    destination && destinationName
      ? { code: getString(destination), name: getString(destinationName) }
      : undefined;
  const initialDate = getString(departureDate);
  const initialEndDate = getString(returnDate);

  const { control, handleSubmit, reset, getValues, setValue } =
    useForm<FormValues>({
      defaultValues: {
        origin: initialOrigin,
        destination: initialDestination,
        start: initialDate,
        end: initialEndDate,
      },
    });

  const onSearch = (data: any) => {
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
    setShowSearch(false);
  };

  const departureDateString = useMemo(
    () => convertDateToString(departureDate as string),
    [departureDate]
  );
  const dateString = departureDateString;
  const title = useMemo(
    () =>
      `${
        pathname.includes('flight') ? 'پرواز' : 'هتل'
      } ${originName} به ${destinationName}`,
    [pathname, originName, destinationName]
  );

  // calendar open/close synced with step=calendar like old flow
  const isCalendarOpen = query.step === 'calendar';
  const openCalendar = () =>
    push({ pathname, query: { ...query, step: 'calendar' } });
  const closeCalendar = () => {
    const { ['step']: _omit, ...rest } = query as Record<
      string,
      string | string[] | undefined
    >;
    push({ pathname, query: rest });
  };

  return (
    <header
      className={`glass-strong w-full flex flex-col z-50 sticky top-0 transition-all duration-300 safe-area-inset border-b border-border/30 ${
        showSearch ? 'pb-3 md:pb-4' : ''
      }`}
    >
      <div className="flex flex-row min-h-14 md:min-h-16 pr-1 pl-3 md:pl-4 py-2 items-center">
        {isReady ? (
          <>
            <Link href="/" className="text-muted-foreground h-10 w-10 md:h-12 md:w-12 p-2 md:p-3 ml-1 btn-touch hover:text-primary transition-colors">
              <Arrow />
            </Link>
            <div className="flex items-center justify-between w-full">
              <p className="text-sm md:text-base text-foreground font-medium">{title}</p>
              <p className="text-[10px] md:text-xs mt-1 text-muted-foreground">
                {`${dateString} / 1 نفر`}
              </p>
            </div>
            <button
              className="ml-2 text-muted-foreground hover:text-primary transition-colors h-10 w-10 md:h-12 md:w-12 p-2 md:p-3 flex items-center justify-center btn-touch"
              onClick={() => setShowSearch((prev) => !prev)}
              aria-label={showSearch ? 'بستن جستجو' : 'نمایش جستجو'}
            >
              {showSearch ? (
                <Close
                  className="w-5 h-5 md:w-6 md:h-6 transition-colors fill-foreground hover:fill-destructive"
                />
              ) : (
                <Search className="fill-foreground" />
              )}
            </button>
          </>
        ) : null}
      </div>
      {showSearch && (
        <div className="w-full px-3 md:px-4 pt-2 animate-slide-up">
          <div className="glass rounded-2xl p-4 md:p-5 flex flex-col gap-3 md:gap-4">
            <p className="text-center text-sm md:text-base font-bold text-foreground">
              جستجوی پرواز
            </p>
            <form
              onSubmit={handleSubmit(onSearch)}
              className="flex flex-col md:justify-center gap-3 md:gap-4"
            >
              <div className="flex flex-col gap-3 md:gap-4 relative md:grid md:grid-cols-2">
                <MobileSelect
                  control={control}
                  name="origin"
                  label="مبدا (شهر)"
                  options={cityOptions.filter(
                    (city) =>
                      city.value !==
                      (control._formValues?.destination?.code || '')
                  )}
                />

                <MobileSelect
                  control={control}
                  name="destination"
                  label="مقصد (شهر)"
                  options={cityOptions.filter(
                    (city) =>
                      city.value !== (control._formValues?.origin?.code || '')
                  )}
                />

                {/* Swap Button - Responsive positioning */}
                <div className="flex justify-center transform rotate-90 md:rotate-0 absolute top-[50%] left-[20%] md:left-1/2 z-[10] -translate-x-1/2 -translate-y-1/2 md:-translate-y-[calc(50%+0.75rem)]">
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
                    className={`flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-300 border border-border btn-touch bg-secondary hover:bg-primary hover:text-primary-foreground hover:border-primary hover:rotate-180 ${
                      getValues('origin') && getValues('destination')
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-50'
                    }`}
                    disabled={!getValues('origin') || !getValues('destination')}
                  >
                    <Swap
                      width="24"
                      height="24"
                      className={
                        getValues('origin') && getValues('destination')
                          ? 'fill-foreground'
                          : 'fill-muted-foreground'
                      }
                    />
                  </button>
                </div>
              </div>

              <div className="w-full">
                <DatePicker
                  isRange={!!returnDate}
                  placeholder={!!returnDate ? 'تاریخ رفت و برگشت' : 'تاریخ رفت'}
                  open={Boolean(isCalendarOpen)}
                  onOpenChange={(open) =>
                    open ? openCalendar() : closeCalendar()
                  }
                  startDate={
                    getValues('start')
                      ? moment(getValues('start'), 'YYYY-MM-DD', true).toDate()
                      : null
                  }
                  endDate={
                    !!returnDate && getValues('end')
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
                    if (!!returnDate) {
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
              <button
                type="submit"
                className="gradient-primary text-primary-foreground rounded-xl md:rounded-2xl py-2.5 md:py-3 text-sm md:text-base font-semibold transition-all duration-300 w-full mx-auto btn-touch glow-primary hover:opacity-90 hover:scale-[1.02]"
              >
                جستجو
              </button>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
