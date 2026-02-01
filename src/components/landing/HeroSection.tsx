/**
 * HeroSection - Main hero with aurora effects and CTA
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';
import { MoonLogo } from '@/components/icons/MoonLogo';

export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-4 overflow-hidden">
      {/* Aurora effect blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -left-40 w-80 h-80 bg-aurora/20 rounded-full blur-3xl animate-pulse-soft"
          style={{ animationDelay: '0s' }}
        />
        <div
          className="absolute top-20 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-soft"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="absolute -bottom-20 left-1/3 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse-soft"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <div className="container mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-moon/10 text-moon border border-moon/20 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Wo Wissen zum Abenteuer wird</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-moon via-white to-aurora bg-clip-text text-transparent">
              Erschaffe magische
            </span>
            <br />
            <span className="text-foreground">Lernwelten mit KI</span>
          </h1>

          {/* Description */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Tauche ein in interaktive Lernwelten, die sich an dich anpassen.
            Von Vulkanen bis Bruchrechnung - jedes Thema wird zur
            spannenden Entdeckungsreise unter dem Mondlicht.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-moon to-aurora hover:opacity-90 text-background font-semibold"
                >
                  Jetzt starten <ArrowRight className="w-4 h-4" />
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/create">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-moon to-aurora hover:opacity-90 text-background font-semibold"
                >
                  Welt erstellen <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </SignedIn>
            <Link to="/explore">
              <Button size="lg" variant="outline" className="border-moon/30 hover:bg-moon/10">
                Welten entdecken
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Floating Moon */}
        <motion.div
          className="mt-16 flex justify-center"
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="relative">
            <div className="absolute inset-0 bg-moon/30 rounded-full blur-2xl scale-150" />
            <MoonLogo size={120} className="relative z-10" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
