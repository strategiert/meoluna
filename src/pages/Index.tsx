/**
 * Landing Page - Meoluna
 * Main entry point showcasing the platform
 */

import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import {
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  SubjectsSection,
  CTASection,
  Footer,
} from '@/components/landing';

export default function Index() {
  // Scroll to top on mount to prevent scroll restoration issues
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Navigation */}
      <Navbar />

      {/* Main content */}
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <SubjectsSection />
        <CTASection />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
