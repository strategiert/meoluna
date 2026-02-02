/**
 * DNA Helix - Doppelhelix Animation
 * Science-themed double helix visualization
 */

import { useRef, useEffect } from 'react';
import p5 from 'p5';

interface DNAHelixProps {
  rotationSpeed?: number;  // 0-100
  helixWidth?: number;     // 0-100
  basePairDensity?: number; // 0-100
}

export function DNAHelix({
  rotationSpeed = 40,
  helixWidth = 50,
  basePairDensity = 50
}: DNAHelixProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let time = 0;

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current!.offsetWidth,
          containerRef.current!.offsetHeight
        );
        canvas.style('display', 'block');
        p.colorMode(p.HSB, 360, 100, 100, 100);
      };

      p.draw = () => {
        p.clear();

        const rotation = (rotationSpeed / 100) * 0.05;
        const width = (helixWidth / 100) * 150 + 50;
        const density = Math.floor((basePairDensity / 100) * 30) + 10;

        time += rotation;

        const centerX = p.width / 2;
        const spacing = p.height / density;

        // Base pair colors (A-T: Blue-Yellow, G-C: Green-Red)
        const basePairColors: [number, number][] = [
          [220, 45],   // A-T (Blue-Yellow)
          [120, 0],    // G-C (Green-Red)
        ];

        // Draw multiple helixes across the screen
        const numHelixes = 3;

        for (let h = 0; h < numHelixes; h++) {
          const hOffset = (h - 1) * p.width * 0.35;
          const hx = centerX + hOffset;
          const opacity = h === 1 ? 1 : 0.4;

          // Draw connecting rungs (base pairs)
          for (let i = 0; i < density; i++) {
            const y = i * spacing;
            const phase = time + i * 0.15 + h * 0.5;

            // Calculate positions of both strands
            const x1 = hx + Math.cos(phase) * width;
            const x2 = hx + Math.cos(phase + p.PI) * width;

            // Depth-based sizing
            const z1 = Math.sin(phase);
            const z2 = Math.sin(phase + p.PI);

            // Only draw rung if both points are visible (front half)
            const [hue1, hue2] = basePairColors[i % 2];

            // Draw the rung (base pair connection)
            const gradient = 20;
            for (let g = 0; g <= gradient; g++) {
              const t = g / gradient;
              const gx = p.lerp(x1, x2, t);
              const gz = p.lerp(z1, z2, t);
              const gHue = p.lerp(hue1, hue2, t);

              const alpha = p.map(gz, -1, 1, 15, 40) * opacity;
              const size = p.map(gz, -1, 1, 2, 6);

              p.noStroke();
              p.fill(gHue, 60, 80, alpha);
              p.circle(gx, y, size);
            }
          }

          // Draw the two backbone strands
          for (let strand = 0; strand < 2; strand++) {
            const strandPhase = strand * p.PI;

            p.noFill();
            p.beginShape();

            for (let y = 0; y < p.height + spacing; y += 5) {
              const phase = time + (y / spacing) * 0.15 + h * 0.5 + strandPhase;
              const x = hx + Math.cos(phase) * width;
              const z = Math.sin(phase);

              // Color and weight based on depth
              const alpha = p.map(z, -1, 1, 20, 70) * opacity;
              const weight = p.map(z, -1, 1, 1, 4);

              p.stroke(strand === 0 ? 200 : 260, 50, 80, alpha);
              p.strokeWeight(weight);
              p.vertex(x, y);
            }

            p.endShape();

            // Draw nucleotide nodes on backbone
            for (let i = 0; i < density; i++) {
              const y = i * spacing;
              const phase = time + i * 0.15 + h * 0.5 + strandPhase;
              const x = hx + Math.cos(phase) * width;
              const z = Math.sin(phase);

              const alpha = p.map(z, -1, 1, 30, 80) * opacity;
              const size = p.map(z, -1, 1, 4, 12);

              p.noStroke();

              // Outer glow
              p.fill(strand === 0 ? 200 : 260, 60, 90, alpha * 0.3);
              p.circle(x, y, size * 2);

              // Core
              p.fill(strand === 0 ? 200 : 260, 50, 90, alpha);
              p.circle(x, y, size);

              // Highlight
              if (z > 0.5) {
                p.fill(0, 0, 100, alpha * 0.5);
                p.circle(x - size * 0.2, y - size * 0.2, size * 0.3);
              }
            }
          }
        }

        // Add floating particles
        if (p.frameCount % 5 === 0) {
          const px = p.random(p.width);
          const py = p.random(p.height);
          p.noStroke();
          p.fill(p.random([200, 220, 260]), 60, 90, 30);
          p.circle(px, py, p.random(2, 5));
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
  }, [rotationSpeed, helixWidth, basePairDensity]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none"
    />
  );
}

export default DNAHelix;
