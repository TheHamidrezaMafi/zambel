import { convertDateToTime } from '@/helper/dateConverter';
import { ConvertRialToToman } from '@/helper/rilaToToman';
import { GroupedFlight, PricingOption } from '@/types/unified-flight.types';
import { useState } from 'react';
import { FaPlane, FaChevronDown, FaChevronUp, FaInfoCircle } from 'react-icons/fa';
import AirlineIcon from '../common/icons/AirlineIcon';
import PriceHistoryModal from '../price-history-modal';

interface UnifiedFlightCardProps {
  flight: GroupedFlight;
}

const UnifiedFlightCard = ({ flight }: UnifiedFlightCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const {
    base_flight_id,
    flight_number,
    airline,
    route,
    schedule,
    lowestPrice,
    highestPrice,
    availableProviders,
    pricingOptions,
  } = flight;

  // Sort pricing options by price (lowest first)
  const sortedOptions = [...pricingOptions].sort((a, b) => a.price - b.price);
  const lowestPriceOption = sortedOptions[0];

  // Use duration from schedule (already calculated by backend)
  const durationHours = Math.floor(schedule.duration_minutes / 60);
  const durationMinutes = schedule.duration_minutes % 60;

  return (
    <div className="border rounded-2xl shadow-md hover:shadow-xl bg-card p-5 md:p-6 w-full transition-all duration-300 ease-in-out border-border/60 hover:border-primary/20">
      {/* Flight Header */}
      <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/40">
        {/* Airline Logo */}
        <div className="flex flex-col items-center gap-1">
          {airline.logo_url ? (
            <img
              alt={airline.name_fa}
              className="rounded-full bg-white p-1 border border-border w-12 h-12 object-contain"
              src={airline.logo_url}
            />
          ) : (
            <div className="size-12 rounded-full bg-muted flex items-center justify-center border border-border">
              <AirlineIcon size={28} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex items-center gap-1">
            <p className="text-xs text-muted-foreground">{flight_number}</p>
            <div className="relative group">
              <FaInfoCircle className="text-xs text-muted-foreground hover:text-primary cursor-help" />
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
                ID: {base_flight_id}
              </div>
            </div>
          </div>
        </div>

        {/* Flight Route & Time */}
        <div className="flex-1 flex items-center justify-between gap-4">
          {/* Departure */}
          <div className="flex flex-col items-center">
            <p className="font-bold text-xl text-foreground">{convertDateToTime(schedule.departure_datetime)}</p>
            <p className="text-sm font-medium text-muted-foreground">{route.origin}</p>
          </div>

          {/* Duration */}
          <div className="flex flex-col items-center flex-1 px-2">
            <div className="flex items-center gap-2 w-full">
              <div className="h-[2px] flex-1 bg-gradient-to-r from-border via-primary/40 to-border relative">
                <FaPlane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary rotate-180 text-sm" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {durationHours > 0 && `${durationHours} ساعت `}
              {durationMinutes > 0 && `${durationMinutes} دقیقه`}
            </p>
            {schedule.stops > 0 && (
              <p className="text-xs text-orange-500">{schedule.stops} توقف</p>
            )}
          </div>

          {/* Arrival */}
          <div className="flex flex-col items-center">
            <p className="font-bold text-xl text-foreground">{convertDateToTime(schedule.arrival_datetime)}</p>
            <p className="text-sm font-medium text-muted-foreground">{route.destination}</p>
          </div>
        </div>

        {/* Airline Name */}
        <div className="hidden md:flex flex-col items-end">
          <p className="text-sm font-medium text-foreground">{airline.name_fa}</p>
          <p className="text-xs text-muted-foreground">{airline.name_en}</p>
        </div>
      </div>

      {/* Price History Button */}
      <div className="mb-4">
        <PriceHistoryModal
          flightNumber={flight_number}
          date={schedule.departure_datetime.split('T')[0]}
          origin={route.origin}
          destination={route.destination}
        />
      </div>

      {/* Pricing Section */}
      <div className="space-y-3">
        {/* Lowest Price Display (Always Visible) */}
        {!isExpanded && lowestPriceOption && (
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border-2 border-primary/20">
            <div className="flex items-center gap-4 flex-1">
              {/* Provider Badge */}
              <div className={`px-3 py-1.5 rounded-lg text-sm font-semibold border ${getBadgeColor(lowestPriceOption.provider)}`}>
                {lowestPriceOption.provider}
              </div>

              {/* Quick Details */}
              <div className="flex items-center gap-3 text-sm">
                <span className={`px-2 py-1 rounded font-medium ${lowestPriceOption.is_refundable ? 'bg-green-500/15 text-green-700' : 'bg-red-500/15 text-red-700'}`}>
                  {lowestPriceOption.is_refundable ? 'قابل استرداد' : 'غیرقابل استرداد'}
                </span>
                {lowestPriceOption.is_charter && (
                  <span className="px-2 py-1 rounded font-medium bg-orange-500/15 text-orange-700">چارتر</span>
                )}
                <span className="px-2 py-1 rounded font-medium bg-muted text-foreground">
                  {lowestPriceOption.capacity} صندلی
                </span>
                <span className="text-muted-foreground">{lowestPriceOption.cabin_class_fa}</span>
              </div>

              {/* Available Offers Indicator */}
              {pricingOptions.length > 1 && (
                <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
                  +{pricingOptions.length - 1} پیشنهاد دیگر
                </div>
              )}
            </div>

            {/* Price & Actions */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{ConvertRialToToman(lowestPrice)}</p>
                <p className="text-xs text-muted-foreground">تومان</p>
                {lowestPrice !== highestPrice && (
                  <p className="text-xs text-muted-foreground mt-1">
                    تا {ConvertRialToToman(highestPrice)}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                  خرید بلیط
                </button>
                {pricingOptions.length > 1 && (
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="px-5 py-2 border border-primary text-primary hover:bg-primary/10 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <span>مشاهده همه</span>
                    <FaChevronDown className="text-xs" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expanded View - All Pricing Options */}
        {isExpanded && (
          <>
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-foreground">همه پیشنهادها</span>
                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                  {pricingOptions.length} گزینه از {availableProviders} منبع
                </span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-sm text-muted-foreground hover:text-foreground font-medium flex items-center gap-2 transition-colors"
              >
                <span>بستن</span>
                <FaChevronUp className="text-xs" />
              </button>
            </div>

            {/* All Options List */}
            <div className="space-y-2">
              {sortedOptions.map((option: PricingOption, index: number) => (
                <PricingOptionRow 
                  key={`${option.provider}-${option.price}-${index}`} 
                  option={option}
                  isLowest={index === 0}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Helper function for provider badge colors
const getBadgeColor = (provider: string) => {
  const colors: Record<string, string> = {
    alibaba: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    safar366: 'bg-green-500/10 text-green-600 border-green-500/20',
    mrbilit: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    safarmarket: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    pateh: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    flytoday: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  };
  return colors[provider] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
};

// Pricing Option Row Component
const PricingOptionRow = ({ option, isLowest = false }: { option: PricingOption; isLowest?: boolean }) => {

  return (
    <div className={`flex items-center justify-between p-3 rounded-xl transition-all border ${
      isLowest 
        ? 'bg-primary/5 border-primary/30 hover:border-primary/50' 
        : 'bg-muted/30 hover:bg-muted/50 border-border/40 hover:border-primary/20'
    }`}>
      <div className="flex items-center gap-3 flex-1">
        {/* Provider Badge with Lowest Price Indicator */}
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${getBadgeColor(option.provider)}`}>
            {option.provider}
          </div>
          {isLowest && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-bold">
              ارزان‌ترین
            </span>
          )}
        </div>

        {/* Details */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className={`px-2 py-0.5 rounded font-medium ${option.is_refundable ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
            {option.is_refundable ? 'قابل استرداد' : 'غیرقابل استرداد'}
          </span>
          {option.is_charter && (
            <span className="px-2 py-0.5 rounded font-medium bg-orange-500/10 text-orange-600">چارتر</span>
          )}
          <span className="px-2 py-0.5 rounded font-medium bg-muted text-foreground">
            {option.capacity} صندلی
          </span>
          <span className="font-medium">{option.cabin_class_fa}</span>
        </div>
      </div>

      {/* Price & Action */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className={`text-lg font-bold ${isLowest ? 'text-primary' : 'text-foreground'}`}>
            {ConvertRialToToman(option.price)}
          </p>
          <p className="text-xs text-muted-foreground">تومان</p>
        </div>
        <button className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
          خرید بلیط
        </button>
      </div>
    </div>
  );
};

export default UnifiedFlightCard;
