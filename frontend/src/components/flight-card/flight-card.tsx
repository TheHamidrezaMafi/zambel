'use client';

import { convertDateToTime } from '@/helper/dateConverter';
import { ConvertRialToToman } from '@/helper/rilaToToman';
import { FlightData } from '@/types/flight-response';
import Image from 'next/image';
import { providerNameList } from '../flight-search/constants';
import { useState } from 'react';
import AirlineIcon from '../common/icons/AirlineIcon';
import PriceHistoryModal from '../price-history-modal';

const FlightCard = ({
  flight,
  cityList,
  airlineList,
  delay = 0,
}: {
  flight: FlightData;
  cityList?: any;
  airlineList?: any;
  delay?: number;
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
    <div
      className="glass-strong rounded-2xl p-5 md:p-6 hover:glow-primary transition-all duration-500 group opacity-0 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        {/* Airline Info */}
        <div className="flex items-center gap-4 lg:w-40">
          {airline && !imageError ? (
            <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center overflow-hidden">
              <Image
                width={40}
                height={40}
                className="w-10 h-10 object-contain"
                alt={airline_name_fa}
                src={airline.logo_url}
                onError={() => setImageError(true)}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center">
              <AirlineIcon size={24} className="text-muted-foreground" />
            </div>
          )}
          <div>
            <p className="font-medium text-foreground">{airline_name_fa}</p>
            <p className="text-xs text-muted-foreground">
              {capacity > 0 ? `${capacity} صندلی` : 'تکمیل ظرفیت'}
            </p>
          </div>
        </div>

        {/* Flight Timeline */}
        <div className="flex-1 flex items-center gap-4">
          {/* Departure */}
          <div className="text-center min-w-[70px]">
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {departure_date_time ? convertDateToTime(departure_date_time) : '-:-'}
            </p>
            <p className="text-sm text-muted-foreground">
              {cityList.find((city: any) => city.value === origin.toUpperCase())?.label}
            </p>
          </div>

          {/* Timeline */}
          <div className="flex-1 flex flex-col items-center gap-1 px-2">
            <div className="flex items-center w-full gap-2">
              <div className="w-2 h-2 rounded-full bg-primary glow-primary" />
              <div className="flex-1 h-[2px] bg-gradient-to-l from-primary via-accent to-primary relative overflow-hidden">
                <div 
                  className="absolute inset-0 bg-gradient-to-l from-transparent via-foreground/30 to-transparent animate-shimmer" 
                  style={{ backgroundSize: "200% 100%" }} 
                />
              </div>
              <svg className="w-4 h-4 text-primary rotate-[135deg] group-hover:-translate-x-1 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
              </svg>
              <div className="flex-1 h-[2px] bg-gradient-to-l from-primary via-accent to-primary relative overflow-hidden">
                <div 
                  className="absolute inset-0 bg-gradient-to-l from-transparent via-foreground/30 to-transparent animate-shimmer"
                  style={{ backgroundSize: "200% 100%" }}
                />
              </div>
              <div className="w-2 h-2 rounded-full bg-accent glow-accent" />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              <span>مدت سفر</span>
            </div>
          </div>

          {/* Arrival */}
          <div className="text-center min-w-[70px]">
            <p className="text-xl md:text-2xl font-bold text-foreground">
              {arrival_date_time ? convertDateToTime(arrival_date_time) : '-:-'}
            </p>
            <p className="text-sm text-muted-foreground">
              {cityList.find((city: any) => city.value === destination.toUpperCase())?.label}
            </p>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between lg:flex-col lg:items-end gap-3 lg:gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/30">
          <div className="text-right">
            <p className="text-2xl md:text-3xl font-bold gradient-text">
              {adult_price ? ConvertRialToToman(adult_price) : '۰'}
              <span className="text-sm font-normal text-muted-foreground mr-1">تومان</span>
            </p>
            <p className="text-xs text-muted-foreground">برای یک نفر</p>
          </div>
          <button
            disabled={isSubmitDisabled}
            className={`gradient-primary text-primary-foreground font-semibold rounded-xl px-6 py-3 transition-all duration-300 flex items-center gap-2 group/btn ${
              isSubmitDisabled 
                ? 'opacity-50 cursor-not-allowed' 
                : 'glow-primary hover:opacity-90 hover:scale-[1.02]'
            }`}
          >
            <span>{capacity ? 'انتخاب' : 'ناموجود'}</span>
            <svg className="w-4 h-4 group-hover/btn:-translate-x-1 transition-transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Provider Badge & Price History */}
      <div className="flex justify-between items-center mt-3">
        <PriceHistoryModal
          flightNumber={flight.flight_number || ''}
          date={flight.departure_date_time?.split('T')[0] || ''}
          origin={origin}
          destination={destination}
        />
        <p className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full">
          تامین کننده: {getProviderName(provider_name)}
        </p>
      </div>
    </div>
  );
};

export default FlightCard;
