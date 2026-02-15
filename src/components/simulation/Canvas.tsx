'use client';

import { useRef, useEffect } from 'react';
import { useModelStore } from '@/stores/model';
import { useSimulationStore } from '@/stores/simulation';

export function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const model = useModelStore((s) => s.model);
  const agents = useSimulationStore((s) => s.agents);
  const status = useSimulationStore((s) => s.status);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !model) return;

    // Set canvas size
    const rect = container.getBoundingClientRect();
    const scale = Math.min(
      rect.width / model.environment.width,
      rect.height / model.environment.height,
      1
    );
    
    canvas.width = model.environment.width;
    canvas.height = model.environment.height;
    canvas.style.width = `${model.environment.width * scale}px`;
    canvas.style.height = `${model.environment.height * scale}px`;

    // Draw
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = model.environment.backgroundColor || '#1a1a2e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Grid (subtle)
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

    // Draw agents
    const agentTypes = new Map(model.agentTypes.map((t) => [t.id, t]));
    
    for (const agent of agents) {
      const type = agentTypes.get(agent.typeId);
      if (!type) continue;

      ctx.fillStyle = type.color;
      ctx.beginPath();
      
      switch (type.shape) {
        case 'circle':
          ctx.arc(agent.x, agent.y, type.size / 2, 0, Math.PI * 2);
          break;
        case 'square':
          ctx.rect(
            agent.x - type.size / 2,
            agent.y - type.size / 2,
            type.size,
            type.size
          );
          break;
        case 'triangle':
          ctx.moveTo(agent.x, agent.y - type.size / 2);
          ctx.lineTo(agent.x + type.size / 2, agent.y + type.size / 2);
          ctx.lineTo(agent.x - type.size / 2, agent.y + type.size / 2);
          ctx.closePath();
          break;
      }
      
      ctx.fill();
    }

    // Status indicator
    if (status === 'idle' && agents.length === 0) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = '16px system-ui';
      ctx.textAlign = 'center';
      ctx.fillText(
        'Add agent types and populations to start',
        canvas.width / 2,
        canvas.height / 2
      );
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
