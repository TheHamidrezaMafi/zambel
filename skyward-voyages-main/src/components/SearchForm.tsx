import { useState } from "react";
import { Plane, ArrowRightLeft, Calendar, Users, Search, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

type TripType = "one-way" | "round-trip";

const SearchForm = () => {
  const [tripType, setTripType] = useState<TripType>("one-way");
  const [origin, setOrigin] = useState("Tehran (THR)");
  const [destination, setDestination] = useState("Kish (KIH)");
  const [isSwapping, setIsSwapping] = useState(false);

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => {
      const temp = origin;
      setOrigin(destination);
      setDestination(temp);
      setIsSwapping(false);
    }, 300);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Trip Type Selector */}
      <div className="flex justify-center mb-6">
        <div className="glass rounded-full p-1.5 inline-flex gap-1">
          <button
            onClick={() => setTripType("one-way")}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              tripType === "one-way"
                ? "gradient-primary text-primary-foreground glow-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            One Way
          </button>
          <button
            onClick={() => setTripType("round-trip")}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              tripType === "round-trip"
                ? "gradient-primary text-primary-foreground glow-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Round Trip
          </button>
        </div>
      </div>

      {/* Search Form */}
      <div className="glass-strong rounded-2xl p-6 md:p-8 glow-primary">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Origin & Destination */}
          <div className="lg:col-span-5 flex flex-col md:flex-row gap-4 relative">
            {/* Origin */}
            <div className="flex-1 group">
              <label className="text-xs text-muted-foreground mb-2 block">From</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className={`w-full bg-secondary/50 border border-border/50 rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 ${
                    isSwapping ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                  }`}
                  placeholder="Select origin"
                />
              </div>
            </div>

            {/* Swap Button */}
            <button
              onClick={handleSwap}
              className="absolute left-1/2 md:left-auto md:right-0 top-[60px] md:top-1/2 -translate-x-1/2 md:translate-x-1/2 md:-translate-y-1/2 z-10 w-10 h-10 rounded-full bg-secondary border border-border/50 flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 hover:rotate-180"
            >
              <ArrowRightLeft className="w-4 h-4" />
            </button>

            {/* Destination */}
            <div className="flex-1 group">
              <label className="text-xs text-muted-foreground mb-2 block">To</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-accent" />
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className={`w-full bg-secondary/50 border border-border/50 rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 ${
                    isSwapping ? "opacity-0 -translate-y-2" : "opacity-100 translate-y-0"
                  }`}
                  placeholder="Select destination"
                />
              </div>
            </div>
          </div>

          {/* Date */}
          <div className="lg:col-span-3">
            <label className="text-xs text-muted-foreground mb-2 block">Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                defaultValue="Dec 10, 2025"
                className="w-full bg-secondary/50 border border-border/50 rounded-xl py-3.5 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300"
                placeholder="Select date"
              />
            </div>
          </div>

          {/* Passengers */}
          <div className="lg:col-span-2">
            <label className="text-xs text-muted-foreground mb-2 block">Passengers</label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <select className="w-full bg-secondary/50 border border-border/50 rounded-xl py-3.5 pl-11 pr-4 text-foreground appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 cursor-pointer">
                <option>1 Adult</option>
                <option>2 Adults</option>
                <option>3 Adults</option>
                <option>4 Adults</option>
              </select>
            </div>
          </div>

          {/* Search Button */}
          <div className="lg:col-span-2 flex items-end">
            <Button variant="gradient" size="xl" className="w-full">
              <Search className="w-5 h-5" />
              <span>Search</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchForm;
