/**
 * HowItWorksSection - Step-by-step guide (Original Design)
 */

import { motion } from "framer-motion";
import { Upload, Sparkles, Share, Rocket } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Material hochladen",
    description:
      "Lade deine Klassenarbeit, Arbeitsblätter oder Lernmaterialien hoch - als Text oder PDF.",
  },
  {
    number: "02",
    icon: Sparkles,
    title: "KI generiert",
    description:
      "Die KI analysiert dein Material und erstellt eine interaktive Lernwelt mit Quiz und Übungen.",
  },
  {
    number: "03",
    icon: Share,
    title: "Anpassen & Teilen",
    description:
      "Passe die generierte Welt nach deinen Wünschen an und teile sie mit deinen Schülern.",
  },
  {
    number: "04",
    icon: Rocket,
    title: "Lernen & Spaß",
    description:
      "Deine Schüler erkunden die Lernwelt, sammeln Sterne und festigen ihr Wissen spielerisch.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-24 bg-muted/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold">So funktioniert's</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            In nur vier Schritten von deinem Material zur fertigen Lernwelt
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent hidden lg:block" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative text-center"
              >
                {/* Step number */}
                <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full bg-primary/10" />
                  <div className="relative w-16 h-16 rounded-full bg-background border-2 border-primary flex items-center justify-center">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center">
                    {step.number}
                  </span>
                </div>

                <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
