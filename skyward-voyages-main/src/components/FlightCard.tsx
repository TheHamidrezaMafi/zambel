import { Plane, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FlightCardProps {
  airline: string;
  airlineLogo: string;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  duration: string;
  price: number;
  currency: string;
  stops: number;
  delay?: number;
}

const FlightCard = ({
  airline,
  airlineLogo,
  departureTime,
  arrivalTime,
  origin,
  destination,
  duration,
  price,
  currency,
  stops,
  delay = 0,
}: FlightCardProps) => {
  return (
    <div
      className="glass-strong rounded-2xl p-5 md:p-6 hover:glow-primary transition-all duration-500 group opacity-0 animate-slide-up"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "forwards" }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
        {/* Airline Info */}
        <div className="flex items-center gap-4 lg:w-40">
          <div className="w-12 h-12 rounded-xl bg-secondary/80 flex items-center justify-center text-2xl">
            {airlineLogo}
          </div>
          <div>
            <p className="font-medium text-foreground">{airline}</p>
            <p className="text-xs text-muted-foreground">
              {stops === 0 ? "Direct" : `${stops} Stop${stops > 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Flight Timeline */}
        <div className="flex-1 flex items-center gap-4">
          {/* Departure */}
          <div className="text-center min-w-[70px]">
            <p className="text-xl md:text-2xl font-bold text-foreground">{departureTime}</p>
            <p className="text-sm text-muted-foreground">{origin}</p>
          </div>

          {/* Timeline */}
          <div className="flex-1 flex flex-col items-center gap-1 px-2">
            <div className="flex items-center w-full gap-2">
              <div className="w-2 h-2 rounded-full bg-primary glow-primary" />
              <div className="flex-1 h-[2px] bg-gradient-to-r from-primary via-accent to-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/30 to-transparent animate-shimmer" 
                  style={{ backgroundSize: "200% 100%" }} 
                />
              </div>
              <Plane className="w-4 h-4 text-primary -rotate-45 group-hover:translate-x-1 transition-transform" />
              <div className="flex-1 h-[2px] bg-gradient-to-r from-primary via-accent to-primary relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/30 to-transparent animate-shimmer"
                  style={{ backgroundSize: "200% 100%" }}
                />
              </div>
              <div className="w-2 h-2 rounded-full bg-accent glow-accent" />
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{duration}</span>
            </div>
          </div>

          {/* Arrival */}
          <div className="text-center min-w-[70px]">
            <p className="text-xl md:text-2xl font-bold text-foreground">{arrivalTime}</p>
            <p className="text-sm text-muted-foreground">{destination}</p>
          </div>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between lg:flex-col lg:items-end gap-3 lg:gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-border/30">
          <div className="text-right">
            <p className="text-2xl md:text-3xl font-bold gradient-text">
              {currency}{price.toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">per person</p>
          </div>
          <Button variant="gradient" size="default" className="group/btn">
            <span>Select</span>
            <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FlightCard;
