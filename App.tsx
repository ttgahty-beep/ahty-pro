
import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  Stars,
  Float, 
  Sparkles,
  PerspectiveCamera
} from '@react-three/drei';
import { 
  Trophy, 
  Gamepad2, 
  User, 
  Settings, 
  ShoppingBag, 
  Zap, 
  Activity, 
  Calendar,
  LayoutDashboard,
  Cpu,
  CheckCircle,
  ShieldCheck,
  Camera,
  Hand,
  Lock,
  Unlock,
  Coins,
  ChevronLeft,
  ChevronRight,
  Scan,
  Crosshair,
  Play,
  MonitorPlay,
  Rotate3D
} from 'lucide-react';
import { BarChart, Bar, Tooltip, ResponsiveContainer } from 'recharts';
import { FilesetResolver, GestureRecognizer, DrawingUtils } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

import { AppView, CarConfig, UserProfile, NavItem, CarModel } from './types';
import { ThreeCar } from './components/ThreeCar';
import { Game3D } from './components/Game3D'; 
import { DriveMadGame } from './components/DriveMadGame';
import { getCrewChiefAdvice } from './services/ai';
import Hyperspeed from './components/ui/Hyperspeed';
import MagicBento, { BentoCardProps } from './components/MagicBento';

// --- Global AI Singleton to prevent re-initialization lag ---
let sharedRecognizer: GestureRecognizer | null = null;
let recognizerLoading = false;

// --- Immersive Background ---
const ImmersiveBackground = () => {
    return (
        <div className="fixed inset-0 z-0 pointer-events-none bg-[#030508]">
            <Canvas dpr={[1, 1.5]} gl={{ antialias: false }}>
                <fog attach="fog" args={['#030508', 5, 30]} />
                <ambientLight intensity={0.2} />
                <Stars radius={50} count={1000} factor={3} fade speed={1} />
                <Sparkles count={100} scale={15} size={2} speed={0.4} opacity={0.5} color="#7A3CFF" />
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]}>
                    <planeGeometry args={[100, 100]} />
                    <meshBasicMaterial color="#0B101B" transparent opacity={0.8} />
                    <gridHelper args={[100, 50, 0x00F6FF, 0x111111]} rotation={[-Math.PI/2, 0, 0]} />
                </mesh>
            </Canvas>
        </div>
    );
};

// --- Components ---

const NotificationToast = ({ message, visible, onClose }: { message: string, visible: boolean, onClose: () => void }) => {
    useEffect(() => {
        if (visible) {
            const timer = setTimeout(onClose, 4000);
            return () => clearTimeout(timer);
        }
    }, [visible, onClose]);

    return (
        <div className={`fixed top-24 right-6 z-[100] transition-all duration-500 transform ${visible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0 pointer-events-none'}`}>
            <div className="glass-pro border-l-4 border-nexa-success bg-nexa-panel/90 backdrop-blur-xl p-4 rounded-r-lg shadow-[0_0_20px_rgba(0,255,153,0.3)] flex items-center gap-4 min-w-[300px]">
                <div className="bg-nexa-success/20 p-2 rounded-full">
                    <CheckCircle className="text-nexa-success" size={24} />
                </div>
                <div>
                    <h4 className="text-white font-bold font-display tracking-wider text-sm">SYSTEM NOTIFICATION</h4>
                    <p className="text-nexa-text text-xs">{message}</p>
                </div>
            </div>
        </div>
    );
};

// --- Intro Sequence (Hyperspeed) ---
const IntroSequence = ({ onComplete }: { onComplete: () => void }) => {
    const introCarConfig: CarConfig = useMemo(() => ({
        model: 'SPEEDSTER',
        color: '#0B101B',
        rimColor: '#00F6FF',
        spoiler: true,
        neon: true,
        texture: 'metallic'
    }), []);

    const hyperspeedOptions = useMemo(() => ({
        colors: {
            roadColor: 0x080808,
            islandColor: 0x0a0a0a,
            background: 0x000000,
            shoulderLines: 0xffffff,
            brokenLines: 0xffffff,
            leftCars: [0x7A3CFF, 0x9D46FF, 0xC247AC], 
            rightCars: [0x00F6FF, 0x0E5EA5, 0x324555], 
            sticks: 0x00F6FF
        },
        onSpeedUp: () => { },
        onSlowDown: () => { },
        distortion: 'turbulentDistortion',
        length: 400,
        roadWidth: 9,
        islandWidth: 2,
        lanesPerRoad: 3,
        fov: 90,
        fovSpeedUp: 150,
        speedUp: 2,
        carLightsFade: 0.4,
        totalSideLightSticks: 50,
        lightPairsPerRoadWay: 50,
        shoulderLinesWidthPercentage: 0.05,
        brokenLinesWidthPercentage: 0.1,
        brokenLinesLengthPercentage: 0.5,
        lightStickWidth: [0.02, 0.05],
        lightStickHeight: [1.3, 1.7],
        movingAwaySpeed: [20, 50],
        movingCloserSpeed: [-120, -160],
        carLightsLength: [400 * 0.05, 400 * 0.15],
        carLightsRadius: [0.05, 0.14],
        carWidthPercentage: [0.3, 0.5],
        carShiftX: [-0.2, 0.2],
        carFloorSeparation: [0.05, 1],
        isHyper: true
    }), []);

    return (
        <div className="fixed inset-0 z-[100] bg-black">
            {/* Full Screen Hyperspeed */}
            <div className="absolute inset-0 w-full h-full">
                <Hyperspeed effectOptions={hyperspeedOptions}>
                     <Float speed={5} rotationIntensity={0.2} floatIntensity={0.5}>
                        <group position={[0, -0.5, 0]} rotation={[0, Math.PI, 0]}>
                            <ThreeCar config={introCarConfig} isRotating={false} />
                        </group>
                     </Float>
                </Hyperspeed>
            </div>

            {/* UI Overlay */}
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none">
                <div className="mb-8 animate-fade-in-down pointer-events-auto">
                    <div className="flex items-center gap-2 px-6 py-3 bg-black/60 backdrop-blur-md border border-nexa-accent/30 rounded-full text-sm shadow-[0_0_20px_rgba(0,246,255,0.2)]">
                        <span className="text-yellow-300">⚡</span>
                        <span className="text-nexa-accent font-mono tracking-widest">PROJECT BY AHTESHAM & SALMAN</span>
                    </div>
                </div>

                <div className="text-center space-y-6 max-w-5xl mx-auto px-4">
                    <div className="space-y-2">
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold bg-gradient-to-r from-nexa-accent via-white to-nexa-primary bg-clip-text text-transparent animate-fade-in-up animation-delay-200 drop-shadow-[0_0_30px_rgba(0,246,255,0.5)]">
                            NEXA
                        </h1>
                        <h1 className="text-6xl md:text-8xl lg:text-9xl font-display font-bold bg-gradient-to-r from-nexa-primary via-purple-400 to-pink-500 bg-clip-text text-transparent animate-fade-in-up animation-delay-400 drop-shadow-[0_0_30px_rgba(122,60,255,0.5)]">
                            ARENA
                        </h1>
                    </div>
                    
                    <div className="max-w-3xl mx-auto animate-fade-in-up animation-delay-600">
                        <p className="text-lg md:text-xl lg:text-2xl text-nexa-text font-light leading-relaxed text-glow">
                            Hyper-Immersive 3D Racing Experience.
                        </p>
                    </div>
                    
                    <div className="flex justify-center mt-12 animate-fade-in-up animation-delay-800 pointer-events-auto">
                        <button 
                            onClick={onComplete}
                            className="group relative px-12 py-5 bg-transparent overflow-hidden rounded-full transition-all hover:scale-105"
                        >
                            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-nexa-primary to-nexa-accent opacity-80 group-hover:opacity-100 transition-opacity"></div>
                            <div className="absolute inset-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                            <span className="relative z-10 font-bold text-xl text-black tracking-[0.2em] group-hover:tracking-[0.3em] transition-all flex items-center gap-2">
                                ENTER SYSTEM <ChevronRight size={20} />
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Auth View ---
const AuthView = ({ onRegister }: { onRegister: (name: string) => void }) => {
    const [loading, setLoading] = useState(false);
    const [username, setUsername] = useState("Commander_One");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            onRegister(username);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
             <div className="glass-pro p-8 md:p-12 rounded-3xl w-full max-w-md border border-nexa-primary/30 relative overflow-hidden animate-fade-in-up">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nexa-accent to-transparent"></div>
                
                <div className="text-center mb-8">
                    <ShieldCheck size={48} className="mx-auto text-nexa-accent mb-4" />
                    <h2 className="text-3xl font-display font-bold text-white tracking-wide">IDENTITY VERIFICATION</h2>
                    <p className="text-nexa-muted text-sm mt-2">Secure entry to the Nexus Grid.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2 text-left">
                        <label className="text-xs font-bold text-nexa-primary tracking-widest flex items-center gap-2">
                            <User size={12}/> USERNAME
                        </label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-nexa-accent focus:outline-none focus:shadow-[0_0_15px_rgba(0,246,255,0.3)] transition-all font-mono"
                            required
                        />
                    </div>
                    
                    <button 
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-nexa-primary text-white font-bold tracking-widest rounded-lg hover:bg-white hover:text-black transition-all flex justify-center items-center gap-2 group"
                    >
                        {loading ? <span className="animate-pulse">PROCESSING...</span> : 'INITIALIZE REGISTRATION'}
                    </button>
                </form>
             </div>
        </div>
    );
};

// --- Navigation ---
const Navigation = ({ active, onChange, profile }: { active: AppView, onChange: (v: AppView) => void, profile: UserProfile }) => {
    const modules: NavItem[] = [
        { id: AppView.DASHBOARD, label: 'DASHBOARD', icon: LayoutDashboard },
        { id: AppView.GAME, label: 'ARENA', icon: Gamepad2 },
        { id: AppView.ARCADE, label: 'ARCADE', icon: MonitorPlay },
        { id: AppView.GARAGE, label: 'GARAGE', icon: Settings },
        { id: AppView.LEADERBOARD, label: 'RANKING', icon: Zap },
        { id: AppView.MARKET, label: 'MARKET', icon: ShoppingBag },
        { id: AppView.TROPHY_ROOM, label: 'TROPHIES', icon: Trophy },
        { id: AppView.EVENTS, label: 'EVENTS', icon: Calendar },
        { id: AppView.AI_CHIEF, label: 'CREW CHIEF', icon: Cpu },
    ];

    return (
        <nav className="fixed top-0 left-0 w-full z-40 glass-pro border-b border-white/5 backdrop-blur-md">
            <div className="max-w-[1800px] mx-auto px-6">
                <div className="flex items-center justify-between h-20">
                    <div className="flex items-center gap-3 group cursor-pointer" onClick={() => onChange(AppView.DASHBOARD)}>
                         <div className="w-10 h-10 bg-nexa-primary rotate-45 flex items-center justify-center group-hover:rotate-90 transition-transform duration-500 shadow-[0_0_15px_#7A3CFF]">
                             <span className="text-white font-display font-bold -rotate-45 text-xl">N</span>
                         </div>
                         <div className="hidden md:block">
                             <h1 className="text-2xl font-display font-bold tracking-widest text-white">NEXA <span className="text-nexa-accent">ARENA</span></h1>
                             <p className="text-[0.6rem] text-nexa-muted tracking-[0.3em] uppercase">By Ahtesham & Salman</p>
                         </div>
                    </div>

                    <div className="hidden xl:flex items-center gap-1">
                        {modules.map((mod) => (
                            <button
                                key={mod.id}
                                onClick={() => onChange(mod.id)}
                                className={`px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold tracking-wider transition-all duration-300 border border-transparent
                                    ${active === mod.id 
                                        ? 'bg-nexa-primary/20 text-white border-nexa-primary/50 shadow-[0_0_15px_rgba(122,60,255,0.2)]' 
                                        : 'text-nexa-muted hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <mod.icon size={14} />
                                {mod.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 border-l border-white/10 pl-6">
                        <div className="text-right hidden sm:block">
                            <div className="text-white font-bold text-sm">{profile.name}</div>
                            <div className="text-nexa-accent text-xs font-mono">{profile.credits.toLocaleString()} CR</div>
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-nexa-accent p-0.5 relative">
                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full rounded-full bg-nexa-panel" />
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="xl:hidden flex overflow-x-auto gap-2 p-2 border-t border-white/5 custom-scroll bg-nexa-bg">
                 {modules.map((mod) => (
                    <button
                        key={mod.id}
                        onClick={() => onChange(mod.id)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-bold whitespace-nowrap
                            ${active === mod.id ? 'bg-nexa-primary text-white' : 'text-nexa-muted bg-white/5'}`}
                    >
                        <mod.icon size={14} />
                        {mod.label}
                    </button>
                ))}
            </div>
        </nav>
    );
};

// --- Functional Modules ---

// 1. Dashboard View
const DashboardView = ({ profile, onAction, carConfig }: any) => {
    const bentoCards: BentoCardProps[] = [
        { title: "LEADERBOARD", description: "Global Elite Rankings", label: "COMPETE", icon: <Zap size={24}/>, onClick: () => onAction(AppView.LEADERBOARD) },
        { title: "BLACK MARKET", description: "Acquire New Parts", label: "SHOP", icon: <ShoppingBag size={24}/>, onClick: () => onAction(AppView.MARKET) },
        { title: "EVENTS", description: "Cyber Cup 2077", label: "RACE", icon: <Calendar size={24}/>, onClick: () => onAction(AppView.EVENTS) },
        { title: "CREW CHIEF", description: "AI Strategy", label: "ANALYZE", icon: <Cpu size={24}/>, onClick: () => onAction(AppView.AI_CHIEF) },
        { title: "NEXA INTERCEPTOR", description: "2D Arcade Shooter", label: "PLAY", icon: <MonitorPlay size={24}/>, onClick: () => onAction(AppView.ARCADE) },
        { title: "TROPHIES", description: "Achievements", label: "COLLECT", icon: <Trophy size={24}/>, onClick: () => onAction(AppView.TROPHY_ROOM) },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 md:p-12 pt-32 max-w-[1600px] mx-auto animate-fade-in-up">
            <div className="col-span-1 md:col-span-8 min-h-[500px] glass-pro rounded-3xl relative overflow-hidden group border border-nexa-primary/30 flex flex-col justify-center px-12">
                <div className="absolute inset-0 bg-gradient-to-r from-nexa-bg via-nexa-bg/50 to-transparent z-10"></div>
                <div className="relative z-20 max-w-xl">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="px-3 py-1 bg-nexa-success/20 text-nexa-success text-xs font-bold rounded border border-nexa-success/50 animate-pulse">LIVE SEASON</span>
                        <span className="px-3 py-1 bg-white/10 text-white text-xs font-bold rounded">V 2.0</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-display font-black text-white italic mb-6 leading-tight drop-shadow-2xl">
                        NEON <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-nexa-accent to-nexa-primary">OVERDRIVE</span>
                    </h1>
                    <p className="text-nexa-text/80 text-lg mb-8 font-light max-w-md border-l-2 border-nexa-accent pl-4">
                        The grid is online. Your machine awaits. Join the global Cyber Cup 2077 and dominate the leaderboards.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <button onClick={() => onAction(AppView.GAME)} className="px-8 py-3 bg-nexa-primary text-white font-bold rounded hover:bg-white hover:text-black transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(122,60,255,0.4)]">
                            <Play size={20} fill="currentColor" /> DEPLOY TO ARENA
                        </button>
                        <button onClick={() => onAction(AppView.GARAGE)} className="px-8 py-3 glass-pro text-white font-bold rounded hover:bg-white/10 transition-all border border-white/20">
                            MODULATE VEHICLE
                        </button>
                    </div>
                </div>
                <div className="absolute -right-20 top-0 bottom-0 w-3/4 z-0">
                    <Canvas dpr={[1, 1.5]} performance={{min: 0.5}}>
                        <ambientLight intensity={0.5} />
                        <spotLight position={[10, 10, 10]} intensity={2} color="#00F6FF" />
                        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                             <group rotation={[0, -0.6, 0]} scale={1.6}>
                                 <ThreeCar config={carConfig} />
                             </group>
                        </Float>
                    </Canvas>
                </div>
            </div>

            <div className="col-span-1 md:col-span-4 flex flex-col gap-6">
                <div className="glass-pro rounded-3xl p-6 relative overflow-hidden flex-1 border border-white/5">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-nexa-accent"><Trophy size={140}/></div>
                    <div className="flex items-center justify-between mb-4">
                         <h3 className="text-nexa-muted text-sm font-bold tracking-widest">CURRENT STANDING</h3>
                         <div className="p-2 bg-white/5 rounded-full"><Zap size={16} className="text-yellow-500"/></div>
                    </div>
                    <div className="text-5xl font-display font-bold text-white mb-1">{profile.rank}</div>
                    <div className="text-sm text-nexa-accent font-bold mb-6">TOP 5% GLOBAL</div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-nexa-text font-mono">
                            <span>PROGRESS</span>
                            <span>75%</span>
                        </div>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-nexa-primary w-[75%] shadow-[0_0_10px_#7A3CFF]"></div>
                        </div>
                    </div>
                </div>

                <div className="glass-pro rounded-3xl p-6 h-[240px] flex flex-col border border-white/5">
                     <h3 className="text-nexa-muted text-sm font-bold tracking-widest mb-4 flex items-center gap-2"><Activity size={16}/> PERFORMANCE LOG</h3>
                     <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[
                                {name: 'M', val: 40}, {name: 'T', val: 65}, {name: 'W', val: 35}, {name: 'T', val: 80}, {name: 'F', val: 55}, {name: 'S', val: 90}, {name: 'S', val: 45}
                            ]}>
                                <Tooltip contentStyle={{background: '#0B101B', border: '1px solid #333'}} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                                <Bar dataKey="val" fill="#00F6FF" radius={[4,4,0,0]} />
                            </BarChart>
                        </ResponsiveContainer>
                     </div>
                </div>
            </div>

            <div className="col-span-1 md:col-span-12">
                 <MagicBento cards={bentoCards} />
            </div>
        </div>
    );
};

// --- DEDICATED 3D SCENE FOR GARAGE TO AVOID REACT RENDER LOOP ---
// Fixed logic to normalize rotation and prevent "spin of death" or unstable behavior
// Added robust NaN checks and delta capping to prevent disappearing meshes
const Garage3DScene = ({ config, gestureRef, gestureActive }: { config: CarConfig, gestureRef: React.MutableRefObject<any>, gestureActive: boolean }) => {
    const groupRef = useRef<THREE.Group>(null);

    // Robust angle difference function
    const angleDifference = (a: number, b: number) => {
        let diff = (b - a) % (2 * Math.PI);
        if (diff < -Math.PI) diff += 2 * Math.PI;
        if (diff > Math.PI) diff -= 2 * Math.PI;
        return diff;
    };

    useFrame((state, delta) => {
        if (!groupRef.current) return;

        // CRITICAL FIX: Cap delta time to prevent physics explosions on frame drops (e.g. switching tabs)
        const dt = Math.min(delta, 0.1);

        let targetRot = groupRef.current.rotation.y;
        let targetScale = 1.2;

        if (gestureActive && gestureRef.current) {
            // Read from Ref
            const rawRot = gestureRef.current.rotation;
            const rawZoom = gestureRef.current.zoom;

            // Validate inputs to prevent NaN propagation which causes vanishing
            if (!isNaN(rawRot) && isFinite(rawRot)) targetRot = rawRot;
            // Clamp zoom to safe values to avoid clipping camera
            if (!isNaN(rawZoom) && isFinite(rawZoom)) targetScale = Math.max(0.6, Math.min(1.8, rawZoom));
            
            // Shortest Path Rotation Logic
            const current = groupRef.current.rotation.y;
            const diff = angleDifference(current, targetRot);
            
            // Smooth Damp
            groupRef.current.rotation.y += diff * dt * 5;
            
            // Smooth Zoom
            const currentScale = groupRef.current.scale.x;
            const newScale = THREE.MathUtils.lerp(currentScale, targetScale, dt * 5);
            
            // Safety check before applying scale
            if (!isNaN(newScale) && isFinite(newScale) && newScale > 0.1) {
                groupRef.current.scale.set(newScale, newScale, newScale);
            }
            
        } else {
            // Idle Mode
            groupRef.current.rotation.y += dt * 0.5;
            // Normalize for long running consistency
            groupRef.current.rotation.y = groupRef.current.rotation.y % (Math.PI * 2);

            const currentScale = groupRef.current.scale.x;
            const newScale = THREE.MathUtils.lerp(currentScale, 1.2, dt * 2);
            groupRef.current.scale.set(newScale, newScale, newScale);
        }
    });

    return (
        <group ref={groupRef}>
             <ThreeCar config={config} isRotating={false} />
        </group>
    );
};


// 2. Garage View with Advanced Gesture Control (MediaPipe)
const GarageView = ({ config, setConfig }: any) => {
    const [gestureActive, setGestureActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [recognizerReady, setRecognizerReady] = useState(false);
    
    // PERFORMANCE FIX: Use Ref for gesture data instead of State to avoid Re-renders loops
    const gestureData = useRef({ rotation: 0, zoom: 1.2 });
    const [statusText, setStatusText] = useState("AI SYSTEM OFFLINE");

    const models: CarModel[] = ['SPEEDSTER', 'TITAN', 'SPECTRE', 'VANGUARD'];
    const currentModelIdx = models.indexOf(config.model);

    // Init MediaPipe ONLY ONCE globally
    useEffect(() => {
        const init = async () => {
            if (sharedRecognizer) {
                setRecognizerReady(true);
                setStatusText("AI READY. ACTIVATE SENSOR.");
                return;
            }
            
            if (recognizerLoading) return; // Prevent double load
            recognizerLoading = true;
            setStatusText("INITIALIZING NEURAL LINK...");

            try {
                // Use JsDelivr for WASM
                const vision = await FilesetResolver.forVisionTasks(
                    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.12/wasm"
                );
                sharedRecognizer = await GestureRecognizer.createFromOptions(vision, {
                    baseOptions: {
                        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                        delegate: "GPU"
                    },
                    runningMode: "VIDEO",
                    numHands: 1
                });
                setRecognizerReady(true);
                setStatusText("AI READY. ACTIVATE SENSOR.");
            } catch (error) {
                console.error("Failed to load MediaPipe:", error);
                setStatusText("AI LOAD FAILED");
            } finally {
                recognizerLoading = false;
            }
        };

        init();
    }, []);

    // Loop
    useEffect(() => {
        if (!gestureActive || !sharedRecognizer || !recognizerReady || !videoRef.current || !canvasRef.current) return;
        
        let animationFrame: number;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const drawingUtils = new DrawingUtils(ctx!);

        const startWebcam = async () => {
             try {
                 const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
                 video.srcObject = stream;
                 await video.play();
                 predict();
             } catch(e) {
                 console.error(e);
                 setStatusText("CAMERA BLOCKED");
             }
        };

        let lastVideoTime = -1;
        let thumbUpFrames = 0;
        let lastStatusUpdate = 0;

        const predict = () => {
             if (video.currentTime !== lastVideoTime) {
                 lastVideoTime = video.currentTime;
                 const results = sharedRecognizer!.recognizeForVideo(video, Date.now());

                 ctx!.clearRect(0, 0, canvas.width, canvas.height);

                 if (results.landmarks && results.landmarks.length > 0) {
                     const hand = results.landmarks[0];
                     
                     // Draw Skeleton
                     drawingUtils.drawConnectors(hand, GestureRecognizer.HAND_CONNECTIONS, { color: "#00F6FF", lineWidth: 2 });
                     drawingUtils.drawLandmarks(hand, { color: "#FF3366", lineWidth: 1, radius: 2 });

                     // Logic
                     const gesture = results.gestures.length > 0 ? results.gestures[0][0].categoryName : "None";
                     const wrist = hand[0]; // Wrist landmark
                     
                     // X Control (Rotation) - Map 0.0-1.0 to -PI to PI
                     // Mirror X because webcam is mirrored usually
                     const x = 1.0 - wrist.x; 
                     const targetRot = (x - 0.5) * Math.PI * 2; // Full 360 range roughly

                     // Y Control (Zoom) - Map 0.0-1.0 to 0.8 to 1.8 (Safe range)
                     const y = wrist.y;
                     const targetZoom = 0.8 + (y * 1.0);
                     // Clamp zoom just in case
                     const clampedZoom = Math.max(0.5, Math.min(2.0, targetZoom));

                     // PERFORMANCE FIX: Update Ref, NOT State
                     if (gesture === "Closed_Fist") {
                         // Direct Control
                         gestureData.current.rotation = targetRot;
                         gestureData.current.zoom = clampedZoom;
                         
                         if(Date.now() - lastStatusUpdate > 500) {
                             setStatusText("GRIPPED: ROTATING");
                             lastStatusUpdate = Date.now();
                         }
                     } else if (gesture === "Thumb_Up") {
                         thumbUpFrames++;
                         if (thumbUpFrames === 30) { // Hold for ~0.5s to switch
                             cycleModel(1);
                             thumbUpFrames = 0; // Reset
                         }
                         if(Date.now() - lastStatusUpdate > 500) {
                             setStatusText("SWITCHING MODEL...");
                             lastStatusUpdate = Date.now();
                         }
                     } else {
                         thumbUpFrames = 0;
                         if(Date.now() - lastStatusUpdate > 1000) {
                             setStatusText("HAND DETECTED - FIST TO GRAB");
                             lastStatusUpdate = Date.now();
                         }
                     }

                 } else {
                     if(Date.now() - lastStatusUpdate > 1000) {
                         setStatusText("NO HAND DETECTED");
                         lastStatusUpdate = Date.now();
                     }
                 }
             }
             animationFrame = requestAnimationFrame(predict);
        };

        startWebcam();

        return () => {
            if (video.srcObject) {
                 (video.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            }
            cancelAnimationFrame(animationFrame);
        };
    }, [gestureActive, recognizerReady, config]);


    const cycleModel = (dir: number) => {
        const nextIdx = (currentModelIdx + dir + models.length) % models.length;
        setConfig({ ...config, model: models[nextIdx] });
    };

    return (
        <div className="h-screen w-full pt-20 flex flex-col md:flex-row relative z-10">
            {/* Left Panel */}
            <div className="w-full md:w-1/3 h-full glass-pro border-r border-white/10 p-8 overflow-y-auto z-20 bg-nexa-panel/90 backdrop-blur-xl custom-scroll">
                <h2 className="text-3xl font-display font-black text-white mb-2">MOD SHOP</h2>
                <p className="text-nexa-muted text-sm mb-8">Customize your machine.</p>

                {/* Gesture Control Panel */}
                <div className="mb-8 p-1 border border-nexa-accent/30 rounded-xl bg-nexa-accent/5">
                    <div className="flex items-center justify-between p-3">
                        <h3 className="font-bold text-nexa-accent flex items-center gap-2"><Camera size={18}/> MINDPIPE AI</h3>
                        <button 
                            onClick={() => setGestureActive(!gestureActive)}
                            disabled={!recognizerReady}
                            className={`px-3 py-1 rounded text-xs font-bold transition-all ${gestureActive ? 'bg-nexa-accent text-black shadow-[0_0_10px_#00F6FF]' : 'bg-white/10 text-white'} ${!recognizerReady && 'opacity-50 cursor-not-allowed'}`}
                        >
                            {gestureActive ? 'ACTIVE' : (recognizerReady ? 'ACTIVATE' : 'LOADING...')}
                        </button>
                    </div>
                    
                    <div className="relative rounded-lg overflow-hidden border border-white/20 aspect-video mb-2 bg-black">
                         {gestureActive ? (
                            <>
                                <video ref={videoRef} className="hidden" playsInline muted></video>
                                <canvas ref={canvasRef} width={320} height={240} className="w-full h-full object-cover scale-x-[-1]"></canvas>
                                
                                {/* Overlay HUD */}
                                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-2">
                                     <div className="flex justify-between text-[8px] font-mono text-nexa-accent">
                                         <span>CAM_FEED: 320x240</span>
                                         <span>FPS: 60</span>
                                     </div>
                                     <div className="flex items-center justify-center">
                                         <Crosshair size={24} className="text-white/20" />
                                     </div>
                                     <div className="text-center">
                                         <span className="bg-black/50 text-nexa-success text-[10px] font-bold px-2 py-1 rounded border border-nexa-success/30">
                                            {statusText}
                                         </span>
                                     </div>
                                </div>
                            </>
                         ) : (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                 <div className="text-center">
                                     <Scan size={32} className={`mx-auto mb-2 ${recognizerReady ? 'text-nexa-accent' : 'text-nexa-muted animate-pulse'}`}/>
                                     <p className="text-[10px] text-nexa-muted font-mono">{recognizerReady ? 'SYSTEM READY' : 'DOWNLOADING MODEL...'}</p>
                                 </div>
                             </div>
                         )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[9px] text-nexa-text/60 px-2 pb-2 font-mono">
                        <div className="flex items-center gap-1"><Hand size={10}/> <span>CLOSED FIST: GRAB/ROTATE</span></div>
                        <div className="flex items-center gap-1"><Rotate3D size={10}/> <span>MOVE L/R: ROTATE CAR</span></div>
                        <div className="flex items-center gap-1"><Camera size={10}/> <span>MOVE U/D: ZOOM CAM</span></div>
                        <div className="flex items-center gap-1"><span className="text-nexa-accent">👍</span> <span>THUMB UP: CHANGE CAR</span></div>
                    </div>
                </div>

                {/* Model Selector */}
                <div className="mb-8">
                    <label className="text-xs font-bold text-nexa-accent tracking-widest block mb-3">CHASSIS MODEL</label>
                    <div className="flex items-center justify-between glass-pro p-2 rounded-lg border border-white/10">
                        <button onClick={() => cycleModel(-1)} className="p-2 hover:bg-white/10 rounded"><ChevronLeft size={20}/></button>
                        <div className="text-center">
                            <div className="font-display font-bold text-xl text-white">{config.model}</div>
                            <div className="text-[10px] text-nexa-muted tracking-widest">CLASS: {config.model === 'TITAN' ? 'HEAVY' : config.model === 'SPECTRE' ? 'AGILE' : 'BALANCED'}</div>
                        </div>
                        <button onClick={() => cycleModel(1)} className="p-2 hover:bg-white/10 rounded"><ChevronRight size={20}/></button>
                    </div>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-nexa-accent tracking-widest block mb-2">PAINT</label>
                        <div className="flex flex-wrap gap-2">
                            {['#0B101B', '#E0E6ED', '#FF3366', '#00F6FF', '#7A3CFF', '#FFFF00'].map(c => (
                                <button key={c} onClick={() => setConfig({...config, color: c})} className="w-8 h-8 rounded border border-white/20 transition-transform hover:scale-110" style={{backgroundColor: c}}/>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-nexa-accent tracking-widest block mb-2">RIMS</label>
                        <div className="flex flex-wrap gap-2">
                            {['#E0E6ED', '#00F6FF', '#7A3CFF', '#FF3366'].map(c => (
                                <button key={c} onClick={() => setConfig({...config, rimColor: c})} className="w-8 h-8 rounded-full border-2 border-white/20 transition-transform hover:scale-110" style={{borderColor: c}}/>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setConfig({...config, spoiler: !config.spoiler})} className={`flex-1 py-3 rounded border font-bold text-xs tracking-wider transition-colors ${config.spoiler ? 'bg-nexa-primary border-nexa-primary' : 'border-white/20 hover:bg-white/5'}`}>SPOILER</button>
                        <button onClick={() => setConfig({...config, neon: !config.neon})} className={`flex-1 py-3 rounded border font-bold text-xs tracking-wider transition-colors ${config.neon ? 'bg-nexa-accent border-nexa-accent text-black' : 'border-white/20 hover:bg-white/5'}`}>NEON</button>
                    </div>
                </div>
            </div>

            {/* 3D Preview */}
            <div className="flex-1 relative bg-gradient-to-br from-nexa-bg to-nexa-panel overflow-hidden">
                 {/* Background Grid Elements */}
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(0,246,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,246,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>

                 <Canvas dpr={[1, 1.5]}>
                     <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
                     <Environment preset="city" />
                     <ambientLight intensity={0.5} />
                     <spotLight position={[10, 10, 10]} intensity={1} castShadow />
                     
                     {/* OPTIMIZED SCENE: Pass refs, not state */}
                     <Garage3DScene config={config} gestureRef={gestureData} gestureActive={gestureActive} />

                     <OrbitControls enablePan={false} enabled={!gestureActive} minDistance={3} maxDistance={10} />
                     <gridHelper args={[20, 20, 0x444444, 0x111111]} position={[0, -1, 0]} />
                 </Canvas>
            </div>
        </div>
    );
};

// 3. Leaderboard
const LeaderboardView = () => (
    <div className="pt-32 px-6 md:px-20 max-w-5xl mx-auto h-screen animate-fade-in-up">
        <h1 className="text-4xl font-display font-bold text-white mb-8 flex items-center gap-4"><Zap className="text-yellow-500"/> GLOBAL LEADERBOARD</h1>
        <div className="glass-pro rounded-2xl overflow-hidden">
            <table className="w-full text-left">
                <thead className="bg-white/5 text-nexa-accent text-xs font-bold tracking-widest">
                    <tr>
                        <th className="p-4">RANK</th>
                        <th className="p-4">PILOT</th>
                        <th className="p-4">TEAM</th>
                        <th className="p-4 text-right">SCORE</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm">
                    {[
                        {rank: 1, name: "CyberDrift_99", team: "RedLine", score: 98450},
                        {rank: 2, name: "Ahtesham_Pro", team: "NEXA", score: 95200},
                        {rank: 3, name: "Salman_Speed", team: "NEXA", score: 94100},
                        {rank: 4, name: "Ghost_Rider", team: "Void", score: 88000},
                        {rank: 5, name: "Neon_Viper", team: "Cobra", score: 82500},
                    ].map((p) => (
                        <tr key={p.rank} className="hover:bg-white/5 transition-colors">
                            <td className="p-4 font-mono text-white/50">#{p.rank}</td>
                            <td className="p-4 font-bold text-white">{p.name}</td>
                            <td className="p-4 text-nexa-text">{p.team}</td>
                            <td className="p-4 text-right font-mono text-nexa-success">{p.score.toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// 4. Market
const MarketView = ({ credits, setCredits }: any) => {
    const items = [
        { id: 1, name: "Turbo Chip V2", price: 2000, icon: Cpu },
        { id: 2, name: "Gold Rims", price: 1500, icon: CircleIcon },
        { id: 3, name: "Stealth Paint", price: 3000, icon: User }, // Placeholder icon
        { id: 4, name: "Nitrous Kit", price: 5000, icon: Zap },
    ];

    const buy = (price: number) => {
        if(credits >= price) setCredits(credits - price);
    };

    return (
        <div className="pt-32 px-6 md:px-20 max-w-6xl mx-auto h-screen animate-fade-in-up">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-display font-bold text-white flex items-center gap-4"><ShoppingBag className="text-nexa-success"/> BLACK MARKET</h1>
                <div className="glass-pro px-6 py-2 rounded-full flex items-center gap-2 text-nexa-success font-mono font-bold">
                    <Coins size={16}/> {credits.toLocaleString()} CR
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {items.map(item => (
                    <div key={item.id} className="glass-pro p-6 rounded-2xl border border-white/5 hover:border-nexa-success/50 transition-all group">
                        <div className="h-32 bg-black/40 rounded-xl mb-4 flex items-center justify-center">
                            <item.icon size={48} className="text-white/20 group-hover:text-nexa-success transition-colors"/>
                        </div>
                        <h3 className="font-bold text-white text-lg">{item.name}</h3>
                        <p className="text-nexa-success font-mono mb-4">{item.price} CR</p>
                        <button 
                            onClick={() => buy(item.price)}
                            disabled={credits < item.price}
                            className={`w-full py-2 rounded font-bold text-sm ${credits >= item.price ? 'bg-nexa-success text-black hover:bg-white' : 'bg-white/10 text-white/30 cursor-not-allowed'}`}
                        >
                            {credits >= item.price ? 'PURCHASE' : 'INSUFFICIENT FUNDS'}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
const CircleIcon = (props: any) => <div className="w-6 h-6 rounded-full border-2 border-current" {...props}></div>;


// 5. Events
const EventsView = () => (
    <div className="pt-32 px-6 md:px-20 max-w-4xl mx-auto h-screen animate-fade-in-up">
        <h1 className="text-4xl font-display font-bold text-white mb-8 flex items-center gap-4"><Calendar className="text-nexa-warning"/> TOURNAMENT SCHEDULE</h1>
        <div className="space-y-4">
            {[
                { name: "Cyber Cup 2077", date: "TODAY, 20:00 EST", status: "OPEN", prize: "50,000 CR" },
                { name: "Neon Drift Series", date: "TOMORROW, 18:00 EST", status: "LOCKED", prize: "25,000 CR" },
                { name: "Void Sprint", date: "WEEKEND EVENT", status: "LOCKED", prize: "100,000 CR" },
            ].map((evt, i) => (
                <div key={i} className="glass-pro p-6 rounded-xl flex items-center justify-between border-l-4 border-nexa-warning">
                    <div>
                        <h3 className="text-xl font-bold text-white">{evt.name}</h3>
                        <p className="text-nexa-muted text-sm flex items-center gap-2"><Calendar size={12}/> {evt.date}</p>
                    </div>
                    <div className="text-right">
                        <div className="text-nexa-warning font-mono font-bold">{evt.prize}</div>
                        <button className={`mt-2 px-4 py-1 rounded text-xs font-bold ${evt.status === 'OPEN' ? 'bg-nexa-warning text-black animate-pulse' : 'bg-white/10 text-white/50'}`}>
                            {evt.status === 'OPEN' ? 'REGISTER NOW' : 'LOCKED'}
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// 6. Trophy Room
const TrophyView = () => (
    <div className="pt-32 px-6 md:px-20 max-w-5xl mx-auto h-screen animate-fade-in-up">
        <h1 className="text-4xl font-display font-bold text-white mb-8 flex items-center gap-4"><Trophy className="text-purple-500"/> ACHIEVEMENTS</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
                { name: "First Blood", desc: "Win your first race", unlocked: true },
                { name: "Speed Demon", desc: "Reach 300 KM/H", unlocked: true },
                { name: "Big Spender", desc: "Spend 10,000 CR", unlocked: false },
                { name: "Untouchable", desc: "Win without crashing", unlocked: false },
            ].map((t, i) => (
                <div key={i} className={`glass-pro p-6 rounded-2xl border ${t.unlocked ? 'border-purple-500/50' : 'border-white/5 opacity-50'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${t.unlocked ? 'bg-purple-500/20 text-purple-500' : 'bg-white/5 text-white/20'}`}>
                        {t.unlocked ? <Unlock size={32}/> : <Lock size={32}/>}
                    </div>
                    <h3 className="font-bold text-white">{t.name}</h3>
                    <p className="text-xs text-nexa-muted mt-2">{t.desc}</p>
                </div>
            ))}
        </div>
    </div>
);

// 7. AI Crew Chief
const AiChiefView = () => {
    const [msgs, setMsgs] = useState([{role: 'ai', text: "Systems online. I am NEXA, your crew chief. Ready for strategy analysis."}]);
    const [input, setInput] = useState("");

    const send = async () => {
        if(!input) return;
        const newMsgs = [...msgs, {role: 'user', text: input}];
        setMsgs(newMsgs);
        setInput("");
        const response = await getCrewChiefAdvice(input, {speed: 0, score: 0});
        setMsgs([...newMsgs, {role: 'ai', text: response}]);
    };

    return (
        <div className="pt-32 px-6 md:px-20 max-w-4xl mx-auto h-screen animate-fade-in-up flex flex-col pb-10">
            <h1 className="text-4xl font-display font-bold text-white mb-8 flex items-center gap-4"><Cpu className="text-nexa-primary"/> AI CREW CHIEF</h1>
            <div className="flex-1 glass-pro rounded-2xl p-6 overflow-y-auto space-y-4 mb-4 border border-nexa-primary/30">
                {msgs.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-4 rounded-xl ${m.role === 'user' ? 'bg-nexa-primary text-white' : 'bg-white/10 text-nexa-text border border-white/10'}`}>
                            <p className="text-sm">{m.text}</p>
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-4">
                <input 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && send()}
                    className="flex-1 bg-black/40 border border-white/10 rounded-lg p-4 text-white focus:border-nexa-primary outline-none"
                    placeholder="Ask for strategy, analysis, or car setup..."
                />
                <button onClick={send} className="px-8 bg-nexa-primary text-white font-bold rounded-lg hover:bg-white hover:text-black">SEND</button>
            </div>
        </div>
    );
};

// --- Main App ---
const App = () => {
  const [view, setView] = useState<AppView>(AppView.INTRO);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState("");
  
  const [user, setUser] = useState<UserProfile>({
    name: "Commander",
    level: 1,
    xp: 0,
    credits: 5000,
    rank: "ROOKIE",
    team: "NEXA"
  });

  const [car, setCar] = useState<CarConfig>({
    model: 'SPEEDSTER',
    color: '#0B101B',
    rimColor: '#00F6FF',
    spoiler: true,
    neon: true,
    texture: 'metallic'
  });

  const [authStep, setAuthStep] = useState(false);

  const handleRegistration = (username: string) => {
      setUser(prev => ({...prev, name: username}));
      setAuthStep(false);
      setView(AppView.DASHBOARD);
      setNotificationMsg(`WELCOME, ${username.toUpperCase()}. ACCESS GRANTED.`);
      setShowNotification(true);
  };

  const renderContent = () => {
      if (view === AppView.INTRO && !authStep) {
          return <IntroSequence onComplete={() => setAuthStep(true)} />;
      }
      if (authStep) {
          return <AuthView onRegister={handleRegistration} />;
      }

      switch(view) {
          case AppView.DASHBOARD: return <DashboardView profile={user} onAction={setView} carConfig={car} />;
          case AppView.GARAGE: return <GarageView config={car} setConfig={setCar} />;
          case AppView.GAME: return <Game3D config={car} onExit={() => setView(AppView.DASHBOARD)} onGameOver={(score) => { setUser(prev => ({...prev, xp: prev.xp + score, credits: prev.credits + Math.floor(score/10) })); }} />;
          case AppView.ARCADE: return <DriveMadGame onExit={() => setView(AppView.DASHBOARD)} config={car} />;
          case AppView.LEADERBOARD: return <LeaderboardView />;
          case AppView.MARKET: return <MarketView credits={user.credits} setCredits={(c: number) => setUser({...user, credits: c})} />;
          case AppView.EVENTS: return <EventsView />;
          case AppView.TROPHY_ROOM: return <TrophyView />;
          case AppView.AI_CHIEF: return <AiChiefView />;
          default: return null;
      }
  };

  return (
    <div className="relative min-h-screen w-full text-nexa-text font-sans selection:bg-nexa-accent selection:text-black">
        {view !== AppView.INTRO && view !== AppView.ARCADE && <ImmersiveBackground />}
        
        <NotificationToast message={notificationMsg} visible={showNotification} onClose={() => setShowNotification(false)} />

        {view !== AppView.INTRO && !authStep && view !== AppView.GAME && view !== AppView.ARCADE && (
            <Navigation active={view} onChange={setView} profile={user} />
        )}

        <Suspense fallback={<div className="fixed inset-0 bg-black flex items-center justify-center z-[200] text-nexa-primary font-mono animate-pulse">LOADING NEXA ASSETS...</div>}>
            {renderContent()}
        </Suspense>
    </div>
  );
};

export default App;
