/**
 * FeaturesSection - 6 Feature Cards showcasing Meoluna capabilities
 */

import { motion } from 'framer-motion';
import {
  Brain,
  Gamepad2,
  BookOpen,
  Sparkles,
  Users,
  BarChart3,
} from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'KI-generierte Inhalte',
    description:
      'Beschreibe dein Thema und unsere KI erstellt eine komplette Lernwelt mit Aufgaben, Erklärungen und interaktiven Elementen.',
    color: 'from-purple-500 to-primary',
  },
  {
    icon: Gamepad2,
    title: 'Spielerisch lernen',
    description:
      'XP sammeln, Achievements freischalten und Fortschritt verfolgen. Lernen fühlt sich an wie ein Abenteuer!',
    color: 'from-aurora to-emerald-500',
  },
  {
    icon: BookOpen,
    title: 'Echte Bildungsinhalte',
    description:
      'Recherchierte Fakten, verschiedene Aufgabentypen und progressive Schwierigkeit für echten Lerneffekt.',
    color: 'from-moon to-orange-400',
  },
  {
    icon: Sparkles,
    title: 'Magische Atmosphäre',
    description:
      'Lerne unter dem Mondschein mit wunderschönen Animationen und einer beruhigenden Nacht-Ästhetik.',
    color: 'from-blue-500 to-cyan-400',
  },
  {
    icon: Users,
    title: 'Teilen & Entdecken',
    description:
      'Teile deine Lernwelten mit anderen oder entdecke Welten, die von der Community erstellt wurden.',
    color: 'from-pink-500 to-rose-400',
  },
  {
    icon: BarChart3,
    title: 'Fortschritt verfolgen',
    description:
      'Detaillierte Statistiken zeigen dir genau, wie weit du gekommen bist und was du gelernt hast.',
    color: 'from-indigo-500 to-purple-400',
  },
];

export function FeaturesSection() {
  return (
    <section className="py-24 px-4 relative">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent pointer-events-none" />

      <div className="container mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Warum <span className="text-moon">Meoluna</span>?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Entdecke, was Meoluna zu deinem perfekten Lernbegleiter macht.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-moon/30 transition-all duration-300 hover:shadow-lg hover:shadow-moon/5"
            >
              <div
                className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} p-0.5 mb-4`}
              >
                <div className="w-full h-full bg-card rounded-[10px] flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-foreground" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2 group-hover:text-moon transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
