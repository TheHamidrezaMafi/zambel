import { convertDateToTime } from '@/helper/dateConverter';
import { ConvertRialToToman } from '@/helper/rilaToToman';
import { FlightData } from '@/types/flight-response';
import Image from 'next/image';
import { providerNameList } from '../flight-search/constants';
import { useState } from 'react';
import AirlineIcon from '../common/icons/AirlineIcon';

const FlightCard = ({
  flight,
  cityList,
  airlineList,
}: {
  flight: FlightData;
  cityList?: any;
  airlineList?: any;
}) => {
  const {
    origin,
    destination,
    airline_name_fa,
    arrival_date_time,
    departure_date_time,
    adult_price,
    provider_name,
    capacity,
  } = flight;

  const isSubmitDisabled = true;
  const getProviderName = (name: string) => {
    let providerName = name;

    providerNameList.find((item) => {
      if (name.startsWith(item.value)) {
        providerName = providerName.replace(item.value, item.label);
      }
    });

    return providerName;
  };
  const airline = airlineList.find(
    (airline: any) => airline.persian_name === airline_name_fa
  );

  const [imageError, setImageError] = useState(false);

  return (
    <div className="w-full">
      <div
        className={`border shadow-md hover:shadow-xl mx-auto flex bg-card flex-col border-border/60 w-full rounded-2xl transition-all duration-300 hover:border-primary/20 ${
          capacity <= 0 ? 'opacity-60 grayscale' : ''
        }`}
      >
        {/* header */}
        <div className="w-full px-5 py-3 flex justify-between items-center border-b border-border/50 bg-muted/10 rounded-t-2xl">
          <div className="flex items-center gap-2">
             <span className="text-xs md:text-sm text-muted-foreground bg-background px-2 py-1 rounded-md border border-border">
              سیستمی
            </span>
             <span className="text-xs md:text-sm text-muted-foreground">
              {capacity > 0 ? `${capacity} صندلی باقی‌مانده` : 'تکمیل ظرفیت'}
            </span>
          </div>
          {airline && !imageError ? (
            <div className="flex items-center gap-2">
               <span className="text-sm font-medium text-foreground hidden md:block">{airline_name_fa}</span>
               <Image
                width={40}
                height={40}
                className="rounded-full w-8 h-8 md:w-10 md:h-10 object-contain bg-white p-1 border border-border"
                alt={airline_name_fa}
                src={airline.logo_url}
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
               <span className="text-sm font-medium text-foreground hidden md:block">{airline_name_fa}</span>
               <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                <AirlineIcon size={20} className="text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        {/* body */}
        <div className="flex flex-col md:flex-row gap-4 p-4 md:p-6">
          {/* legs */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <div className="flex flex-col items-center">
                 <span className="font-bold text-lg md:text-xl text-foreground">
                  {departure_date_time
                    ? convertDateToTime(departure_date_time)
                    : '-:-'}
                </span>
                <span className="text-xs md:text-sm text-muted-foreground mt-1">
                  {
                    cityList.find(
                      (city: any) => city.value === origin.toUpperCase()
                    )?.label
                  }
                </span>
              </div>

              <div className="flex-1 px-4 flex flex-col items-center">
                 <div className="w-full flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary/20 border border-primary"></div>
                    <div className="h-[1px] flex-1 bg-border relative">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2">
                          <AirlineIcon size={14} className="text-muted-foreground rotate-90" />
                       </div>
                    </div>
                    <div className="h-2 w-2 rounded-full bg-primary"></div>
                 </div>
                 <span className="text-xs text-muted-foreground mt-2">مدت سفر</span>
              </div>

              <div className="flex flex-col items-center">
                <span className="font-bold text-lg md:text-xl text-foreground">
                  {arrival_date_time
                    ? convertDateToTime(arrival_date_time)
                    : '-:-'}
                </span>
                 <span className="text-xs md:text-sm text-muted-foreground mt-1">
                  {
                    cityList.find(
                      (city: any) => city.value === destination.toUpperCase()
                    )?.label
                  }
                </span>
              </div>
            </div>
            
            <div className="flex justify-end mt-2">
               <p className="text-xs text-muted-foreground bg-muted/30 px-2 py-1 rounded">
                تامین کننده: {getProviderName(provider_name)}
              </p>
            </div>
          </div>

          {/* Divider for mobile */}
          <div className="h-[1px] w-full bg-border md:hidden"></div>
          
          {/* Divider for desktop */}
          <div className="w-[1px] h-auto bg-border hidden md:block"></div>

          {/* Price & Action */}
          <div className="flex md:flex-col justify-between items-center md:justify-center gap-3 md:min-w-[180px]">
            <div className="flex flex-col items-end md:items-center">
              <div className="flex items-center gap-1">
                <span className="text-xl md:text-2xl text-primary font-bold">
                  {adult_price ? ConvertRialToToman(adult_price) : '0'}
                </span>
                <span className="text-xs font-medium text-muted-foreground">
                  تومان
                </span>
              </div>
              <span className="text-xs text-muted-foreground hidden md:inline-block">قیمت برای یک بزرگسال</span>
            </div>
            
            <button
              disabled={isSubmitDisabled}
              className={`text-sm md:text-base font-semibold rounded-xl md:rounded-2xl flex items-center justify-center h-11 md:h-12 px-6 md:px-8 transition-all duration-200 w-full md:w-auto ${
                isSubmitDisabled 
                  ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                  : 'bg-primary hover:bg-primary/90 shadow-sm hover:shadow-md active:scale-95 text-gray-900'
              }`}
            >
              {capacity ? 'انتخاب پرواز' : 'ناموجود'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlightCard;
