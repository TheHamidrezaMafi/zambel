import React, { useEffect, useState } from 'react';
import { GroupedFlight } from '@/types/unified-flight.types';
import { ConvertRialToToman } from '@/helper/rilaToToman';
import { convertDateToTime } from '@/helper/dateConverter';
import AirlineIcon from '../common/icons/AirlineIcon';

interface AnimatedFlightCardProps {
  flight: GroupedFlight;
  isNew?: boolean;
  hasUpdate?: boolean;
}

const AnimatedFlightCard: React.FC<AnimatedFlightCardProps> = ({
  flight,
  isNew = false,
  hasUpdate = false,
}) => {
  const [showAnimation, setShowAnimation] = useState(false);
  const [pulseCount, setPulseCount] = useState(0);

  useEffect(() => {
    if (isNew) {
      setShowAnimation(true);
      const timer = setTimeout(() => setShowAnimation(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  useEffect(() => {
    if (hasUpdate) {
      setPulseCount((prev) => prev + 1);
      const timer = setTimeout(() => setPulseCount(0), 1000);
      return () => clearTimeout(timer);
    }
  }, [hasUpdate]);

  const lowestOption = flight.pricingOptions.reduce((min, opt) =>
    opt.price < min.price ? opt : min,
  );

  return (
    <div
      className={`
        glass rounded-2xl p-4 md:p-6 transition-all duration-500
        ${showAnimation ? 'animate-slide-in-up opacity-0' : 'opacity-100'}
        ${pulseCount > 0 ? 'animate-pulse-glow' : ''}
        hover:glow-primary group cursor-pointer
      `}
    >
      {/* Provider Badge - Shows update animation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="size-10 rounded-full glass-strong flex items-center justify-center">
            {flight.airline.logo_url ? (
              <img
                alt={flight.airline.name_fa}
                className="rounded-full bg-white p-1 border border-border w-10 h-10 object-contain"
                src={flight.airline.logo_url}
              />
            ) : (
              <AirlineIcon size={24} className="text-muted-foreground" />
            )}
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-foreground">
              {flight.airline.name_fa}
            </h3>
            <p className="text-xs text-muted-foreground">
              پرواز {flight.flight_number}
            </p>
          </div>
        </div>

        {/* Available Providers Badge with animation */}
        <div
          className={`
            glass-strong rounded-full px-3 py-1 transition-all duration-300
            ${hasUpdate ? 'scale-110 glow-accent' : 'scale-100'}
          `}
        >
          <span className="text-xs font-bold text-accent">
            {flight.availableProviders} منبع
          </span>
        </div>
      </div>

      {/* Flight Route */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 text-center">
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {convertDateToTime(flight.schedule.departure_datetime)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {flight.route.origin_city_fa}
          </p>
          {flight.route.origin_terminal && (
            <p className="text-xs text-muted-foreground">
              ترمینال {flight.route.origin_terminal}
            </p>
          )}
        </div>

        <div className="flex-1 flex flex-col items-center px-4">
          <svg
            className="w-6 h-6 text-primary mb-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
          <div className="text-xs text-muted-foreground">
            {Math.floor(flight.schedule.duration_minutes / 60)}h{' '}
            {flight.schedule.duration_minutes % 60}m
          </div>
          {flight.schedule.stops === 0 ? (
            <div className="text-xs text-success">مستقیم</div>
          ) : (
            <div className="text-xs text-warning">
              {flight.schedule.stops} توقف
            </div>
          )}
        </div>

        <div className="flex-1 text-center">
          <p className="text-2xl md:text-3xl font-bold text-foreground">
            {convertDateToTime(flight.schedule.arrival_datetime)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {flight.route.destination_city_fa}
          </p>
          {flight.route.destination_terminal && (
            <p className="text-xs text-muted-foreground">
              ترمینال {flight.route.destination_terminal}
            </p>
          )}
        </div>
      </div>

      {/* Price Section with update animation */}
      <div className="border-t border-border/50 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <div
              className={`
                text-2xl md:text-3xl font-bold gradient-text transition-all duration-300
                ${hasUpdate ? 'scale-110' : 'scale-100'}
              `}
            >
              {ConvertRialToToman(flight.lowestPrice).toLocaleString('fa-IR')}
              <span className="text-lg mr-1">تومان</span>
            </div>
            {flight.lowestPrice !== flight.highestPrice && (
              <p className="text-xs text-muted-foreground mt-1">
                تا {ConvertRialToToman(flight.highestPrice).toLocaleString('fa-IR')}{' '}
                تومان
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-muted-foreground">
                {lowestOption.provider}
              </span>
              {lowestOption.capacity && (
                <span className="text-xs text-success">
                  {lowestOption.capacity} صندلی
                </span>
              )}
            </div>
          </div>

          <button className="btn-primary px-6 py-3 rounded-xl font-bold group-hover:scale-105 transition-transform">
            مشاهده و خرید
          </button>
        </div>

        {/* Pricing Options Count */}
        {flight.pricingOptions.length > 1 && (
          <div
            className={`
              mt-3 text-center text-xs text-muted-foreground transition-all duration-300
              ${hasUpdate ? 'text-accent font-bold' : ''}
            `}
          >
            {flight.pricingOptions.length} گزینه قیمتی موجود
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimatedFlightCard;
