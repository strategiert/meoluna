/**
 * CTASection - Call to action (Original Design)
 */

import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MoonLogo } from "@/components/icons/MoonLogo";
import { StarField } from "./StarField";

export function CTASection() {
  return (
    <section className="relative py-24 overflow-hidden bg-hero">
      <StarField />

      {/* Aurora effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 left-1/3 w-80 h-80 rounded-full bg-aurora blur-[100px]" />
        <div className="absolute bottom-0 right-1/3 w-96 h-96 rounded-full bg-accent blur-[120px]" />
      </div>

      <div className="container relative z-10 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto text-center"
        >
          <MoonLogo size="lg" className="mx-auto" />

          <h2 className="mt-8 text-3xl md:text-5xl font-bold text-white">
            Bereit, Lernen neu zu denken?
          </h2>

          <p className="mt-4 text-lg text-white/70">
            Starte jetzt kostenlos und erstelle deine erste Lernwelt in wenigen
            Minuten. Keine Kreditkarte erforderlich.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              asChild
              size="lg"
              className="bg-moon text-night-sky hover:bg-moon-glow shadow-moon transition-all duration-300 text-lg px-8"
            >
              <Link to="/dashboard">
                <Sparkles className="w-5 h-5 mr-2" />
                Kostenlos starten
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </div>

          <p className="mt-6 text-sm text-white/50">
            Bereits über 1.000 Lehrer nutzen Meoluna
          </p>
        </motion.div>
      </div>
    </section>
  );
}

export default CTASection;
