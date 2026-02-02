/**
 * Circuit Board - Leuchtende Leiterbahnen
 * Tech/Digital aesthetic with glowing circuits
 */

import { useRef, useEffect, useState } from 'react';
import p5 from 'p5';

interface CircuitBoardProps {
  density?: number;        // 0-100
  pulseSpeed?: number;     // 0-100
  glowIntensity?: number;  // 0-100
}

export function CircuitBoard({
  density = 50,
  pulseSpeed = 40,
  glowIntensity = 60
}: CircuitBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5 | null>(null);
  const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p: p5) => {
      interface Node {
        x: number;
        y: number;
        connections: number[];
        type: 'chip' | 'junction' | 'endpoint';
        activated: number;
        pulsePhase: number;
      }

      interface Pulse {
        fromNode: number;
        toNode: number;
        progress: number;
        speed: number;
        hue: number;
      }

      const nodes: Node[] = [];
      const pulses: Pulse[] = [];
      let time = 0;
      const gridSize = 60;

      p.setup = () => {
        const canvas = p.createCanvas(
          containerRef.current!.offsetWidth,
          containerRef.current!.offsetHeight
        );
        canvas.style('display', 'block');
        p.colorMode(p.HSB, 360, 100, 100, 100);

        // Create grid of potential nodes
        const cols = Math.floor(p.width / gridSize);
        const rows = Math.floor(p.height / gridSize);
        const nodeDensity = (density / 100) * 0.5 + 0.2;

        const gridNodes: (number | null)[][] = [];

        for (let y = 0; y <= rows; y++) {
          gridNodes[y] = [];
          for (let x = 0; x <= cols; x++) {
            if (p.random() < nodeDensity) {
              const nodeIndex = nodes.length;
              gridNodes[y][x] = nodeIndex;

              const type = p.random() < 0.1 ? 'chip' :
                          p.random() < 0.3 ? 'junction' : 'endpoint';

              nodes.push({
                x: x * gridSize + p.random(-10, 10),
                y: y * gridSize + p.random(-10, 10),
                connections: [],
                type,
                activated: 0,
                pulsePhase: p.random(p.TWO_PI)
              });
            } else {
              gridNodes[y][x] = null;
            }
          }
        }

        // Connect adjacent nodes
        for (let y = 0; y <= rows; y++) {
          for (let x = 0; x <= cols; x++) {
            const nodeIndex = gridNodes[y]?.[x];
            if (nodeIndex === null || nodeIndex === undefined) continue;

            // Check right neighbor
            if (gridNodes[y]?.[x + 1] !== null && gridNodes[y]?.[x + 1] !== undefined) {
              nodes[nodeIndex].connections.push(gridNodes[y][x + 1]!);
            }
            // Check bottom neighbor
            if (gridNodes[y + 1]?.[x] !== null && gridNodes[y + 1]?.[x] !== undefined) {
              nodes[nodeIndex].connections.push(gridNodes[y + 1][x]!);
            }
            // Diagonal connections (less frequent)
            if (p.random() < 0.3 && gridNodes[y + 1]?.[x + 1] !== null && gridNodes[y + 1]?.[x + 1] !== undefined) {
              nodes[nodeIndex].connections.push(gridNodes[y + 1][x + 1]!);
            }
          }
        }
      };

      p.draw = () => {
        p.clear();

        const speed = (pulseSpeed / 100) * 0.03;
        const glow = glowIntensity / 100;
        time += speed;

        // Spawn new pulses occasionally
        if (p.frameCount % 20 === 0 && pulses.length < 30) {
          const startNode = Math.floor(p.random(nodes.length));
          if (nodes[startNode].connections.length > 0) {
            const endNode = p.random(nodes[startNode].connections);
            pulses.push({
              fromNode: startNode,
              toNode: endNode,
              progress: 0,
              speed: p.random(0.02, 0.05) * (pulseSpeed / 50),
              hue: p.random([180, 200, 220, 260]) // Cyan to purple
            });
          }
        }

        // Draw connections (traces)
        nodes.forEach((node) => {
          node.connections.forEach(connIndex => {
            const other = nodes[connIndex];

            // Base trace
            p.stroke(200, 30, 40, 20);
            p.strokeWeight(1);
            p.line(node.x, node.y, other.x, other.y);

            // Glow on activated traces
            const activation = (node.activated + other.activated) / 2;
            if (activation > 0) {
              p.stroke(210, 60, 80, activation * 30 * glow);
              p.strokeWeight(3);
              p.line(node.x, node.y, other.x, other.y);
            }
          });
        });

        // Update and draw pulses
        for (let i = pulses.length - 1; i >= 0; i--) {
          const pulse = pulses[i];
          pulse.progress += pulse.speed;

          if (pulse.progress >= 1) {
            // Activate destination node
            nodes[pulse.toNode].activated = 1;

            // Chain reaction - spawn new pulse from destination
            if (p.random() < 0.6 && nodes[pulse.toNode].connections.length > 0) {
              const nextNode = p.random(nodes[pulse.toNode].connections);
              if (nextNode !== pulse.fromNode) {
                pulses.push({
                  fromNode: pulse.toNode,
                  toNode: nextNode,
                  progress: 0,
                  speed: pulse.speed,
                  hue: pulse.hue
                });
              }
            }

            pulses.splice(i, 1);
            continue;
          }

          const from = nodes[pulse.fromNode];
          const to = nodes[pulse.toNode];
          const x = p.lerp(from.x, to.x, pulse.progress);
          const y = p.lerp(from.y, to.y, pulse.progress);

          // Pulse glow
          p.noStroke();
          p.fill(pulse.hue, 70, 100, 30 * glow);
          p.circle(x, y, 15);

          // Pulse core
          p.fill(pulse.hue, 50, 100, 80);
          p.circle(x, y, 5);
        }

        // Mouse activation
        nodes.forEach(node => {
          const mouseDist = p.dist(node.x, node.y, mousePos.x, mousePos.y);
          if (mouseDist < 100) {
            node.activated = Math.max(node.activated, p.map(mouseDist, 0, 100, 1, 0));
          }
        });

        // Draw nodes
        nodes.forEach(node => {
          // Decay activation
          node.activated *= 0.95;

          const baseSize = node.type === 'chip' ? 12 :
                          node.type === 'junction' ? 8 : 4;
          const pulse = Math.sin(time * 3 + node.pulsePhase) * 0.2 + 1;
          const size = baseSize * pulse * (1 + node.activated * 0.5);

          // Outer glow
          if (glow > 0) {
            p.noStroke();
            p.fill(210, 50, 80, (10 + node.activated * 30) * glow);
            p.circle(node.x, node.y, size * 3);
          }

          // Node body
          p.fill(210, 40, 50 + node.activated * 40, 60 + node.activated * 30);
          p.noStroke();

          if (node.type === 'chip') {
            p.rectMode(p.CENTER);
            p.rect(node.x, node.y, size * 1.5, size, 2);
          } else {
            p.circle(node.x, node.y, size);
          }

          // Bright center when activated
          if (node.activated > 0.3) {
            p.fill(180, 60, 100, 50 * node.activated);
            p.circle(node.x, node.y, size * 0.5);
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
  }, [density, pulseSpeed, glowIntensity]);

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

export default CircuitBoard;
