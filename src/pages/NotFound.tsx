/**
 * 404 Page
 */

import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-8xl mb-8"
        >
          🌙
        </motion.div>

        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          404
        </h1>

        <p className="text-xl text-muted-foreground mb-2">
          Diese Seite scheint in einer anderen Galaxie zu sein.
        </p>
        <p className="text-muted-foreground mb-8">
          Die Seite die du suchst existiert nicht oder wurde verschoben.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => window.history.back()} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Zurück
          </Button>
          <Link to="/">
            <Button className="gap-2">
              <Home className="w-4 h-4" />
              Zur Startseite
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
