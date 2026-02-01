/**
 * HowItWorksSection - 4-step process visualization
 */

import { motion } from 'framer-motion';
import { Wand2, Sparkles, Play, Trophy } from 'lucide-react';

const steps = [
  {
    icon: Wand2,
    step: '01',
    title: 'Thema wählen',
    description: 'Beschreibe das Thema, das du lernen möchtest - von Geschichte bis Mathematik.',
  },
  {
    icon: Sparkles,
    step: '02',
    title: 'KI zaubert',
    description: 'Unsere KI erstellt eine maßgeschneiderte Lernwelt mit Aufgaben und Erklärungen.',
  },
  {
    icon: Play,
    step: '03',
    title: 'Erkunden & Lernen',
    description: 'Tauche in deine Lernwelt ein, löse Aufgaben und sammle wertvolle XP.',
  },
  {
    icon: Trophy,
    step: '04',
    title: 'Meistern & Teilen',
    description: 'Schließe Welten ab, verdiene Achievements und teile deine Kreationen.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 px-4 bg-card/30">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            So funktioniert's
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            In vier einfachen Schritten zu deiner persönlichen Lernwelt.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-0.5 bg-gradient-to-r from-moon/50 to-transparent" />
              )}

              <div className="relative z-10 text-center">
                {/* Step number */}
                <div className="text-6xl font-bold text-moon/10 mb-2">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 mx-auto -mt-8 mb-4 rounded-full bg-gradient-to-br from-moon/20 to-aurora/20 border border-moon/30 flex items-center justify-center">
                  <step.icon className="w-7 h-7 text-moon" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
