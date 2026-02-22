/**
 * HeroSection - Landing page hero (Original Design)
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, BookOpen, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoonLogo } from "@/components/icons/MoonLogo";
import { P5Background } from "./P5Background";

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-hero">
      <P5Background />

      {/* Aurora effect */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-aurora blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent blur-[100px]" />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <MoonLogo size="xl" />
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-8 text-5xl md:text-7xl font-bold tracking-tight"
          >
            <span className="text-white">Meo</span>
            <span className="text-gradient-moon">luna</span>
          </motion.h1>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-4 text-xl md:text-2xl text-white/80 font-light"
          >
            Wo Wissen zum Abenteuer wird
          </motion.p>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-6 text-lg text-white/80 max-w-2xl"
          >
            Erschaffe magische Lernwelten mit KI. Verwandle Klassenarbeiten und
            Lernmaterialien in interaktive, spielerische Erlebnisse für deine
            Schüler.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-10 flex flex-col sm:flex-row gap-4"
          >
            <Button
              asChild
              size="lg"
              className="bg-moon text-night-sky hover:bg-moon-glow shadow-moon transition-all duration-300 text-lg px-8"
            >
              <Link to="/dashboard">
                <Sparkles className="w-5 h-5 mr-2" />
                Jetzt starten
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="bg-white/10 border-white/30 text-white hover:bg-white/20 text-lg px-8"
            >
              <Link to="/explore">
                <BookOpen className="w-5 h-5 mr-2" />
                Lernwelten entdecken
              </Link>
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-16 grid grid-cols-3 gap-8 md:gap-16"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-moon">∞</div>
              <div className="mt-1 text-sm text-white/70">Lernwelten</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-moon">KI</div>
              <div className="mt-1 text-sm text-white/70">Generiert</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-moon">
                <Users className="w-8 h-8 md:w-10 md:h-10 mx-auto" />
              </div>
              <div className="mt-1 text-sm text-white/70">Für Lehrer</div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-6 h-10 rounded-full border-2 border-white/30 flex justify-center pt-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-white/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}

export default HeroSection;
