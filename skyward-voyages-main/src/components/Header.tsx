import { Plane, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
                <Plane className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
            <span className="text-xl font-bold gradient-text">SkyFind</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#" className="text-foreground/80 hover:text-primary transition-colors">
              Flights
            </a>
            <a href="#" className="text-foreground/80 hover:text-primary transition-colors">
              Hotels
            </a>
            <a href="#" className="text-foreground/80 hover:text-primary transition-colors">
              Deals
            </a>
            <a href="#" className="text-foreground/80 hover:text-primary transition-colors">
              Support
            </a>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Sign In
            </Button>
            <Button variant="gradient" size="sm">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border/50 pt-4 animate-slide-up">
            <nav className="flex flex-col gap-4">
              <a href="#" className="text-foreground/80 hover:text-primary transition-colors py-2">
                Flights
              </a>
              <a href="#" className="text-foreground/80 hover:text-primary transition-colors py-2">
                Hotels
              </a>
              <a href="#" className="text-foreground/80 hover:text-primary transition-colors py-2">
                Deals
              </a>
              <a href="#" className="text-foreground/80 hover:text-primary transition-colors py-2">
                Support
              </a>
              <div className="flex flex-col gap-2 pt-4">
                <Button variant="ghost" className="justify-center">
                  Sign In
                </Button>
                <Button variant="gradient" className="justify-center">
                  Get Started
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
