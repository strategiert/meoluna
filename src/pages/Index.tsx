/**
 * Landing Page - Meoluna
 * Main entry point showcasing the platform
 */

import { Navbar } from '@/components/layout/Navbar';
import {
  StarField,
  HeroSection,
  FeaturesSection,
  HowItWorksSection,
  SubjectsSection,
  CTASection,
  Footer,
} from '@/components/landing';

export default function Index() {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Star background */}
      <StarField />

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
