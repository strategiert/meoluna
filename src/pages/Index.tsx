/**
 * Landing Page - Meoluna
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Sparkles, BookOpen, Gamepad2, Brain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <Moon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Meoluna</span>
          </Link>

          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="ghost">Anmelden</Button>
              </SignInButton>
              <SignInButton mode="modal">
                <Button>Kostenlos starten</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <Link to="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">KI-gestützte Lernwelten</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-white via-primary to-purple-400 bg-clip-text text-transparent">
              Lernen wird zum
              <br />
              Abenteuer
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Erstelle interaktive Lernwelten mit KI. Von Vulkanen bis Bruchrechnung -
              jedes Thema wird zur spannenden Entdeckungsreise.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button size="lg" className="gap-2">
                    Jetzt starten <ArrowRight className="w-4 h-4" />
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Link to="/create">
                  <Button size="lg" className="gap-2">
                    Welt erstellen <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </SignedIn>
              <Link to="/explore">
                <Button size="lg" variant="outline">
                  Welten entdecken
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Floating Moon */}
          <motion.div
            className="mt-16 text-8xl"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          >
            🌙
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Warum Meoluna?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="KI-generiert"
              description="Beschreibe dein Thema und unsere KI erstellt eine komplette Lernwelt mit Aufgaben und Erklärungen."
            />
            <FeatureCard
              icon={<Gamepad2 className="w-8 h-8" />}
              title="Spielerisch lernen"
              description="XP sammeln, Achievements freischalten und Fortschritt verfolgen - Lernen macht Spaß!"
            />
            <FeatureCard
              icon={<BookOpen className="w-8 h-8" />}
              title="Echte Inhalte"
              description="Recherchierte Fakten, verschiedene Aufgabentypen und progressive Schwierigkeit für echten Lerneffekt."
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2025 Meoluna. Mit Liebe für Bildung gemacht.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors"
    >
      <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}
