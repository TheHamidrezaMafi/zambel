import React, { useCallback } from 'react';
import { ArrowSmall } from '../common/icons';
import { useRouter } from 'next/router';

const DateHeader = () => {
  const today = new Date();
  const router = useRouter();
  const { query } = router;
  const { departureDate, returnDate } = query ?? {};
  
  // Parse date as local date to avoid timezone issues
  const departure = departureDate
    ? (() => {
        const [year, month, day] = (departureDate as string).split('-').map(Number);
        return new Date(year, month - 1, day);
      })()
    : today;
  
  const isToday = today.toDateString() === departure.toDateString();
  const isOneWay = returnDate === undefined;
  const onClick = useCallback(
    (isPreviousDay: boolean) => {
      const newDate = new Date(departure);
      if (isPreviousDay) {
        newDate.setDate(newDate.getDate() - 1);
      } else {
        newDate.setDate(newDate.getDate() + 1);
      }
      const newDepartureDate = newDate.toISOString().split('T')[0];
      router.push({
        pathname: router.pathname,
        query: {
          ...query,
          departureDate: newDepartureDate,
        },
      });
    },
    [departure, query, router]
  );
  return (
    <>
      {isOneWay ? (
        <div className="w-full flex justify-between items-center px-4 py-3 text-foreground">
          <button
            onClick={() => onClick(true)}
            disabled={isToday}
            className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 rounded-lg px-3 py-1.5 ${
              isToday ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-primary hover:bg-primary/10'
            }`}
          >
            <ArrowSmall className={isToday ? 'fill-muted-foreground/50' : 'fill-primary'} />
            روز قبل
          </button>
          <span className="text-sm font-bold gradient-text">
            {departure.toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <button
            onClick={() => onClick(false)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:bg-primary/10 transition-all duration-300 rounded-lg px-3 py-1.5"
          >
            روز بعد <ArrowSmall className="rotate-180 fill-primary" />
          </button>
        </div>
      ) : null}
    </>
  );
};

export default DateHeader;
