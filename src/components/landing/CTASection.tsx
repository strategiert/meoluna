/**
 * CTASection - Call to Action section
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react';

export function CTASection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-moon/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-aurora/10 rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />
      </div>

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-moon/10 text-moon border border-moon/20 mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Kostenlos starten</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Bereit für dein
            <br />
            <span className="bg-gradient-to-r from-moon via-aurora to-primary bg-clip-text text-transparent">
              Lernabenteuer?
            </span>
          </h2>

          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Erstelle jetzt deine erste magische Lernwelt und entdecke,
            wie viel Spaß Lernen machen kann.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <SignedOut>
              <SignInButton mode="modal">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-moon to-aurora hover:opacity-90 text-background font-semibold px-8"
                >
                  Jetzt kostenlos starten <ArrowRight className="w-4 h-4" />
                </Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/create">
                <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-moon to-aurora hover:opacity-90 text-background font-semibold px-8"
                >
                  Neue Welt erstellen <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </SignedIn>
            <Link to="/explore">
              <Button size="lg" variant="outline" className="border-moon/30 hover:bg-moon/10">
                Welten erkunden
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
