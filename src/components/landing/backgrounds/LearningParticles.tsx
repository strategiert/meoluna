/**
 * Learning Particles - Schwebende Buchstaben, Zahlen, Formeln
 * Education-themed floating particles
 */

import { useRef, useEffect } from 'react';
import p5 from 'p5';

interface LearningParticlesProps {
  density?: number;    // 0-100
  speed?: number;      // 0-100
  glow?: number;       // 0-100
}

export function LearningParticles({
  density = 50,
  speed = 30,
  glow = 60
}: LearningParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      interface Particle {
        x: number;
        y: number;
        vx: number;
        vy: number;
        symbol: string;
        size: number;
        alpha: number;
        rotation: number;
        rotationSpeed: number;
        hue: number;
      }

      const particles: Particle[] = [];
      const symbols = [
        'A', 'B', 'C', '1', '2', '3', '+', '−', '×', '÷', '=',
        'π', 'Σ', '∫', '√', '∞', 'α', 'β', 'Δ', 'θ',
        'H₂O', 'CO₂', 'E=mc²', 'a²+b²', 'f(x)', '∂',
        '♪', '★', '◆', '●', '▲'
      ];

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current!.offsetWidth,
          containerRef.current!.offsetHeight
        );
        canvas.style('display', 'block');
        p.colorMode(p.HSB, 360, 100, 100, 100);
        p.textAlign(p.CENTER, p.CENTER);

        const numParticles = Math.floor((density / 100) * 80) + 20;

        for (let i = 0; i < numParticles; i++) {
          particles.push(createParticle());
        }
      };

      const createParticle = (): Particle => ({
        x: p.random(p.width),
        y: p.random(p.height),
        vx: p.random(-1, 1) * (speed / 50),
        vy: p.random(-0.5, 0.5) * (speed / 50),
        symbol: p.random(symbols),
        size: p.random(12, 28),
        alpha: p.random(20, 60),
        rotation: p.random(p.TWO_PI),
        rotationSpeed: p.random(-0.02, 0.02),
        hue: p.random(200, 280) // Blue to purple range
      });

      p.draw = () => {
        p.clear();

        const speedFactor = speed / 50;
        const glowFactor = glow / 100;

        particles.forEach((particle, i) => {
          // Update position
          particle.x += particle.vx * speedFactor;
          particle.y += particle.vy * speedFactor;
          particle.rotation += particle.rotationSpeed * speedFactor;

          // Wrap around edges
          if (particle.x < -50) particle.x = p.width + 50;
          if (particle.x > p.width + 50) particle.x = -50;
          if (particle.y < -50) particle.y = p.height + 50;
          if (particle.y > p.height + 50) particle.y = -50;

          // Gentle floating motion
          particle.y += p.sin(p.frameCount * 0.02 + i) * 0.3;

          p.push();
          p.translate(particle.x, particle.y);
          p.rotate(particle.rotation);

          // Draw glow
          if (glowFactor > 0) {
            p.noStroke();
            p.fill(particle.hue, 60, 100, particle.alpha * glowFactor * 0.3);
            p.textSize(particle.size * 1.5);
            p.text(particle.symbol, 0, 0);
          }

          // Draw symbol
          p.fill(particle.hue, 50, 90, particle.alpha);
          p.textSize(particle.size);
          p.textFont('system-ui');
          p.text(particle.symbol, 0, 0);

          p.pop();
        });

        // Occasionally add sparkle effect
        if (p.frameCount % 30 === 0 && p.random() > 0.5) {
          const particle = p.random(particles);
          p.push();
          p.noStroke();
          p.fill(particle.hue, 80, 100, 60);
          p.circle(particle.x, particle.y, particle.size * 0.5);
          p.pop();
        }
      };

      p.windowResized = () => {
        if (containerRef.current) {
          p.resizeCanvas(
            containerRef.current.offsetWidth,
            containerRef.current.offsetHeight
          );
        }
      };
    };

    p5Ref.current = new p5(sketch, containerRef.current);

    return () => {
      p5Ref.current?.remove();
    };
  }, [density, speed, glow]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
}

export default LearningParticles;
