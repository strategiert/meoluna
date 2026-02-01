/**
 * About Page - Über uns
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Moon, Heart, Sparkles, GraduationCap, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MoonLogo } from '@/components/icons/MoonLogo';

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-purple-600 rounded-lg flex items-center justify-center">
              <Moon className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl">Meoluna</span>
          </Link>
          <Link to="/">
            <Button variant="ghost">Zurück zur Startseite</Button>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <MoonLogo size={80} className="mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Über Meoluna
          </h1>
          <p className="text-xl text-muted-foreground">
            Wo Wissen zum Abenteuer wird.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="prose prose-lg dark:prose-invert max-w-none mb-16"
        >
          <h2>Unsere Mission</h2>
          <p>
            Lernen muss nicht langweilig sein. Wir glauben, dass jeder Mensch das 
            Potenzial hat, Großartiges zu lernen — wenn das Lernen sich wie ein 
            Abenteuer anfühlt.
          </p>
          <p>
            Meoluna kombiniert die Kraft der künstlichen Intelligenz mit 
            interaktiven Lernwelten, um ein völlig neues Lernerlebnis zu schaffen. 
            Statt passive Inhalte zu konsumieren, erschaffst du deine eigenen 
            magischen Lernwelten.
          </p>

          <h2>Warum "Meoluna"?</h2>
          <p>
            Der Name Meoluna verbindet "Meo" (von lat. <em>meus</em> — mein) mit 
            "Luna" (Mond). <strong>Dein persönlicher Mond</strong>, der dich durch 
            die Nacht des Lernens begleitet und dir den Weg erhellt.
          </p>
          <p>
            Der Mond symbolisiert Entdeckung, Ruhe und das Licht in der Dunkelheit — 
            genau das, was wir beim Lernen bieten wollen.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-2 gap-8 mb-16"
        >
          <div className="bg-card rounded-lg p-8 border">
            <Sparkles className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">KI-gestützt</h3>
            <p className="text-muted-foreground">
              Unsere KI hilft dir, interaktive Lernwelten zu erstellen — 
              ohne Programmierkenntnisse.
            </p>
          </div>
          <div className="bg-card rounded-lg p-8 border">
            <GraduationCap className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Für Schüler gemacht</h3>
            <p className="text-muted-foreground">
              Von der Grundschule bis zum Abitur — Meoluna passt sich 
              deinem Niveau an.
            </p>
          </div>
          <div className="bg-card rounded-lg p-8 border">
            <Users className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Community-driven</h3>
            <p className="text-muted-foreground">
              Teile deine Lernwelten mit anderen und entdecke Kreationen 
              der Community.
            </p>
          </div>
          <div className="bg-card rounded-lg p-8 border">
            <Heart className="w-10 h-10 text-primary mb-4" />
            <h3 className="text-xl font-bold mb-2">Mit Liebe gemacht</h3>
            <p className="text-muted-foreground">
              Meoluna ist ein Passion Project — entwickelt, um Bildung 
              besser zu machen.
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center bg-gradient-to-r from-primary/10 to-purple-600/10 rounded-lg p-12"
        >
          <h2 className="text-2xl font-bold mb-4">
            Bereit für das Abenteuer?
          </h2>
          <p className="text-muted-foreground mb-6">
            Erstelle deine erste Lernwelt — kostenlos.
          </p>
          <Link to="/create">
            <Button size="lg">
              <Moon className="w-4 h-4 mr-2" />
              Jetzt starten
            </Button>
          </Link>
        </motion.div>
      </main>
    </div>
  );
}
