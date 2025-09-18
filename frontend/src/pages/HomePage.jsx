import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Menu,
  X,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Plasma from '@/components/Plasma';
import PerformanceMonitor from '@/components/PerformanceMonitor';

// Error boundary for Plasma component
const PlasmaWrapper = ({ children, ...props }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = (error) => {
      console.warn('Plasma component error:', error);
      setHasError(true);
    };
    
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-purple-900/20 to-blue-900/20">
        {/* Fallback gradient background */}
      </div>
    );
  }
  
  return <Plasma {...props}>{children}</Plasma>;
};

const HomePage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    
    // Set loading to false after component mounts
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timer);
    };
  }, []);

  // TALARIA-LOG Logo Component
  const TalariaLogo = ({ size = "w-8 h-8", className = "" }) => (
    <div className={`${size} ${className}`}>
      <img 
        src="/LOGO-wihte.png" 
        alt="TALARIA-LOG" 
        className="w-full h-full object-contain"
      />
    </div>
  );

  // Show loading state while component initializes
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/80">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Navigation */}
      <nav className={`fixed top-4 w-full z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/20 backdrop-blur-xl border-b border-white/10 shadow-2xl shadow-black/20' 
          : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-15 py-1 px-4 relative">
            {/* Glass background overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-white/10 rounded-2xl mx-2 backdrop-blur-sm border border-white/10"></div>
            {/* Logo */}
            <div className="flex items-center space-x-2 relative z-10">
              <TalariaLogo size="w-5 h-5" className="text-white" />
              <span className="text-base font-bold text-white tracking-wide">
                TALARIA-LOG
              </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 relative z-10">
              <a href="#services" className="text-white/80 hover:text-white transition-colors text-sm font-medium px-2 py-1 rounded-lg hover:bg-white/10">Services</a>
              <a href="#process" className="text-white/80 hover:text-white transition-colors text-sm font-medium px-2 py-1 rounded-lg hover:bg-white/10">Process</a>
              <a href="#pricing" className="text-white/80 hover:text-white transition-colors text-sm font-medium px-2 py-1 rounded-lg hover:bg-white/10">Pricing</a>
              <a href="#blog" className="text-white/80 hover:text-white transition-colors text-sm font-medium px-2 py-1 rounded-lg hover:bg-white/10">Blog</a>
              <a href="#contact" className="text-white/80 hover:text-white transition-colors text-sm font-medium px-2 py-1 rounded-lg hover:bg-white/10">Contact</a>
            </div>
            
            <div className="hidden md:flex items-center space-x-2 relative z-10">
              <Link to="/login">
                <Button variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30 px-2 py-1 text-sm font-medium">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/40 rounded-lg px-3 py-1 text-sm font-medium backdrop-blur-sm">
                  Get Started
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="md:hidden text-white/80 hover:text-white relative z-10 p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Mobile menu button clicked');
                setIsMenuOpen(!isMenuOpen);
              }}
              aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMenuOpen}
              aria-controls="mobile-menu"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div id="mobile-menu" className="md:hidden bg-black/20 backdrop-blur-xl border-t border-white/10 shadow-2xl">
            <div className="px-4 py-6 space-y-4">
              <a href="#services" className="block text-white/80 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10">Services</a>
              <a href="#process" className="block text-white/80 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10">Process</a>
              <a href="#pricing" className="block text-white/80 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10">Pricing</a>
              <a href="#blog" className="block text-white/80 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10">Blog</a>
              <a href="#contact" className="block text-white/80 hover:text-white transition-colors text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10">Contact</a>
              <div className="pt-4 space-y-2">
                <Link to="/login" className="block">
                  <Button variant="ghost" className="w-full text-white/80 hover:text-white hover:bg-white/10 border border-white/20">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" className="block">
                  <Button className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/30 hover:border-white/40 rounded-lg backdrop-blur-sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Optimized Plasma Background with Error Handling */}
        <div className="absolute inset-0 z-0 bg-black">
          <PlasmaWrapper 
            color="#8b5cf6"
            speed={0.5}
            direction="forward"
            scale={1.0}
            opacity={0.6}
            mouseInteractive={false}
          />
        </div>
        
        {/* Subtle Glow Effects */}
        <div className="absolute inset-0 z-10">
          <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[300px] bg-blue-500/15 rounded-full blur-2xl"></div>
          <div className="absolute top-3/4 left-1/4 w-[300px] h-[200px] bg-indigo-500/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative z-30 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Central Logo with Blue Glow */}
            <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500/20 rounded-2xl blur-xl scale-110"></div>
              
                <TalariaLogo size="w-50 h-50" className="text-white" />
              
            </div>
          </div>

          {/* Tagline */}
          <div className="flex justify-center items-center mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
            <span className="text-slate-400 text-sm font-medium tracking-wide">
              NEW GEN TRADING JOURNAL & BACKTEST
            </span>
            </div>
            
          {/* Main Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="text-slate-200">
            Made for Traders.
              </span>
              <br />
            <span className="text-slate-200 italic">
              With Traders.
              </span>
            </h1>
            
          {/* Sub-headline */}
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Journaling & Backtesting 
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" onClick={(e) => {
                console.log('Get Started button clicked');
                e.preventDefault();
                window.location.href = '/login';
              }}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-base px-8 py-3 h-auto border-0 shadow-lg hover:shadow-blue-500/25 transition-all duration-300">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register" onClick={(e) => {
                console.log('Learn More button clicked');
                e.preventDefault();
                window.location.href = '/register';
              }}>
              <Button size="lg" variant="outline" className="text-base px-8 py-3 h-auto border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-500 transition-all duration-300">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Performance Monitor (only in development) */}
      {import.meta.env.MODE === 'development' && <PerformanceMonitor />}
    </div>
  );
};

export default HomePage;