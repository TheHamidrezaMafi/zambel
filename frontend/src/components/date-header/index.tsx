import React, { useCallback } from 'react';
import { ArrowSmall } from '../common/icons';
import { useRouter } from 'next/router';

const DateHeader = () => {
  const today = new Date();
  const router = useRouter();
  const { query } = router;
  const { departureDate, returnDate } = query ?? {};
  const departure = departureDate
    ? new Date(departureDate as string)
    : new Date();
  const isToday = today.toDateString() === departure.toDateString();
  const isOneWay = returnDate === undefined;
  const onClick = useCallback(
    (isPreviousDay: boolean) => {
      if (isPreviousDay) {
        departure.setDate(departure.getDate() - 1);
      } else {
        departure.setDate(departure.getDate() + 1);
      }
      const newDepartureDate = departure.toISOString().split('T')[0];
      router.push({
        pathname: router.pathname,
        query: {
          ...query,
          departureDate: newDepartureDate,
        },
      });
    },
    [departureDate, router]
  );
  return (
    <>
      {isOneWay ? (
        <div className="w-full flex justify-between items-center px-4 py-3 bg-card text-foreground">
          <button
            onClick={() => onClick(true)}
            disabled={isToday}
            className={`flex items-center gap-2 text-sm font-medium transition-colors ${
              isToday ? 'text-muted-foreground/50 cursor-not-allowed' : 'text-primary hover:text-primary/80'
            }`}
          >
            <ArrowSmall className={isToday ? 'fill-muted-foreground/50' : 'fill-primary'} />
            روز قبل
          </button>
          <span className="text-sm font-bold text-foreground">
            {new Date(departure).toLocaleDateString('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <button
            onClick={() => onClick(false)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            روز بعد <ArrowSmall className="rotate-180 fill-primary" />
          </button>
        </div>
      ) : null}
    </>
  );
};

export default DateHeader;
