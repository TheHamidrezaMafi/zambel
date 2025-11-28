import { convertDateToTime, getDurationTime } from '@/helper/dateConverter';
import { ConvertRialToToman } from '@/helper/rilaToToman';
import Image from 'next/image';
import PropTypes from 'prop-types';
import { FaPlane, FaInfoCircle } from 'react-icons/fa';
import { ArrowSmall } from '../common/icons';
import { useState, useRef, useEffect } from 'react';
import DetailCard from './detail-card';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import AirlineIcon from '../common/icons/AirlineIcon';

const GroupFlightCard = ({ flight, airlineList }: any) => {
  const {
    origin,
    destination,
    flight_number,
    airline_name_fa,
    arrival_date_time,
    departure_date_time,
    flights,
  } = flight;

  const [showMore, setShowMore] = useState(false);
  const [showFlightCodes, setShowFlightCodes] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { query } = useRouter();
  const orderBy = (query.orderBy as string) || 'lowest_price';

  const isSubmitDisabled = flights.length === 0;
  const price =
    orderBy === 'highest_price'
      ? Math.max(...flights.map((flight: any) => flight.adult_price))
      : Math.min(...flights.map((flight: any) => flight.adult_price));
  const airline = airlineList.find(
    (airline: any) => airline.persian_name === airline_name_fa
  );

  // Get unique original flight numbers from all combined flights
  const originalFlightNumbers: string[] = Array.from(
    new Set(flights.map((f: any) => f.original_flight_number || f.flight_number))
  );

  // Calculate popup position relative to button
  useEffect(() => {
    if (showFlightCodes && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setPopupPosition({
        top: rect.top - 10, // Position above button with some margin
        left: rect.left + rect.width / 2, // Center horizontally
      });
    }
  }, [showFlightCodes]);

  return (
    <div
      className={`border rounded-2xl shadow-md hover:shadow-xl bg-card p-5 md:p-6 w-full transition-all duration-300 ease-in-out border-border/60 hover:border-primary/20 ${
        showMore ? 'max-h-[10000px] overflow-visible' : 'max-h-[300px] overflow-hidden'
      }`}
    >
      <div className="flex w-full gap-4 flex-col sm:flex-row">
        <div className="flex flex-col w-full sm:w-[70%] sm:py-2">
          <div className="flex flex-col flex-grow gap-1">
            <div className="flex gap-4 items-start flex-grow">
              <div className="flex flex-col items-center gap-2 relative">
                {airline && !imageError ? (
                  <Image
                    alt={airline_name_fa}
                    className="rounded-full bg-white p-1 border border-border"
                    height={48}
                    width={48}
                    src={airline.logo_url}
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center border border-border">
                    <AirlineIcon size={28} className="text-muted-foreground" />
                  </div>
                )}
                
                {/* Flight code and info button under the image */}
                <div className="flex items-center gap-1">
                  <p className="text-xs text-muted-foreground text-center">
                    {flight_number}
                  </p>
                  <button
                    ref={buttonRef}
                    onClick={() => setShowFlightCodes(!showFlightCodes)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="نمایش کدهای پرواز"
                  >
                    <FaInfoCircle className="text-xs" />
                  </button>
                </div>
              </div>
              
              <div className="flex gap-3 items-center flex-grow">
                <div className="flex flex-col gap-0.5 items-center">
                  <p className="font-bold text-lg text-foreground"> {convertDateToTime(departure_date_time)}</p>
                  <p className="text-xs text-muted-foreground">
                    {origin.toUpperCase()}
                  </p>
                </div>

                <div className="flex flex-col gap-0.5 items-center flex-grow pb-4">
                  <div className="text-muted-foreground text-xs">
                    مدت سفر:
                    <span className="ml-1">
                      {getDurationTime(departure_date_time, arrival_date_time)}
                    </span>
                  </div>

                  <div className="flex items-center w-full gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/20 border border-primary"></div>
                    <div className="flex-grow h-[1px] bg-border relative">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-1">
                          <FaPlane className="rotate-180 text-muted-foreground text-xs" />
                       </div>
                    </div>
                    <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                  </div>
                </div>

                <div className="flex flex-col gap-0.5 items-center">
                  <p className="font-bold text-lg text-foreground"> {convertDateToTime(arrival_date_time)}</p>
                  <p className="text-xs text-muted-foreground">
                    {destination.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground sm:mb-2 text-center w-[48px] min-w-[fit-content]">
              {airline_name_fa}
            </p>
          </div>
        </div>

        <div className="w-full sm:w-[1px] bg-border sm:h-auto h-[1px] self-stretch"></div>

        <div className="flex flex-row sm:flex-col w-full sm:w-[30%] sm:py-2 gap-2 justify-center">
          <div className="test-left sm:text-center flex flex-col gap-0.5 flex-grow justify-center">
            <p className="text-xs text-muted-foreground">هر بزرگسال</p>
            <p className="font-bold text-xl text-primary">
              {price ? ConvertRialToToman(price) : 'NaN'}{' '}
              <span className="text-sm font-normal text-muted-foreground">تومان</span>
            </p>
          </div>

          <button
            disabled={isSubmitDisabled}
            className="flex items-center gap-2 justify-center text-sm font-semibold bg-primary text-primary-foreground mt-2 px-5 py-3 rounded-2xl hover:bg-primary/90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
            onClick={() => setShowMore(!showMore)}
          >
            {`${flights.length} سایت دیگر`}
            <ArrowSmall
              className={`transition-transform duration-200 ${
                showMore ? '-rotate-90' : 'rotate-90'
              } fill-primary-foreground`}
            />
          </button>
        </div>
      </div>

      {showMore && (
        <div>
          <div className="h-[1px] bg-border self-stretch mt-3"></div>

          <div
            className={`flex flex-col gap-4 mt-3 transition-all duration-300 overflow-auto ${
              showMore ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'
            }`}
          >
            {flights.map((flight: any) => (
              <DetailCard key={flight.id} flight={flight} />
            ))}
          </div>
        </div>
      )}

      {/* Portal for popup - renders outside card hierarchy */}
      {showFlightCodes && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setShowFlightCodes(false)}
          />
          {/* Popup */}
          <div 
            className="fixed z-50 bg-popover border border-border rounded-lg shadow-2xl p-3 min-w-[150px]"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              transform: 'translate(-50%, -100%)',
            }}
          >
            <div className="text-xs text-foreground mb-1 font-semibold">کدهای پرواز:</div>
            <div className="flex flex-col gap-1">
              {originalFlightNumbers.map((code: string, index: number) => (
                <div key={index} className="text-xs text-muted-foreground">
                  {code}
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowFlightCodes(false)}
              className="mt-2 text-xs text-primary hover:text-primary/80 w-full"
            >
              بستن
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
};

GroupFlightCard.propTypes = {
  flight: PropTypes.object,
};

export default GroupFlightCard;
