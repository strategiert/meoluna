/**
 * XPPopup - Animation wenn XP verdient wird
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Star } from 'lucide-react';

interface XPPopupProps {
  xp: number;
  show: boolean;
  onComplete?: () => void;
  levelUp?: boolean;
  newLevel?: number;
}

export function XPPopup({ xp, show, onComplete, levelUp, newLevel }: XPPopupProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: -20 }}
          transition={{ type: 'spring', duration: 0.5 }}
          onAnimationComplete={() => {
            setTimeout(() => onComplete?.(), 1500);
          }}
          className="fixed bottom-8 right-8 z-50"
        >
          <div className="relative">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-moon/40 rounded-2xl blur-xl animate-pulse" />

            {/* Main Card */}
            <div className="relative bg-gradient-to-br from-moon/90 to-aurora/90 rounded-2xl p-6 shadow-2xl border border-white/20">
              {levelUp ? (
                // Level Up Animation
                <div className="text-center">
                  <motion.div
                    initial={{ rotate: 0 }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.5 }}
                    className="inline-block mb-2"
                  >
                    <Star className="w-12 h-12 text-yellow-300" />
                  </motion.div>
                  <motion.p
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="text-2xl font-bold text-white mb-1"
                  >
                    Level Up!
                  </motion.p>
                  <p className="text-white/80">
                    Du bist jetzt <span className="font-bold">Level {newLevel}</span>
                  </p>
                </div>
              ) : (
                // XP Earned Animation
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.4 }}
                    className="p-2 bg-white/20 rounded-xl"
                  >
                    <Zap className="w-6 h-6 text-yellow-300" />
                  </motion.div>
                  <div>
                    <motion.p
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="text-2xl font-bold text-white"
                    >
                      +{xp} XP
                    </motion.p>
                    <motion.p
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="text-sm text-white/70"
                    >
                      Gut gemacht!
                    </motion.p>
                  </div>
                </div>
              )}

              {/* Sparkle particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 1, scale: 0 }}
                  animate={{
                    opacity: 0,
                    scale: 1,
                    x: Math.cos(i * 60 * (Math.PI / 180)) * 60,
                    y: Math.sin(i * 60 * (Math.PI / 180)) * 60,
                  }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                  className="absolute top-1/2 left-1/2 w-2 h-2 bg-yellow-300 rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default XPPopup;
