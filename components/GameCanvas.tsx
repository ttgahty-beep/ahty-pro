import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameState } from '../types';
import { getCrewChiefAdvice } from '../services/ai';

interface GameCanvasProps {
  onGameOver: (score: number) => void;
  carColor: string;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onGameOver, carColor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>(GameState.PLAYING);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(0);
  const [aiMessage, setAiMessage] = useState("Race Initiated. Accelerate!");
  
  // Game State Refs (for loop)
  const playerPos = useRef({ x: 0, y: 0 }); // x: -1 to 1 range
  const obstacles = useRef<{x: number, y: number, type: 'rock' | 'enemy'}[]>([]);
  const frameId = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const gameSpeed = useRef(0.01);
  const scoreRef = useRef(0);

  // Controls
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft') playerPos.current.x = Math.max(-0.8, playerPos.current.x - 0.2);
    if (e.key === 'ArrowRight') playerPos.current.x = Math.min(0.8, playerPos.current.x + 0.2);
  }, []);

  // AI Updater
  useEffect(() => {
    const interval = setInterval(async () => {
      if (gameState === GameState.PLAYING && Math.random() > 0.7) {
        const advice = await getCrewChiefAdvice("Mid-race status check.", { speed: Math.floor(gameSpeed.current * 10000), score: scoreRef.current });
        setAiMessage(advice);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [gameState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset
    playerPos.current = { x: 0, y: 0.8 };
    obstacles.current = [];
    gameSpeed.current = 0.01;
    scoreRef.current = 0;
    setGameState(GameState.PLAYING);

    const render = (time: number) => {
      const delta = time - lastTime.current;
      lastTime.current = time;

      // Update Logic
      gameSpeed.current += 0.00001; // Accelerate
      scoreRef.current += 1;
      setScore(scoreRef.current);
      setSpeed(Math.floor(gameSpeed.current * 10000));

      // Spawn Obstacles
      if (Math.random() < 0.02) {
        obstacles.current.push({
          x: (Math.random() * 1.6) - 0.8,
          y: -0.2,
          type: Math.random() > 0.5 ? 'rock' : 'enemy'
        });
      }

      // Move Obstacles
      obstacles.current.forEach(obs => {
        obs.y += gameSpeed.current * (delta || 16);
      });

      // Collision Detection
      const playerRect = { 
        x: (playerPos.current.x * canvas.width/2) + canvas.width/2 - 20, 
        y: (playerPos.current.y * canvas.height), 
        w: 40, h: 60 
      };

      for (const obs of obstacles.current) {
         const obsX = (obs.x * canvas.width/2) + canvas.width/2;
         const obsY = obs.y * canvas.height;
         
         if (
           playerRect.x < obsX + 30 &&
           playerRect.x + playerRect.w > obsX - 30 &&
           playerRect.y < obsY + 30 &&
           playerRect.y + playerRect.h > obsY - 30
         ) {
           setGameState(GameState.GAME_OVER);
           onGameOver(scoreRef.current);
           cancelAnimationFrame(frameId.current);
           return; 
         }
      }

      // Cleanup off-screen
      obstacles.current = obstacles.current.filter(obs => obs.y < 1.2);

      // Draw
      // Clear
      ctx.fillStyle = '#0B1020';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid / Road Effect
      ctx.strokeStyle = '#7A3CFF';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width/2, 0);
      ctx.lineTo(canvas.width/2, canvas.height);
      ctx.stroke();

      // Moving Lines
      const offset = (time * gameSpeed.current * 2) % 100;
      for(let i=0; i<canvas.height; i+=50) {
         const y = (i + offset) % canvas.height;
         ctx.fillStyle = 'rgba(0, 246, 255, 0.1)';
         ctx.fillRect(0, y, canvas.width, 2);
      }

      // Draw Player
      ctx.save();
      ctx.translate((playerPos.current.x * canvas.width/2) + canvas.width/2, playerPos.current.y * canvas.height);
      
      // Car Body
      ctx.fillStyle = carColor;
      ctx.shadowBlur = 15;
      ctx.shadowColor = carColor;
      ctx.beginPath();
      ctx.moveTo(0, -30);
      ctx.lineTo(20, 30);
      ctx.lineTo(-20, 30);
      ctx.fill();
      
      // Engine Glow
      ctx.fillStyle = '#00F6FF';
      ctx.fillRect(-5, 25, 10, 5);
      
      ctx.restore();

      // Draw Obstacles
      obstacles.current.forEach(obs => {
        ctx.save();
        ctx.translate((obs.x * canvas.width/2) + canvas.width/2, obs.y * canvas.height);
        ctx.fillStyle = obs.type === 'rock' ? '#FF6A00' : '#9DFF00';
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(-15, -15, 30, 30);
        ctx.restore();
      });

      frameId.current = requestAnimationFrame(render);
    };

    frameId.current = requestAnimationFrame(render);

    return () => cancelAnimationFrame(frameId.current);
  }, [gameState, onGameOver, carColor]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-nexa-dark border-2 border-nexa-cyan rounded-lg overflow-hidden">
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
         <div className="glass-panel px-4 py-2 rounded text-nexa-cyan text-xl font-bold">
           SPEED: {speed} KM/H
         </div>
         <div className="glass-panel px-4 py-2 rounded text-nexa-lime text-xl font-bold">
           SCORE: {score}
         </div>
      </div>
      
      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="glass-panel p-3 rounded flex items-center gap-3 border-l-4 border-nexa-violet">
           <div className="w-10 h-10 rounded-full bg-nexa-violet flex items-center justify-center font-bold">AI</div>
           <p className="text-sm text-nexa-text italic">{aiMessage}</p>
        </div>
      </div>

      <canvas 
        ref={canvasRef} 
        width={600} 
        height={800} 
        className="w-full h-full object-cover"
      />
      
      {gameState === GameState.GAME_OVER && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-20">
          <h2 className="text-6xl font-bold text-nexa-orange mb-4">CRASHED</h2>
          <p className="text-2xl text-white mb-8">Final Score: {score}</p>
          <button 
            onClick={() => window.location.reload()} // Simple reload to restart logic cleanly
            className="px-8 py-3 bg-nexa-cyan text-black font-bold rounded hover:bg-white transition-all"
          >
            RETRY MISSION
          </button>
        </div>
      )}
    </div>
  );
};
