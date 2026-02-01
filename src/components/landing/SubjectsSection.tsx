/**
 * SubjectsSection - 12 subjects with poetic names
 */

import { motion } from 'framer-motion';

const subjects = [
  {
    name: 'Mathematik',
    poeticName: 'Reich der Zahlen',
    emoji: '🔢',
    color: 'subject-math',
    description: 'Gleichungen, Geometrie & Logik',
  },
  {
    name: 'Deutsch',
    poeticName: 'Welt der Worte',
    emoji: '📚',
    color: 'subject-german',
    description: 'Grammatik, Literatur & Ausdruck',
  },
  {
    name: 'Englisch',
    poeticName: 'Global Voices',
    emoji: '🌍',
    color: 'subject-english',
    description: 'Sprache, Kultur & Kommunikation',
  },
  {
    name: 'Biologie',
    poeticName: 'Garten des Lebens',
    emoji: '🌱',
    color: 'subject-biology',
    description: 'Natur, Körper & Evolution',
  },
  {
    name: 'Physik',
    poeticName: 'Kräfte des Kosmos',
    emoji: '⚡',
    color: 'subject-physics',
    description: 'Energie, Bewegung & Universum',
  },
  {
    name: 'Chemie',
    poeticName: 'Alchemie-Labor',
    emoji: '🧪',
    color: 'subject-chemistry',
    description: 'Elemente, Reaktionen & Stoffe',
  },
  {
    name: 'Geschichte',
    poeticName: 'Zeitreise-Archiv',
    emoji: '🏛️',
    color: 'subject-history',
    description: 'Epochen, Kulturen & Ereignisse',
  },
  {
    name: 'Geografie',
    poeticName: 'Atlas der Wunder',
    emoji: '🗺️',
    color: 'subject-geography',
    description: 'Länder, Klima & Landschaften',
  },
  {
    name: 'Kunst',
    poeticName: 'Galerie der Seele',
    emoji: '🎨',
    color: 'subject-art',
    description: 'Kreativität, Stile & Ausdruck',
  },
  {
    name: 'Musik',
    poeticName: 'Symphonie der Sterne',
    emoji: '🎵',
    color: 'subject-music',
    description: 'Melodie, Rhythmus & Harmonie',
  },
  {
    name: 'Sport',
    poeticName: 'Arena der Champions',
    emoji: '🏆',
    color: 'subject-sport',
    description: 'Bewegung, Teamgeist & Fitness',
  },
  {
    name: 'Informatik',
    poeticName: 'Digitale Dimension',
    emoji: '💻',
    color: 'subject-informatics',
    description: 'Code, Algorithmen & Systeme',
  },
];

export function SubjectsSection() {
  return (
    <section className="py-24 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Entdecke alle <span className="text-moon">Fachgebiete</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Jedes Fach wird zu einer magischen Welt voller Abenteuer und Wissen.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {subjects.map((subject, index) => (
            <motion.div
              key={subject.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              className="group relative p-4 rounded-xl bg-card/50 border border-border hover:border-moon/30 transition-all cursor-pointer overflow-hidden"
            >
              {/* Color accent */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-${subject.color}`}
              />

              <div className="relative z-10">
                {/* Emoji */}
                <div className="text-3xl mb-2">{subject.emoji}</div>

                {/* Name */}
                <h3 className="font-semibold text-sm mb-0.5">{subject.name}</h3>

                {/* Poetic name */}
                <p className="text-moon text-xs font-medium mb-1">
                  {subject.poeticName}
                </p>

                {/* Description */}
                <p className="text-muted-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                  {subject.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
