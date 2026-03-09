import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import HeroSection from '@/components/HeroSection';
import ProjectsSection from '@/components/ProjectsSection';
import AboutSection from '@/components/AboutSection';
import FooterSection from '@/components/FooterSection';
import Marquee from '@/components/Marquee';
import CustomCursor from '@/components/CustomCursor';
import Preloader from '@/components/Preloader';
import TestimonialStrip from '@/components/TestimonialStrip';
import Navigation from '@/components/Navigation';
import useSmoothScroll from '@/hooks/useSmoothScroll';

const Index = () => {
  const [isLoading, setIsLoading] = useState(true);
  useSmoothScroll();

  const handleComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <div className="noise min-h-screen bg-background text-foreground">
      <AnimatePresence mode="wait">
        {isLoading && <Preloader onComplete={handleComplete} />}
      </AnimatePresence>

      <CustomCursor />
      <Navigation />

      <HeroSection />
      <Marquee text="DEVELOPER DESIGNER BUILDER PROBLEM SOLVER" outlined speed={40} />
      
      {/* Horizontal scroll projects */}
      <ProjectsSection />

      <Marquee text="REACT TYPESCRIPT THREE.JS NODE FIGMA" speed={45} reverse />
      <AboutSection />
      <TestimonialStrip />
      <FooterSection />
    </div>
  );
};

export default Index;
