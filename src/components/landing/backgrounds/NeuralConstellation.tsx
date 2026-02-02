/**
 * Neural Constellation - Verbundene Knoten die bei Hover aufleuchten
 * AI/Neural network inspired visualization
 */

import { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

interface NeuralConstellationProps {
  nodeCount?: number;      // 0-100
  connectionDistance?: number;  // 0-100
  pulseSpeed?: number;     // 0-100
}

export function NeuralConstellation({
  nodeCount = 50,
  connectionDistance = 50,
  pulseSpeed = 40
}: NeuralConstellationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      interface Node {
        x: number;
        y: number;
        vx: number;
        vy: number;
        radius: number;
        pulsePhase: number;
        baseHue: number;
        activated: number; // 0-1 activation level
      }

      const nodes: Node[] = [];
      let time = 0;

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current!.offsetWidth,
          containerRef.current!.offsetHeight
        );
        canvas.style('display', 'block');
        p.colorMode(p.HSB, 360, 100, 100, 100);

        const numNodes = Math.floor((nodeCount / 100) * 60) + 20;

        for (let i = 0; i < numNodes; i++) {
          nodes.push({
            x: p.random(p.width),
            y: p.random(p.height),
            vx: p.random(-0.3, 0.3),
            vy: p.random(-0.3, 0.3),
            radius: p.random(2, 5),
            pulsePhase: p.random(p.TWO_PI),
            baseHue: p.random(200, 260),
            activated: 0
          });
        }
      };

      p.draw = () => {
        p.clear();

        const maxDist = (connectionDistance / 100) * 200 + 50;
        const pulse = pulseSpeed / 50;
        time += 0.02 * pulse;

        // Update and draw nodes
        nodes.forEach((node, i) => {
          // Move nodes
          node.x += node.vx;
          node.y += node.vy;

          // Bounce off edges
          if (node.x < 0 || node.x > p.width) node.vx *= -1;
          if (node.y < 0 || node.y > p.height) node.vy *= -1;
          node.x = p.constrain(node.x, 0, p.width);
          node.y = p.constrain(node.y, 0, p.height);

          // Calculate activation based on mouse proximity
          const mouseDist = p.dist(node.x, node.y, mousePos.x, mousePos.y);
          const mouseActivation = mouseDist < 150 ? p.map(mouseDist, 0, 150, 1, 0) : 0;

          // Smooth activation transition
          node.activated = p.lerp(node.activated, mouseActivation, 0.1);

          // Draw connections
          for (let j = i + 1; j < nodes.length; j++) {
            const other = nodes[j];
            const d = p.dist(node.x, node.y, other.x, other.y);

            if (d < maxDist) {
              const alpha = p.map(d, 0, maxDist, 40, 0);
              const combinedActivation = (node.activated + other.activated) / 2;

              // Connection line
              p.stroke(
                node.baseHue,
                50 + combinedActivation * 30,
                60 + combinedActivation * 40,
                alpha + combinedActivation * 30
              );
              p.strokeWeight(0.5 + combinedActivation);
              p.line(node.x, node.y, other.x, other.y);

              // Traveling pulse on activated connections
              if (combinedActivation > 0.3) {
                const pulsePos = (p.sin(time * 2 + i * 0.1) + 1) / 2;
                const px = p.lerp(node.x, other.x, pulsePos);
                const py = p.lerp(node.y, other.y, pulsePos);

                p.noStroke();
                p.fill(node.baseHue, 80, 100, 40 * combinedActivation);
                p.circle(px, py, 4);
              }
            }
          }
        });

        // Draw nodes on top
        nodes.forEach(node => {
          const pulseScale = 1 + p.sin(time + node.pulsePhase) * 0.2 * pulse;
          const r = node.radius * pulseScale * (1 + node.activated * 0.5);

          // Outer glow
          p.noStroke();
          p.fill(node.baseHue, 60, 100, 15 + node.activated * 25);
          p.circle(node.x, node.y, r * 4);

          // Inner core
          p.fill(node.baseHue, 40, 100, 60 + node.activated * 40);
          p.circle(node.x, node.y, r);

          // Bright center when activated
          if (node.activated > 0.5) {
            p.fill(0, 0, 100, 50 * node.activated);
            p.circle(node.x, node.y, r * 0.5);
          }
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
  }, [nodeCount, connectionDistance, pulseSpeed]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  };

  const handleMouseLeave = () => {
    setMousePos({ x: -1000, y: -1000 });
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-auto"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    />
  );
}

export default NeuralConstellation;
