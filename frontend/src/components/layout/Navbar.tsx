import Link from 'next/link';
import { ThemeToggle } from '../common/ThemeToggle';
import { useState } from 'react';

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
                <svg className="w-5 h-5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 0 0-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                </svg>
              </div>
            </div>
            <Link href="/" className="text-xl font-bold gradient-text">زمبیل</Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-foreground/80 hover:text-primary transition-colors">
              خانه
            </Link>
            <Link href="/flight" className="text-foreground/80 hover:text-primary transition-colors">
              پرواز
            </Link>
            <Link href="/hotel" className="text-foreground/80 hover:text-primary transition-colors">
              هتل
            </Link>
            <Link href="/support" className="text-foreground/80 hover:text-primary transition-colors">
              پشتیبانی
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <button className="px-4 py-2 rounded-lg text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-secondary transition-all">
              ورود
            </button>
            <button className="gradient-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg glow-primary hover:opacity-90 hover:scale-[1.02] transition-all">
              شروع کنید
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <button
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border/50 pt-4 animate-slide-up">
            <nav className="flex flex-col gap-4">
              <Link href="/" className="text-foreground/80 hover:text-primary transition-colors py-2">
                خانه
              </Link>
              <Link href="/flight" className="text-foreground/80 hover:text-primary transition-colors py-2">
                پرواز
              </Link>
              <Link href="/hotel" className="text-foreground/80 hover:text-primary transition-colors py-2">
                هتل
              </Link>
              <Link href="/support" className="text-foreground/80 hover:text-primary transition-colors py-2">
                پشتیبانی
              </Link>
              <div className="flex flex-col gap-2 pt-4">
                <button className="w-full py-2 rounded-lg text-sm font-medium text-foreground/80 hover:bg-secondary transition-all">
                  ورود
                </button>
                <button className="w-full gradient-primary text-primary-foreground font-semibold py-2 rounded-lg glow-primary">
                  شروع کنید
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
