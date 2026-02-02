/**
 * Math Grid - Koordinatensystem mit tanzenden Funktionen
 * Mathematical visualization with animated functions
 */

import { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

interface MathGridProps {
  animationSpeed?: number;  // 0-100
  functionCount?: number;   // 0-100
  gridOpacity?: number;     // 0-100
}

export function MathGrid({
  animationSpeed = 40,
  functionCount = 50,
  gridOpacity = 30
}: MathGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      let time = 0;

      interface MathFunction {
        fn: (x: number, t: number) => number;
        hue: number;
        amplitude: number;
        frequency: number;
        phase: number;
        name: string;
      }

      const functions: MathFunction[] = [];

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current!.offsetWidth,
          containerRef.current!.offsetHeight
        );
        canvas.style('display', 'block');
        p.colorMode(p.HSB, 360, 100, 100, 100);

        // Define mathematical functions
        const baseFunctions = [
          { fn: (x: number, t: number) => Math.sin(x + t), name: 'sin' },
          { fn: (x: number, t: number) => Math.cos(x + t), name: 'cos' },
          { fn: (x: number, t: number) => Math.sin(x * 2 + t) * 0.5, name: 'sin2x' },
          { fn: (x: number, t: number) => Math.cos(x * 0.5 + t) * 1.5, name: 'cos½x' },
          { fn: (x: number, t: number) => Math.sin(x + t) * Math.cos(x * 0.5), name: 'sincos' },
          { fn: (x: number, t: number) => Math.tan(x * 0.3 + t) * 0.2, name: 'tan' },
          { fn: (x: number, t: number) => x * 0.1 * Math.sin(t), name: 'linear' },
          { fn: (x: number, t: number) => Math.pow(x * 0.1, 2) * Math.sin(t) * 0.1, name: 'x²' },
        ];

        const numFuncs = Math.floor((functionCount / 100) * 6) + 2;

        for (let i = 0; i < numFuncs; i++) {
          const base = baseFunctions[i % baseFunctions.length];
          functions.push({
            fn: base.fn,
            hue: 200 + (i / numFuncs) * 80,
            amplitude: p.random(30, 80),
            frequency: p.random(0.5, 2),
            phase: p.random(p.TWO_PI),
            name: base.name
          });
        }
      };

      p.draw = () => {
        p.clear();

        const speed = (animationSpeed / 100) * 0.05;
        const gridAlpha = (gridOpacity / 100) * 30;

        time += speed;

        const centerX = p.width / 2;
        const centerY = p.height / 2;
        const scale = Math.min(p.width, p.height) / 10;

        // Draw grid
        p.stroke(220, 30, 50, gridAlpha);
        p.strokeWeight(1);

        // Vertical lines
        for (let x = 0; x <= p.width; x += scale) {
          const alpha = x === centerX ? gridAlpha * 2 : gridAlpha;
          p.stroke(220, 30, 50, alpha);
          p.strokeWeight(x === Math.floor(centerX / scale) * scale ? 2 : 1);
          p.line(x, 0, x, p.height);
        }

        // Horizontal lines
        for (let y = 0; y <= p.height; y += scale) {
          const alpha = Math.abs(y - centerY) < scale / 2 ? gridAlpha * 2 : gridAlpha;
          p.stroke(220, 30, 50, alpha);
          p.strokeWeight(Math.abs(y - centerY) < scale / 2 ? 2 : 1);
          p.line(0, y, p.width, y);
        }

        // Draw axis labels
        p.fill(220, 30, 70, 40);
        p.noStroke();
        p.textSize(12);
        p.textAlign(p.CENTER, p.CENTER);

        for (let i = -5; i <= 5; i++) {
          if (i !== 0) {
            p.text(i.toString(), centerX + i * scale, centerY + 15);
            p.text((-i).toString(), centerX - 15, centerY + i * scale);
          }
        }

        // Draw origin
        p.fill(220, 50, 90, 50);
        p.circle(centerX, centerY, 8);
        p.text('0', centerX - 15, centerY + 15);

        // Draw functions
        functions.forEach((func, index) => {
          const mouseDistToCenter = p.dist(mousePos.x, mousePos.y, centerX, centerY);
          const mouseInfluence = p.map(mouseDistToCenter, 0, 300, 0.5, 0);

          p.noFill();
          p.strokeWeight(2);

          // Glow
          p.stroke(func.hue, 60, 80, 15);
          p.strokeWeight(6);
          p.beginShape();
          for (let px = 0; px < p.width; px += 3) {
            const x = (px - centerX) / scale;
            const y = func.fn(x * func.frequency, time + func.phase) * func.amplitude;
            const adjustedY = y * (1 + mouseInfluence * Math.sin(time * 2 + index));
            p.vertex(px, centerY - adjustedY);
          }
          p.endShape();

          // Main line
          p.stroke(func.hue, 50, 90, 50);
          p.strokeWeight(2);
          p.beginShape();
          for (let px = 0; px < p.width; px += 2) {
            const x = (px - centerX) / scale;
            const y = func.fn(x * func.frequency, time + func.phase) * func.amplitude;
            const adjustedY = y * (1 + mouseInfluence * Math.sin(time * 2 + index));
            p.vertex(px, centerY - adjustedY);
          }
          p.endShape();
        });

        // Draw moving point on first function
        if (functions.length > 0) {
          const func = functions[0];
          const pointX = (Math.sin(time) * 0.5 + 0.5) * p.width;
          const x = (pointX - centerX) / scale;
          const y = func.fn(x * func.frequency, time + func.phase) * func.amplitude;

          // Point glow
          p.noStroke();
          p.fill(func.hue, 80, 100, 30);
          p.circle(pointX, centerY - y, 20);

          // Point core
          p.fill(func.hue, 60, 100, 80);
          p.circle(pointX, centerY - y, 8);

          // Coordinate display
          p.fill(220, 30, 90, 60);
          p.textSize(10);
          p.textAlign(p.LEFT, p.BOTTOM);
          p.text(`(${x.toFixed(1)}, ${(y / func.amplitude).toFixed(2)})`, pointX + 10, centerY - y - 5);
        }

        // Function labels
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(14);
        functions.forEach((func, i) => {
          p.fill(func.hue, 50, 90, 60);
          p.text(`f${i + 1}(x) = ${func.name}`, 20, 20 + i * 20);
        });
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
  }, [animationSpeed, functionCount, gridOpacity]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto"
      onMouseMove={handleMouseMove}
    />
  );
}

export default MathGrid;
