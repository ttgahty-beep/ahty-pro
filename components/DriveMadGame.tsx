
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { XCircle, Play, RotateCcw, Trophy, Target } from 'lucide-react';
import { CarConfig } from '../types';

interface DriveMadGameProps {
  onExit: () => void;
  config?: CarConfig; // Kept for prop compatibility, though not used in 2D shooter
}

// --- Game Constants ---
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 800;
const PLAYER_SPEED = 7;
const BULLET_SPEED = 15;
const ENEMY_SPEED_BASE = 3;
const SPAWN_RATE = 60; // Frames

// --- Types ---
interface Entity {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  vx: number;
  vy: number;
  type?: 'PLAYER' | 'ENEMY_BASIC' | 'ENEMY_FAST' | 'BOSS';
  hp: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

export const DriveMadGame: React.FC<DriveMadGameProps> = ({ onExit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  // Game State Refs (Mutable for Game Loop)
  const gameStateRef = useRef<'MENU' | 'PLAYING' | 'GAMEOVER'>('MENU');
  const frameRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const keys = useRef<{ [key: string]: boolean }>({});
  
  // Entities - INCREASED PLAYER SIZE HERE (w: 80, h: 100)
  const player = useRef<Entity>({ id: 0, x: CANVAS_WIDTH/2 - 40, y: CANVAS_HEIGHT - 150, w: 80, h: 100, color: '#00F6FF', vx: 0, vy: 0, hp: 1, type: 'PLAYER' });
  const bullets = useRef<Entity[]>([]);
  const enemies = useRef<Entity[]>([]);
  const particles = useRef<Particle[]>([]);
  const lastShotTime = useRef(0);
  const frameCount = useRef(0);
  const stars = useRef<{x: number, y: number, size: number, speed: number}[]>([]);

  // --- Initialization ---
  useEffect(() => {
    // Init Stars
    for(let i=0; i<100; i++) {
        stars.current.push({
            x: Math.random() * CANVAS_WIDTH,
            y: Math.random() * CANVAS_HEIGHT,
            size: Math.random() * 2,
            speed: Math.random() * 5 + 1
        });
    }

    const handleKeyDown = (e: KeyboardEvent) => { keys.current[e.key] = true; };
    const handleKeyUp = (e: KeyboardEvent) => { keys.current[e.key] = false; };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Start Loop
    frameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // --- Game Loop ---
  const gameLoop = (time: number) => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');

    if (canvas && ctx) {
        update(ctx);
        draw(ctx);
    }
    frameRef.current = requestAnimationFrame(gameLoop);
  };

  const startGame = () => {
      setScore(0);
      scoreRef.current = 0;
      setGameState('PLAYING');
      gameStateRef.current = 'PLAYING';
      
      // Reset Entities - ENSURE LARGE SIZE ON RESET
      player.current = { id: 0, x: CANVAS_WIDTH/2 - 40, y: CANVAS_HEIGHT - 150, w: 80, h: 100, color: '#00F6FF', vx: 0, vy: 0, hp: 1, type: 'PLAYER' };
      bullets.current = [];
      enemies.current = [];
      particles.current = [];
      frameCount.current = 0;
  };

  const spawnExplosion = (x: number, y: number, color: string, count: number = 10) => {
      for(let i=0; i<count; i++) {
          particles.current.push({
              id: Math.random(),
              x: x,
              y: y,
              vx: (Math.random() - 0.5) * 10,
              vy: (Math.random() - 0.5) * 10,
              life: 1.0,
              color: color,
              size: Math.random() * 3 + 1
          });
      }
  };

  // --- Update Logic ---
  const update = (ctx: CanvasRenderingContext2D) => {
      // 1. Update Stars (Background)
      stars.current.forEach(star => {
          star.y += star.speed;
          if(star.y > CANVAS_HEIGHT) {
              star.y = 0;
              star.x = Math.random() * CANVAS_WIDTH;
          }
      });

      if (gameStateRef.current !== 'PLAYING') return;

      frameCount.current++;

      // 2. Player Movement
      if (keys.current['ArrowLeft'] || keys.current['a']) player.current.x -= PLAYER_SPEED;
      if (keys.current['ArrowRight'] || keys.current['d']) player.current.x += PLAYER_SPEED;
      
      // Clamp Player
      player.current.x = Math.max(0, Math.min(CANVAS_WIDTH - player.current.w, player.current.x));

      // 3. Shooting
      if (keys.current[' '] || keys.current['ArrowUp'] || keys.current['w']) {
          if (frameCount.current - lastShotTime.current > 10) {
              bullets.current.push({
                  id: Math.random(),
                  x: player.current.x + player.current.w / 2 - 2,
                  y: player.current.y,
                  w: 4,
                  h: 15,
                  color: '#FF3366',
                  vx: 0,
                  vy: -BULLET_SPEED,
                  hp: 1
              });
              lastShotTime.current = frameCount.current;
          }
      }

      // 4. Update Bullets
      bullets.current.forEach(b => b.y += b.vy);
      bullets.current = bullets.current.filter(b => b.y > -20);

      // 5. Spawn Enemies
      const currentSpawnRate = Math.max(20, SPAWN_RATE - Math.floor(scoreRef.current / 500));
      if (frameCount.current % currentSpawnRate === 0) {
          const type = Math.random() > 0.8 ? 'ENEMY_FAST' : 'ENEMY_BASIC';
          enemies.current.push({
              id: Math.random(),
              x: Math.random() * (CANVAS_WIDTH - 40),
              y: -50,
              w: 40,
              h: 40,
              color: type === 'ENEMY_FAST' ? '#FFAA00' : '#7A3CFF',
              vx: type === 'ENEMY_FAST' ? (Math.random() - 0.5) * 4 : 0,
              vy: type === 'ENEMY_FAST' ? ENEMY_SPEED_BASE * 1.5 : ENEMY_SPEED_BASE + (scoreRef.current/1000),
              hp: type === 'ENEMY_FAST' ? 1 : 2,
              type: type
          });
      }

      // 6. Update Enemies
      enemies.current.forEach(e => {
          e.y += e.vy;
          e.x += e.vx;
          
          // Bounce off walls for fast enemies
          if(e.x <= 0 || e.x >= CANVAS_WIDTH - e.w) e.vx *= -1;
      });

      // 7. Collision Detection
      // Bullet vs Enemy
      bullets.current.forEach(b => {
          enemies.current.forEach(e => {
              if (rectIntersect(b, e)) {
                  e.hp--;
                  b.y = -100; // Remove bullet
                  spawnExplosion(b.x, b.y, '#FFF', 3);
                  if (e.hp <= 0) {
                       spawnExplosion(e.x + e.w/2, e.y + e.h/2, e.color, 15);
                       scoreRef.current += e.type === 'ENEMY_FAST' ? 200 : 100;
                       setScore(scoreRef.current);
                  }
              }
          });
      });

      // Player vs Enemy
      enemies.current.forEach(e => {
          if (rectIntersect(player.current, e)) {
              setGameState('GAMEOVER');
              gameStateRef.current = 'GAMEOVER';
              if (scoreRef.current > highScore) setHighScore(scoreRef.current);
              spawnExplosion(player.current.x, player.current.y, '#00F6FF', 50);
          }
      });

      // Cleanup Dead Enemies
      enemies.current = enemies.current.filter(e => e.hp > 0 && e.y < CANVAS_HEIGHT + 50);

      // 8. Update Particles
      particles.current.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 0.05;
      });
      particles.current = particles.current.filter(p => p.life > 0);
  };

  // --- Render Logic ---
  const draw = (ctx: CanvasRenderingContext2D) => {
      // Clear
      ctx.fillStyle = '#030508';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Draw Stars
      ctx.fillStyle = '#FFF';
      stars.current.forEach(star => {
          ctx.globalAlpha = Math.random() * 0.5 + 0.3;
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI*2);
          ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Grid Effect (Retro Arcade Feel)
      ctx.strokeStyle = 'rgba(122, 60, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= CANVAS_WIDTH; x += 50) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, CANVAS_HEIGHT);
      }
      for (let y = (frameCount.current * 2) % 50; y <= CANVAS_HEIGHT; y += 50) {
          ctx.moveTo(0, y);
          ctx.lineTo(CANVAS_WIDTH, y);
      }
      ctx.stroke();

      if (gameStateRef.current === 'PLAYING') {
          // Draw Player (Triangle)
          ctx.shadowBlur = 20;
          ctx.shadowColor = player.current.color;
          ctx.fillStyle = player.current.color;
          ctx.beginPath();
          ctx.moveTo(player.current.x + player.current.w/2, player.current.y);
          ctx.lineTo(player.current.x + player.current.w, player.current.y + player.current.h);
          ctx.lineTo(player.current.x, player.current.y + player.current.h);
          ctx.closePath();
          ctx.fill();
          
          // Engine Flame (Scaled proportionally to width)
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#FF3366';
          ctx.fillStyle = '#FF3366';
          ctx.beginPath();
          // Use percentage of width for flame base to scale correctly with larger ship
          ctx.moveTo(player.current.x + (player.current.w * 0.25), player.current.y + player.current.h);
          ctx.lineTo(player.current.x + (player.current.w * 0.75), player.current.y + player.current.h);
          // Make flame length proportional to ship size
          ctx.lineTo(player.current.x + player.current.w/2, player.current.y + player.current.h + (Math.random() * 30 + 20));
          ctx.fill();

          // Draw Bullets
          ctx.shadowColor = '#FF3366';
          ctx.fillStyle = '#FF3366';
          bullets.current.forEach(b => {
              ctx.fillRect(b.x, b.y, b.w, b.h);
          });

          // Draw Enemies
          enemies.current.forEach(e => {
              ctx.shadowColor = e.color;
              ctx.fillStyle = e.color;
              if (e.type === 'ENEMY_BASIC') {
                  ctx.fillRect(e.x, e.y, e.w, e.h);
                  // Inner Eye
                  ctx.fillStyle = '#000';
                  ctx.fillRect(e.x + 10, e.y + 10, e.w - 20, e.h - 20);
              } else {
                  // Diamond shape for fast enemies
                  ctx.beginPath();
                  ctx.moveTo(e.x + e.w/2, e.y);
                  ctx.lineTo(e.x + e.w, e.y + e.h/2);
                  ctx.lineTo(e.x + e.w/2, e.y + e.h);
                  ctx.lineTo(e.x, e.y + e.h/2);
                  ctx.fill();
              }
          });

          // Draw Particles
          particles.current.forEach(p => {
              ctx.shadowBlur = 0;
              ctx.globalAlpha = p.life;
              ctx.fillStyle = p.color;
              ctx.beginPath();
              ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
              ctx.fill();
          });
          ctx.globalAlpha = 1.0;
          ctx.shadowBlur = 0;
      }
  };

  const rectIntersect = (r1: Entity, r2: Entity) => {
      return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
  };

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-[#050505]">
        {/* Main Canvas Container */}
        <div className="relative shadow-[0_0_50px_rgba(0,246,255,0.2)] border-2 border-[#111] rounded-lg overflow-hidden" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
            <canvas 
                ref={canvasRef} 
                width={CANVAS_WIDTH} 
                height={CANVAS_HEIGHT}
                className="block bg-black"
            />

            {/* UI Overlay */}
            <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start pointer-events-none">
                <div className="flex flex-col">
                    <span className="text-nexa-muted text-xs font-mono">SCORE</span>
                    <span className="text-white text-2xl font-bold font-display">{score.toLocaleString()}</span>
                </div>
                <div className="flex flex-col text-right">
                    <span className="text-nexa-muted text-xs font-mono">HIGH SCORE</span>
                    <span className="text-nexa-accent text-2xl font-bold font-display">{highScore.toLocaleString()}</span>
                </div>
            </div>

            {/* Menu Screen */}
            {gameState === 'MENU' && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 animate-fade-in-up">
                    <Target size={64} className="text-nexa-accent mb-4" />
                    <h1 className="text-5xl font-black text-white font-display mb-2 italic">NEXA <span className="text-transparent bg-clip-text bg-gradient-to-r from-nexa-accent to-nexa-primary">INTERCEPTOR</span></h1>
                    <p className="text-nexa-muted font-mono text-sm mb-8 tracking-widest">DEFEND THE GRID</p>
                    
                    <button 
                        onClick={startGame}
                        className="group relative px-8 py-4 bg-nexa-primary text-white font-bold tracking-widest rounded transition-all hover:bg-white hover:text-black hover:scale-105"
                    >
                        <span className="flex items-center gap-2"><Play size={20} fill="currentColor"/> INITIATE LAUNCH</span>
                    </button>
                    
                    <div className="mt-12 text-center text-white/40 text-xs font-mono">
                        <p>CONTROLS</p>
                        <p className="mt-2 text-white">ARROW KEYS / WASD to Move</p>
                        <p className="text-white">SPACE / W to Fire</p>
                    </div>
                </div>
            )}

            {/* Game Over Screen */}
            {gameState === 'GAMEOVER' && (
                <div className="absolute inset-0 bg-red-900/40 backdrop-blur-md flex flex-col items-center justify-center z-10">
                    <h2 className="text-6xl font-black text-white font-display mb-4 drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)]">MISSION FAILED</h2>
                    <div className="text-center mb-8">
                        <p className="text-nexa-muted text-sm font-mono">FINAL SCORE</p>
                        <p className="text-4xl text-white font-bold">{score.toLocaleString()}</p>
                    </div>
                    
                    <div className="flex gap-4 pointer-events-auto">
                        <button 
                            onClick={startGame}
                            className="px-6 py-3 bg-white text-black font-bold rounded hover:bg-nexa-accent transition-colors flex items-center gap-2"
                        >
                            <RotateCcw size={18} /> RETRY
                        </button>
                        <button 
                            onClick={onExit}
                            className="px-6 py-3 bg-black/50 border border-white/20 text-white font-bold rounded hover:bg-red-500/50 transition-colors flex items-center gap-2"
                        >
                            <XCircle size={18} /> EXIT
                        </button>
                    </div>
                </div>
            )}
        </div>

        {/* Global Exit Button (Top Right) */}
        <button 
            onClick={onExit} 
            className="absolute top-8 right-8 p-4 bg-black/40 hover:bg-red-500/20 text-white/50 hover:text-white rounded-full transition-all border border-white/10"
        >
            <XCircle size={24} />
        </button>
    </div>
  );
};
