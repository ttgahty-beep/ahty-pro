import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, Stars, Text, Float } from '@react-three/drei';
import { Vector3, MathUtils } from 'three';
import { ThreeCar } from './ThreeCar';
import { CarConfig, GameState } from '../types';
import * as THREE from 'three';

// Constants
const LANE_WIDTH = 2.5;
const GAME_SPEED_START = 20;
const OBSTACLE_SPAWN_RATE = 0.05;

interface Game3DProps {
  config: CarConfig;
  onGameOver: (score: number) => void;
  onExit: () => void;
}

const MovingRoad = ({ speed }: { speed: number }) => {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (mesh.current) {
        // Scroll texture logic simulated by moving mesh and resetting
        mesh.current.position.z += speed * delta;
        if (mesh.current.position.z > 20) {
            mesh.current.position.z = -100;
        }
    }
  });

  return (
    <mesh ref={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -50]}>
      <planeGeometry args={[20, 300, 20, 20]} />
      <meshStandardMaterial 
        color="#050510" 
        roughness={0.8}
        metalness={0.2}
      />
      {/* Grid Lines */}
      <gridHelper args={[20, 20, 0xff00ff, 0x444444]} rotation={[-Math.PI/2, 0, 0]} position={[0, 0.02, 0]} />
    </mesh>
  );
};

const Obstacle = ({ position, type }: { position: Vector3, type: 'rock' | 'barrier' }) => {
    const color = type === 'rock' ? '#FF3366' : '#FF9900';
    return (
        <group position={position}>
            <mesh>
                <boxGeometry args={[1.5, 1.5, 1.5]} />
                <meshStandardMaterial 
                    color={color} 
                    emissive={color} 
                    emissiveIntensity={2} 
                    toneMapped={false} 
                />
            </mesh>
             {/* Reflection on ground */}
             <mesh position={[0, -0.74, 0]} rotation={[-Math.PI/2, 0, 0]}>
                <planeGeometry args={[1.8, 1.8]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} />
             </mesh>
        </group>
    );
};

const GameScene = ({ config, gameState, setGameState, onGameOver }: any) => {
  const [playerX, setPlayerX] = useState(0);
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(GAME_SPEED_START);
  
  // Obstacles state management
  const [obstacles, setObstacles] = useState<{id: number, pos: Vector3, type: 'rock'|'barrier'}[]>([]);
  const lastSpawn = useRef(0);
  const obstacleIdCounter = useRef(0);

  // Input Handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== GameState.PLAYING) return;
      if (e.key === 'ArrowLeft') setPlayerX(prev => Math.max(prev - 1, -1));
      if (e.key === 'ArrowRight') setPlayerX(prev => Math.min(prev + 1, 1));
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState]);

  // Game Loop
  useFrame((state, delta) => {
    if (gameState !== GameState.PLAYING) return;

    // Increase Score & Speed
    setScore(s => s + 1);
    setSpeed(s => Math.min(s + 0.01, 50)); // Cap speed

    // Move Obstacles
    setObstacles(prev => {
        const next = prev.map(obs => ({
            ...obs,
            pos: new Vector3(obs.pos.x, obs.pos.y, obs.pos.z + speed * delta)
        })).filter(obs => obs.pos.z < 10); // Remove if passed camera
        
        // Collision Detection
        for (const obs of next) {
            // Simple box collision
            if (Math.abs(obs.pos.z - 0) < 1.5 && Math.abs(obs.pos.x - (playerX * LANE_WIDTH)) < 1.0) {
                setGameState(GameState.GAME_OVER);
                onGameOver(score);
            }
        }
        return next;
    });

    // Spawn Obstacles
    if (state.clock.elapsedTime - lastSpawn.current > (10 / speed)) {
        if (Math.random() < 0.6) {
            const lane = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
            const type = Math.random() > 0.5 ? 'rock' : 'barrier';
            setObstacles(prev => [
                ...prev, 
                { 
                    id: obstacleIdCounter.current++, 
                    pos: new Vector3(lane * LANE_WIDTH, 0.75, -100), 
                    type 
                }
            ]);
            lastSpawn.current = state.clock.elapsedTime;
        }
    }
  });

  return (
    <>
        <PerspectiveCamera makeDefault position={[0, 4, 8]} rotation={[-0.2, 0, 0]} />
        
        {/* Environment */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={2} />
        <fog attach="fog" args={['#030508', 10, 80]} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} intensity={1} />
        
        {/* Dynamic Lights from Player */}
        <pointLight position={[playerX * LANE_WIDTH, 2, 0]} color={config.color} intensity={2} distance={10} />

        {/* Road Segments (Creating infinite illusion) */}
        <MovingRoad speed={speed} />
        <mesh position={[0, -0.6, 0]} rotation={[-Math.PI/2, 0, 0]}>
             <planeGeometry args={[100, 200]} />
             <meshBasicMaterial color="#020204" />
        </mesh>

        {/* Player Car */}
        <group position={[playerX * LANE_WIDTH, 0, 0]}>
            <ThreeCar config={config} isRotating={false} tilt={playerX * 20} />
        </group>

        {/* Obstacles */}
        {obstacles.map(obs => (
            <Obstacle key={obs.id} position={obs.pos} type={obs.type} />
        ))}
    </>
  );
};

export const Game3D: React.FC<Game3DProps> = ({ config, onGameOver, onExit }) => {
  const [gameState, setGameState] = useState<GameState>(GameState.PLAYING);
  
  return (
    <div className="w-full h-full relative bg-nexa-bg">
        {/* HUD */}
        <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between pointer-events-none">
            <div className="glass-pro px-6 py-2 rounded-br-2xl border-l-4 border-nexa-accent">
                <h2 className="text-2xl font-display font-bold italic text-white">SPEED: <span className="text-nexa-accent">MAX</span></h2>
            </div>
            <div className="glass-pro px-6 py-2 rounded-bl-2xl border-r-4 border-nexa-primary">
                <h2 className="text-2xl font-display font-bold text-white">STATUS: <span className="text-nexa-success animate-pulse">LIVE</span></h2>
            </div>
        </div>

        {/* Controls Overlay */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 text-center pointer-events-none opacity-50">
            <p className="text-sm font-mono tracking-widest text-nexa-accent">USE ARROW KEYS TO STRAFE</p>
        </div>

        <button 
            onClick={onExit}
            className="absolute top-6 right-1/2 translate-x-1/2 z-50 glass-pro px-4 py-1 rounded text-xs hover:bg-red-500/50 transition-colors pointer-events-auto"
        >
            ABORT MISSION
        </button>

        <Canvas>
            <GameScene 
                config={config} 
                gameState={gameState} 
                setGameState={setGameState} 
                onGameOver={onGameOver} 
            />
        </Canvas>

        {gameState === GameState.GAME_OVER && (
            <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm">
                 <div className="text-center p-12 glass-pro border-2 border-nexa-warning rounded-2xl relative overflow-hidden">
                     <div className="absolute inset-0 bg-nexa-warning/10 animate-pulse"></div>
                     <h1 className="text-6xl font-display font-black text-nexa-warning mb-4 glitch-text">WRECKED</h1>
                     <p className="text-xl mb-8">SYSTEM FAILURE DETECTED</p>
                     <div className="flex gap-4 justify-center">
                         <button 
                            onClick={() => window.location.reload()}
                            className="px-8 py-3 bg-nexa-warning text-black font-bold font-display hover:scale-105 transition-transform"
                         >
                            REBOOT SYSTEM
                         </button>
                         <button 
                            onClick={onExit}
                            className="px-8 py-3 border border-white text-white font-bold font-display hover:bg-white hover:text-black transition-colors"
                         >
                            RETURN TO BASE
                         </button>
                     </div>
                 </div>
            </div>
        )}
    </div>
  );
};
