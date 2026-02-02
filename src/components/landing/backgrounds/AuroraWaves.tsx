/**
 * Aurora Waves - Nordlicht-ähnliche Farbwellen
 * Meoluna Aurora-Theme inspired
 */

import { useRef, useEffect } from 'react';
import p5 from 'p5';

interface AuroraWavesProps {
  intensity?: number;      // 0-100
  waveSpeed?: number;      // 0-100
  colorShift?: number;     // 0-100
}

export function AuroraWaves({
  intensity = 60,
  waveSpeed = 40,
  colorShift = 50
}: AuroraWavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let time = 0;

      interface AuroraLayer {
        yOffset: number;
        amplitude: number;
        frequency: number;
        speed: number;
        hue: number;
        alpha: number;
      }

      const layers: AuroraLayer[] = [];

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current!.offsetWidth,
          containerRef.current!.offsetHeight
        );
        canvas.style('display', 'block');
        p.colorMode(p.HSB, 360, 100, 100, 100);
        p.noStroke();

        // Create aurora layers with Meoluna colors
        const baseHues = [180, 200, 220, 260, 300]; // Cyan to Magenta

        for (let i = 0; i < 5; i++) {
          layers.push({
            yOffset: 0.2 + i * 0.12,
            amplitude: 0.15 + p.random(-0.05, 0.05),
            frequency: 0.002 + i * 0.0005,
            speed: 0.3 + i * 0.1,
            hue: baseHues[i],
            alpha: 15 - i * 2
          });
        }
      };

      p.draw = () => {
        p.clear();

        const speed = (waveSpeed / 100) * 0.02;
        const intense = intensity / 100;
        const shift = (colorShift / 100) * 60;

        time += speed;

        // Draw each aurora layer
        layers.forEach((layer) => {
          const baseY = p.height * layer.yOffset;

          // Draw multiple vertical strips with noise-based height
          for (let x = 0; x < p.width; x += 2) {
            // Calculate wave shape using multiple noise octaves
            const noise1 = p.noise(x * layer.frequency, time * layer.speed);
            const noise2 = p.noise(x * layer.frequency * 2, time * layer.speed * 1.5 + 100);
            const noise3 = p.noise(x * layer.frequency * 0.5, time * layer.speed * 0.5 + 200);

            const waveHeight = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2) * p.height * layer.amplitude;

            // Color variation along x
            const hueVariation = p.noise(x * 0.005, time * 0.5) * shift;
            const currentHue = (layer.hue + hueVariation + time * 10) % 360;

            // Draw vertical gradient strip
            const stripHeight = waveHeight * (1 + intense);
            const y1 = baseY - stripHeight * 0.3;
            const y2 = baseY + stripHeight;

            // Create vertical gradient effect
            const gradientSteps = 20;
            for (let g = 0; g < gradientSteps; g++) {
              const t = g / gradientSteps;
              const y = p.lerp(y1, y2, t);
              const h = stripHeight / gradientSteps;

              // Alpha peaks in the middle and fades at edges
              const edgeFade = Math.sin(t * Math.PI);
              const alpha = layer.alpha * edgeFade * intense;

              // Brightness variation
              const brightness = 70 + edgeFade * 30;

              p.fill(currentHue, 60, brightness, alpha);
              p.rect(x, y, 3, h + 1);
            }
          }
        });

        // Add shimmer particles
        if (p.frameCount % 3 === 0) {
          for (let i = 0; i < 3; i++) {
            const px = p.random(p.width);
            const py = p.random(p.height * 0.1, p.height * 0.6);
            const shimmerHue = layers[Math.floor(p.random(layers.length))].hue;

            p.fill((shimmerHue + shift) % 360, 50, 100, 30 * intense);
            p.circle(px, py, p.random(2, 6));
          }
        }

        // Add star twinkles at the top
        if (p.frameCount % 10 === 0) {
          const sx = p.random(p.width);
          const sy = p.random(p.height * 0.3);
          const twinkle = p.random(0.5, 1);

          p.fill(0, 0, 100, 40 * twinkle);
          p.circle(sx, sy, 2);
        }

        // Subtle glow at horizon
        const horizonY = p.height * 0.8;
        for (let y = horizonY; y < p.height; y += 3) {
          const t = (y - horizonY) / (p.height - horizonY);
          const alpha = (1 - t) * 10 * intense;

          p.fill(220, 40, 30, alpha);
          p.rect(0, y, p.width, 4);
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
  }, [intensity, waveSpeed, colorShift]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
}

export default AuroraWaves;
