import SearchForm from "./SearchForm";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating orbs */}
        <div className="absolute top-1/4 left-[10%] w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-[10%] w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header Text */}
        <div className="text-center mb-12 md:mb-16">
          <div className="inline-flex items-center gap-2 glass rounded-full px-4 py-2 mb-6 opacity-0 animate-slide-up">
            <span className="w-2 h-2 rounded-full bg-primary animate-glow-pulse" />
            <span className="text-sm text-muted-foreground">Find the best flight deals</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 opacity-0 animate-slide-up animate-delay-100">
            <span className="text-foreground">Discover Your</span>
            <br />
            <span className="gradient-text">Perfect Flight</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto opacity-0 animate-slide-up animate-delay-200">
            Compare prices from hundreds of airlines and booking sites. 
            Find the cheapest flights in seconds.
          </p>
        </div>

        {/* Search Form */}
        <div className="opacity-0 animate-slide-up animate-delay-300">
          <SearchForm />
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-6 md:gap-12 mt-12 opacity-0 animate-slide-up animate-delay-400">
          {[
            { value: "500+", label: "Airlines" },
            { value: "100M+", label: "Travelers" },
            { value: "24/7", label: "Support" },
            { value: "Best", label: "Prices" },
          ].map((badge, index) => (
            <div key={index} className="text-center">
              <p className="text-2xl md:text-3xl font-bold gradient-text">{badge.value}</p>
              <p className="text-sm text-muted-foreground">{badge.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Hero;
