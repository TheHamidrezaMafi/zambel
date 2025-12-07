import Header from "@/components/Header";
import Hero from "@/components/Hero";
import FlightResults from "@/components/FlightResults";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <FlightResults />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
