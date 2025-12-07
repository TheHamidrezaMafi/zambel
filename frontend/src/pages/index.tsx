import FlightSearch from '@/components/flight-search';
import HotelSearch from '@/components/hotel-search';
import Tabs from '@/components/common/tabs';
import { useRouter } from 'next/router';
import TripMaker from '@/components/trip-maker';
import { Layout } from '@/components/layout/Layout';

const list = [
  { label: 'پرواز', value: 'flight', disabled: false },
  { label: 'هتل', value: 'hotel', disabled: true },
  { label: 'سفرساز', value: 'trip', disabled: true },
];

export default function Home() {
  const { query } = useRouter();
  const { selectedTab } = query ?? {};

  return (
    <Layout>
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          {/* Hero Text */}
          <div className="text-center mb-8 md:mb-10">
            <div className="inline-flex items-center gap-2 glass rounded-full px-3 py-1.5 mb-4 opacity-0 animate-slide-up">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
              <span className="text-xs text-muted-foreground">بهترین قیمت‌ها را پیدا کنید</span>
            </div>
            
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-3 opacity-0 animate-slide-up animate-delay-100">
              <span className="text-foreground">سفر با </span>
              <span className="gradient-text">زمبیل</span>
            </h1>
            
            <p className="text-sm md:text-base text-muted-foreground max-w-lg mx-auto opacity-0 animate-slide-up animate-delay-200">
              مقایسه قیمت از صدها ایرلاین. ارزان‌ترین پروازها را پیدا کنید.
            </p>
          </div>

          {/* Search Form */}
          <div className="opacity-0 animate-slide-up animate-delay-300">
            <div className="w-full max-w-5xl mx-auto">
              <div className="glass-strong rounded-2xl p-6 md:p-8 glow-primary">
                <Tabs queryKey="selectedTab" list={list} defaultTab="flight" />
                <div className="border-b border-border/50 my-5 md:my-6" />
                {(selectedTab === 'flight' || selectedTab === undefined) && (
                  <FlightSearch />
                )}
                {selectedTab === 'hotel' && <HotelSearch />}
                {selectedTab === 'trip' && <TripMaker />}
              </div>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-12 opacity-0 animate-slide-up animate-delay-400">
            {[
              { value: "۵۰۰+", label: "ایرلاین" },
              { value: "۱۰۰M+", label: "مسافر" },
              { value: "۲۴/۷", label: "پشتیبانی" },
              { value: "بهترین", label: "قیمت‌ها" },
            ].map((badge, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl md:text-3xl font-bold gradient-text">{badge.value}</p>
                <p className="text-sm text-muted-foreground">{badge.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
