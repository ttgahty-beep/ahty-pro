
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Stars, Text, Float } from '@react-three/drei';
import { Vector3, MathUtils, Group } from 'three';
import * as THREE from 'three';
import { ThreeCar } from './ThreeCar';
import { CarConfig, GameState } from '../types';

// --- Constants & Config ---
const LANE_WIDTH = 3.5;
const LANES = [-LANE_WIDTH, 0, LANE_WIDTH];
const GAME_SPEED_START = 30;
const MAX_SPEED = 120;
const ACCELERATION = 0.5;

interface Game3DProps {
  config: CarConfig;
  onGameOver: (score: number) => void;
  onExit: () => void;
}

// --- Scenic Elements ---

const RetroSun = () => {
  return (
    <mesh position={[0, 20, -150]}>
      <circleGeometry args={[40, 64]} />
      <meshBasicMaterial color={'#ff0055'} fog={false} />
    </mesh>
  );
};

const MovingGrid = ({ speed }: { speed: number }) => {
  const mesh = useRef<THREE.LineSegments>(null);
  useFrame((state, delta) => {
    if (mesh.current) {
        mesh.current.position.z += speed * delta;
        if (mesh.current.position.z > 20) {
            mesh.current.position.z = -80;
        }
    }
  });

  return (
    <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, -50]}>
            <planeGeometry args={[100, 400]} />
            <meshStandardMaterial color="#050214" roughness={0.1} metalness={0.8} />
        </mesh>
        
        <gridHelper 
            ref={mesh} 
            args={[200, 100, 0xff0055, 0x220033]} 
            position={[0, 0.1, -80]} 
            rotation={[0, 0, 0]}
        />
    </group>
  );
};

const SpeedParticles = ({ speed }: { speed: number }) => {
    const count = 60;
    const mesh = useRef<THREE.InstancedMesh>(null);
    const dummy = useMemo(() => new THREE.Object3D(), []);
    const particles = useMemo(() => {
        const temp = [];
        for(let i=0; i<count; i++) {
            temp.push({
                x: (Math.random() - 0.5) * 60,
                y: (Math.random()) * 20,
                z: -Math.random() * 100,
                vel: Math.random() + 0.5
            });
        }
        return temp;
    }, []);

    useFrame((state, delta) => {
        if(!mesh.current) return;
        particles.forEach((p, i) => {
            p.z += (speed * p.vel + 10) * delta;
            if(p.z > 10) p.z = -100;
            dummy.position.set(p.x, p.y, p.z);
            dummy.scale.set(0.05, 0.05, Math.min(speed * 0.1, 5));
            dummy.updateMatrix();
            mesh.current!.setMatrixAt(i, dummy.matrix);
        });
        mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="#00F6FF" transparent opacity={0.6} />
        </instancedMesh>
    );
};

// --- Gameplay Elements ---

const Obstacle: React.FC<{ position: Vector3; type: 'block' | 'barrier' }> = ({ position, type }) => {
    const group = useRef<Group>(null);
    
    useFrame(() => {
        if (group.current) {
            group.current.position.copy(position);
        }
    });

    return (
        <group ref={group}>
            {type === 'block' ? (
                <mesh position={[0, 1, 0]}>
                    <boxGeometry args={[2.5, 2, 2.5]} />
                    <meshStandardMaterial color="#ff0055" emissive="#550011" emissiveIntensity={2} />
                    <lineSegments>
                        <edgesGeometry args={[new THREE.BoxGeometry(2.5, 2, 2.5)]} />
                        <lineBasicMaterial color="#ffaaaa" />
                    </lineSegments>
                </mesh>
            ) : (
                <group position={[0, 0.5, 0]}>
                    <mesh>
                        <cylinderGeometry args={[0.2, 0.2, 3, 8]} rotation={[0,0,Math.PI/2]} />
                        <meshStandardMaterial color="#FFFF00" emissive="#AA5500" />
                    </mesh>
                    <mesh position={[0, 0.5, 0]}>
                         <boxGeometry args={[3, 1, 0.2]} />
                         <meshStandardMaterial color="#222" transparent opacity={0.8} />
                         <mesh position={[0,0,0.11]}>
                             <planeGeometry args={[2.8, 0.8]} />
                             <meshBasicMaterial color="#FFFF00" /> 
                         </mesh>
                    </mesh>
                </group>
            )}
        </group>
    );
};

const Player = ({ config, targetLane, speed }: { config: CarConfig, targetLane: number, speed: number }) => {
    const group = useRef<Group>(null);
    const currentX = useRef(0);
    const tilt = useRef(0);

    useFrame((state, delta) => {
        if (!group.current) return;
        
        const targetX = LANES[targetLane + 1];
        
        currentX.current = MathUtils.lerp(currentX.current, targetX, delta * 10);
        
        const diff = targetX - currentX.current;
        tilt.current = MathUtils.lerp(tilt.current, diff * -0.5, delta * 5);

        group.current.position.x = currentX.current;
        group.current.rotation.z = tilt.current;
        
        group.current.position.y = Math.sin(state.clock.elapsedTime * 20) * 0.02;
    });

    return (
        <group ref={group}>
            <ThreeCar config={config} isRotating={false} tilt={0} />
            <pointLight position={[0, 0.5, -2]} color="#ff0000" intensity={2} distance={5} />
        </group>
    );
};

const GameController = ({ config, onGameOver, onExit }: any) => {
    const [gameState, setGameState] = useState<GameState>(GameState.PLAYING);
    const [lane, setLane] = useState(0); 
    
    const obstacles = useRef<{id: number, pos: Vector3, type: 'block'|'barrier'}[]>([]);
    const nextSpawnZ = useRef(-50);
    const scoreRef = useRef(0);
    const speedRef = useRef(GAME_SPEED_START);
    
    const scoreTextRef = useRef<any>(null);
    const speedTextRef = useRef<any>(null);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (gameState !== GameState.PLAYING) return;
            if (e.key === 'ArrowLeft') {
                setLane(l => Math.max(l - 1, -1));
            }
            if (e.key === 'ArrowRight') {
                setLane(l => Math.min(l + 1, 1));
            }
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [gameState]);

    useFrame((state, delta) => {
        if (gameState !== GameState.PLAYING) return;

        speedRef.current = Math.min(speedRef.current + ACCELERATION * delta, MAX_SPEED);
        const currentSpeed = speedRef.current;
        
        scoreRef.current += currentSpeed * delta;
        
        if (scoreTextRef.current) {
            scoreTextRef.current.text = Math.floor(scoreRef.current).toLocaleString();
        }
        if (speedTextRef.current) {
            speedTextRef.current.text = Math.floor(currentSpeed) + " KM/H";
        }

        const distanceMoved = currentSpeed * delta;
        
        nextSpawnZ.current += distanceMoved; 
        if (nextSpawnZ.current > 0) { 
            const zPos = -150 - Math.random() * 50;
            const lane1 = Math.floor(Math.random() * 3) - 1;
            const type1 = Math.random() > 0.5 ? 'block' : 'barrier';
            
            obstacles.current.push({
                id: Math.random(),
                pos: new Vector3(LANES[lane1 + 1], 0, zPos),
                type: type1
            });

            if (Math.random() > 0.5 && currentSpeed > 50) {
                 let lane2 = Math.floor(Math.random() * 3) - 1;
                 while(lane2 === lane1) lane2 = Math.floor(Math.random() * 3) - 1;
                 obstacles.current.push({
                    id: Math.random(),
                    pos: new Vector3(LANES[lane2 + 1], 0, zPos),
                    type: 'block'
                });
            }

            nextSpawnZ.current = -20 - (1000 / currentSpeed);
        }

        obstacles.current.forEach(obs => {
            obs.pos.z += distanceMoved;
        });

        const playerX = LANES[lane + 1];
        
        const collision = obstacles.current.find(obs => {
            return Math.abs(obs.pos.z) < 2 && Math.abs(obs.pos.x - playerX) < 1.0; 
        });

        if (collision) {
            setGameState(GameState.GAME_OVER);
            onGameOver(Math.floor(scoreRef.current));
        }

        obstacles.current = obstacles.current.filter(obs => obs.pos.z < 10);
    });

    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 6, 12]} rotation={[-0.2, 0, 0]} fov={60} />
            
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00F6FF" />
            <pointLight position={[-10, 10, 10]} intensity={1} color="#ff0055" />
            <fog attach="fog" args={['#030508', 20, 120]} />

            <RetroSun />
            <Stars radius={150} depth={50} count={1000} factor={6} saturation={0} fade speed={1} />
            <SpeedParticles speed={speedRef.current} />
            <MovingGrid speed={speedRef.current} />

            <Player config={config} targetLane={lane} speed={speedRef.current} />

            {obstacles.current.map(obs => (
                <Obstacle key={obs.id} position={obs.pos} type={obs.type} />
            ))}

            <group position={[0, 8, -15]}>
                <Text
                    ref={scoreTextRef}
                    color="white"
                    fontSize={1}
                    anchorX="center"
                    anchorY="middle"
                    outlineWidth={0.05}
                    outlineColor="#00F6FF"
                >
                    0
                </Text>
                <Text
                    ref={speedTextRef}
                    position={[0, -1.2, 0]}
                    color="#ff0055"
                    fontSize={0.5}
                    anchorX="center"
                    anchorY="middle"
                >
                    30 KM/H
                </Text>
            </group>
            
            {gameState === GameState.GAME_OVER && (
                 <Float speed={5} rotationIntensity={0.2} floatIntensity={0.2}>
                    <Text position={[0, 2, 5]} fontSize={2} color="#ff0000" outlineWidth={0.1} outlineColor="white">
                        CRASHED
                    </Text>
                 </Float>
            )}
        </>
    );
};

export const Game3D: React.FC<Game3DProps> = ({ config, onGameOver, onExit }) => {
  return (
    <div className="w-full h-full relative bg-black">
        <div className="absolute inset-0 pointer-events-none z-10 p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <div className="text-white font-display">
                    <h2 className="text-2xl font-bold text-nexa-accent">NEON RUNNER</h2>
                    <p className="text-sm opacity-70">AVOID OBSTACLES // SURVIVE</p>
                </div>
                <button 
                    onClick={onExit}
                    className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur-md px-4 py-2 rounded text-xs font-bold text-white transition-colors border border-white/10"
                >
                    ABORT
                </button>
            </div>
            
            <div className="text-center opacity-50">
                <p className="text-xs font-mono tracking-widest text-nexa-primary">USE ARROW KEYS TO STRAFE</p>
            </div>
        </div>

        <Canvas dpr={[1, 1.5]} performance={{ min: 0.5 }}>
            <GameController config={config} onGameOver={onGameOver} onExit={onExit} />
        </Canvas>
    </div>
  );
};
