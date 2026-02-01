/**
 * FeaturesSection - Feature cards (Original Design)
 */

import { motion } from "framer-motion";
import {
  Wand2,
  Palette,
  Gamepad2,
  BarChart3,
  Share2,
  Star,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Wand2,
    title: "KI-Generator",
    description:
      "Lade deine Materialien hoch und die KI erstellt automatisch interaktive Lernwelten.",
    color: "from-purple-500 to-indigo-500",
  },
  {
    icon: Palette,
    title: "Thematische Welten",
    description:
      "Jedes Fach hat sein eigenes Design - vom Zahlenwald bis zum Sprachozean.",
    color: "from-pink-500 to-rose-500",
  },
  {
    icon: Gamepad2,
    title: "Interaktive Übungen",
    description:
      "Quiz, Drag & Drop, Zuordnungsspiele und mehr - Lernen wird zum Spiel.",
    color: "from-cyan-500 to-blue-500",
  },
  {
    icon: Star,
    title: "Gamification",
    description:
      "Sternchen sammeln, Mondphasen als Level und Erfolge freischalten.",
    color: "from-yellow-500 to-orange-500",
  },
  {
    icon: BarChart3,
    title: "Lernfortschritt",
    description:
      "Behalte den Überblick über den Fortschritt deiner Schüler in Echtzeit.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: Share2,
    title: "Einfaches Teilen",
    description:
      "Teile Lernwelten per Link oder mache sie öffentlich für die Community.",
    color: "from-violet-500 to-purple-500",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
    },
  },
};

export function FeaturesSection() {
  return (
    <section className="py-24 bg-background">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold">
            Alles was du brauchst
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Meoluna kombiniert die Kraft der KI mit durchdachtem Lerndesign, um
            einzigartige Bildungserlebnisse zu schaffen.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature) => (
            <motion.div key={feature.title} variants={itemVariants}>
              <Card className="group h-full border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300 hover:shadow-lg">
                <CardContent className="p-6">
                  <div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default FeaturesSection;
