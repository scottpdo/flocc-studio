'use client';

/**
 * Canvas
 * 
 * Renders the simulation using HTML Canvas.
 * Gets agent state from the simulation store.
 */

import { useRef, useEffect } from 'react';
import { useModelStore } from '@/stores/model';
import { useSimulationStore } from '@/stores/simulation';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const model = useModelStore((s) => s.model);
  const agents = useSimulationStore((s) => s.agents);
  const status = useSimulationStore((s) => s.status);

  // Draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !model) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    const envWidth = model.environment.width;
    const envHeight = model.environment.height;

    // Scale to fit container while maintaining aspect ratio
    const scale = Math.min(rect.width / envWidth, rect.height / envHeight, 1);

    canvas.width = envWidth;
    canvas.height = envHeight;
    canvas.style.width = `${envWidth * scale}px`;
    canvas.style.height = `${envHeight * scale}px`;

    // Get context
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and draw background
    ctx.fillStyle = model.environment.backgroundColor || '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = gridSize; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = gridSize; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Build agent type lookup
    const agentTypes = new Map(model.agentTypes.map((t) => [t.id, t]));

    // Draw agents
    for (const agent of agents) {
      const type = agentTypes.get(agent.typeId);
      if (!type) continue;

      ctx.fillStyle = type.color;
      ctx.beginPath();

      const x = agent.x;
      const y = agent.y;
      const size = type.size;

      switch (type.shape) {
        case 'circle':
          ctx.arc(x, y, size / 2, 0, Math.PI * 2);
          break;
        case 'square':
          ctx.rect(x - size / 2, y - size / 2, size, size);
          break;
        case 'triangle':
          ctx.moveTo(x, y - size / 2);
          ctx.lineTo(x + size / 2, y + size / 2);
          ctx.lineTo(x - size / 2, y + size / 2);
          ctx.closePath();
          break;
      }

      ctx.fill();
    }

    // Show placeholder if no agents
    if (status === 'idle' && agents.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';

      if (model.agentTypes.length === 0) {
        ctx.fillText('Add an agent type to get started', canvas.width / 2, canvas.height / 2);
      } else if (model.populations.length === 0) {
        ctx.fillText('Set agent populations to spawn agents', canvas.width / 2, canvas.height / 2);
      } else {
        ctx.fillText('Press Play to start the simulation', canvas.width / 2, canvas.height / 2);
      }
    }
  }, [model, agents, status]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center bg-gray-900 rounded-lg overflow-hidden"
    >
      <canvas ref={canvasRef} className="shadow-lg" />
    </div>
  );
}
