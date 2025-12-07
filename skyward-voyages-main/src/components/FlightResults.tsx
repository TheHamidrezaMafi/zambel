import { SlidersHorizontal, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import FlightCard from "./FlightCard";

const flightsData = [
  {
    airline: "Kish Air",
    airlineLogo: "✈️",
    departureTime: "06:20",
    arrivalTime: "07:50",
    origin: "THR",
    destination: "KIH",
    duration: "1h 30m",
    price: 4974900,
    currency: "﷼",
    stops: 0,
  },
  {
    airline: "Iran Air",
    airlineLogo: "🛫",
    departureTime: "08:45",
    arrivalTime: "10:20",
    origin: "THR",
    destination: "KIH",
    duration: "1h 35m",
    price: 5125600,
    currency: "﷼",
    stops: 0,
  },
  {
    airline: "Mahan Air",
    airlineLogo: "🌟",
    departureTime: "12:00",
    arrivalTime: "13:40",
    origin: "THR",
    destination: "KIH",
    duration: "1h 40m",
    price: 4850000,
    currency: "﷼",
    stops: 0,
  },
  {
    airline: "Qeshm Air",
    airlineLogo: "💫",
    departureTime: "16:30",
    arrivalTime: "18:15",
    origin: "THR",
    destination: "KIH",
    duration: "1h 45m",
    price: 5250000,
    currency: "﷼",
    stops: 0,
  },
];

const FlightResults = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Tehran → Kish
            </h2>
            <p className="text-muted-foreground mt-1">
              {flightsData.length} flights found • Dec 10, 2025
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="glass" size="sm" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filter</span>
            </Button>
            <Button variant="glass" size="sm" className="gap-2">
              <ArrowUpDown className="w-4 h-4" />
              <span>Sort</span>
            </Button>
          </div>
        </div>

        {/* Flight Cards */}
        <div className="space-y-4">
          {flightsData.map((flight, index) => (
            <FlightCard key={index} {...flight} delay={index * 100} />
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-8">
          <Button variant="outline" size="lg">
            Load More Flights
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FlightResults;
