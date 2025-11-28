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
      <div className="min-h-[calc(100vh-4rem)] w-full flex flex-col items-center justify-center py-8 md:py-12 px-4 bg-gradient-to-br from-background via-background to-muted/20">
        {/* Hero Section / Search Container */}
        <div className="w-full max-w-5xl space-y-6 md:space-y-10">
          <div className="text-center space-y-3 md:space-y-5">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground tracking-tight leading-tight">
              سفر خود را آغاز کنید
            </h1>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              بهترین قیمت بلیط هواپیما و رزرو هتل را با زمبیل تجربه کنید.
            </p>
          </div>

          <div className="bg-card border border-border/60 rounded-3xl shadow-2xl p-5 md:p-8 lg:p-10 backdrop-blur-sm">
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
    </Layout>
  );
}
