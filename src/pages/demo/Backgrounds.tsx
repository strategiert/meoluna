/**
 * Demo Page for p5.js Background Selection
 * Allows testing all 10 background variants with parameter controls
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Sparkles,
  MousePointer2,
  Sliders,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { MoonLogo } from '@/components/icons/MoonLogo';

// Import all background components
import {
  TeslaWaves,
  LearningParticles,
  NeuralConstellation,
  FlowField,
  GalaxySpiral,
  DNAHelix,
  MathGrid,
  Fireflies,
  CircuitBoard,
  AuroraWaves,
  backgroundVariants,
} from '@/components/landing/backgrounds';

// Component map for dynamic rendering
const componentMap = {
  TeslaWaves,
  LearningParticles,
  NeuralConstellation,
  FlowField,
  GalaxySpiral,
  DNAHelix,
  MathGrid,
  Fireflies,
  CircuitBoard,
  AuroraWaves,
} as const;

export default function BackgroundsDemo() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [params, setParams] = useState<Record<string, Record<string, number>>>({});
  const [showControls, setShowControls] = useState(true);

  const currentVariant = backgroundVariants[selectedIndex];

  // Get current params with defaults
  const currentParams = useMemo(() => {
    const variantParams = params[currentVariant.id] || {};
    const defaults: Record<string, number> = {};
    currentVariant.params.forEach(p => {
      defaults[p.name] = variantParams[p.name] ?? p.default;
    });
    return defaults;
  }, [currentVariant, params]);

  // Update a parameter
  const updateParam = (name: string, value: number) => {
    setParams(prev => ({
      ...prev,
      [currentVariant.id]: {
        ...prev[currentVariant.id],
        [name]: value,
      },
    }));
  };

  // Reset params to defaults
  const resetParams = () => {
    setParams(prev => ({
      ...prev,
      [currentVariant.id]: {},
    }));
  };

  // Navigate between variants
  const goToNext = () => {
    setSelectedIndex(i => (i + 1) % backgroundVariants.length);
  };

  const goToPrev = () => {
    setSelectedIndex(i => (i - 1 + backgroundVariants.length) % backgroundVariants.length);
  };

  // Render the current background
  const BackgroundComponent = componentMap[currentVariant.component as keyof typeof componentMap];

  return (
    <div className="relative min-h-screen bg-night-sky overflow-hidden">
      {/* Background visualization */}
      <div className="absolute inset-0">
        <BackgroundComponent {...currentParams} />
      </div>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-night-sky/50 via-transparent to-night-sky/70" />

      {/* Hero Content Preview (to see how it looks with actual content) */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <MoonLogo size="lg" />

          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight">
            <span className="text-white">Meo</span>
            <span className="text-gradient-moon">luna</span>
          </h1>

          <p className="mt-3 text-lg md:text-xl text-white/70">
            Wo Wissen zum Abenteuer wird
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              className="bg-moon text-night-sky hover:bg-moon-glow"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Jetzt starten
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-white/10 border-white/30 text-white"
            >
              Entdecken
            </Button>
          </div>
        </motion.div>
      </div>

      {/* Navigation Header */}
      <div className="fixed top-0 left-0 right-0 z-30 p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link to="/">
            <Button variant="ghost" className="text-white/70 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zurück
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white"
              onClick={goToPrev}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>

            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 text-white text-sm">
              <span className="font-medium">{selectedIndex + 1}</span>
              <span className="text-white/50"> / {backgroundVariants.length}</span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white"
              onClick={goToNext}
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>

          <Button
            variant="ghost"
            className="text-white/70 hover:text-white"
            onClick={() => setShowControls(!showControls)}
          >
            <Sliders className="w-4 h-4 mr-2" />
            {showControls ? 'Ausblenden' : 'Einblenden'}
          </Button>
        </div>
      </div>

      {/* Variant Selector (Bottom) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4">
        <div className="max-w-7xl mx-auto">
          {/* Quick select buttons */}
          <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {backgroundVariants.map((variant, index) => (
              <button
                key={variant.id}
                onClick={() => setSelectedIndex(index)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${index === selectedIndex
                    ? 'bg-moon text-night-sky'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                  }
                `}
              >
                {variant.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls Panel */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="fixed right-4 top-1/2 -translate-y-1/2 z-30 w-72"
        >
          <div className="bg-night-sky/90 backdrop-blur-md rounded-xl border border-white/10 p-5">
            {/* Variant Info */}
            <div className="mb-5">
              <h2 className="text-lg font-bold text-white">{currentVariant.name}</h2>
              <p className="text-sm text-white/60 mt-1">{currentVariant.description}</p>

              <div className="flex items-center gap-2 mt-3">
                {currentVariant.interactive && (
                  <span className="flex items-center gap-1 text-xs bg-moon/20 text-moon px-2 py-1 rounded-full">
                    <MousePointer2 className="w-3 h-3" />
                    Interaktiv
                  </span>
                )}
                <span className="text-xs text-white/40">
                  {currentVariant.inspiration}
                </span>
              </div>
            </div>

            {/* Parameter Sliders */}
            <div className="space-y-4">
              {currentVariant.params.map(param => (
                <div key={param.name}>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-white/70">{param.label}</label>
                    <span className="text-xs text-white/50">
                      {currentParams[param.name]}
                    </span>
                  </div>
                  <Slider
                    value={[currentParams[param.name]]}
                    min={param.min}
                    max={param.max}
                    step={1}
                    onValueChange={([value]) => updateParam(param.name, value)}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="mt-5 pt-4 border-t border-white/10 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 bg-white/5 border-white/20 text-white/70 hover:text-white"
                onClick={resetParams}
              >
                Reset
              </Button>
              <Button
                size="sm"
                className="flex-1 bg-moon text-night-sky hover:bg-moon-glow"
              >
                <Check className="w-4 h-4 mr-1" />
                Wählen
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Keyboard hints */}
      <div className="fixed bottom-20 left-4 z-20 text-white/30 text-xs">
        <span className="bg-white/10 px-2 py-1 rounded">←</span>
        <span className="mx-1">/</span>
        <span className="bg-white/10 px-2 py-1 rounded">→</span>
        <span className="ml-2">Navigieren</span>
      </div>
    </div>
  );
}
