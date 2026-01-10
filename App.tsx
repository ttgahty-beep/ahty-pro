
import React, { useState, useEffect, Suspense, useRef, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import { 
  OrbitControls, 
  Environment, 
  Stars,
  Float, 
  Sparkles, 
  PerspectiveCamera,
  Html
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
  Rotate3D,
  Loader,
  MessageSquare,
  Send,
  Radar,
  TrendingUp,
  Clock,
  MapPin,
  List,
  BarChart3,
  Mic,
  MicOff,
  Waves,
  Command
} from 'lucide-react';
import { FilesetResolver, GestureRecognizer, DrawingUtils } from '@mediapipe/tasks-vision';
import * as THREE from 'three';

import { AppView, CarConfig, UserProfile, NavItem, CarModel } from './types';
import { ThreeCar } from './components/ThreeCar';
import { Game3D } from './components/Game3D'; 
import { DriveMadGame } from './components/DriveMadGame';
import { getCrewChiefAdvice, getCarAnalysis, processShadowCommand } from './services/ai';
import Hyperspeed from './components/ui/Hyperspeed';
import MagicBento, { BentoCardProps } from './components/MagicBento';
import { audioManager } from './services/AudioManager';

// --- Global AI Singleton to prevent re-initialization lag ---
let sharedRecognizer: GestureRecognizer | null = null;
let recognizerLoading = false;

// --- Components ---
const CircleIcon = (props: any) => <div className="w-6 h-6 rounded-full border-2 border-current" {...props}></div>;

// --- Market Item Definitions ---
const MARKET_ITEMS = [
    { id: 'model_titan', name: 'TITAN Chassis', price: 150000, value: 'TITAN', type: 'model', icon: ShieldCheck },
    { id: 'model_spectre', name: 'SPECTRE Chassis', price: 200000, value: 'SPECTRE', type: 'model', icon: Zap },
    { id: 'model_vanguard', name: 'VANGUARD Chassis', price: 250000, value: 'VANGUARD', type: 'model', icon: Crosshair },
    { id: 'paint_gold', name: 'Midas Gold Paint', price: 50000, value: '#FFD700', type: 'color', icon: User },
    { id: 'paint_stealth', name: 'Stealth Black', price: 40000, value: '#050505', type: 'color', icon: User },
    { id: 'rim_crimson', name: 'Crimson Rims', price: 20000, value: '#FF0000', type: 'rim', icon: CircleIcon },
    { id: 'turbo_chip', name: 'Turbo Chip V2', price: 2000, value: 'upgrade_turbo', type: 'upgrade', icon: Cpu },
];


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

// --- AuthView Component ---
const AuthView = ({ onRegister }: { onRegister: (name: string) => void }) => {
    const [name, setName] = useState('');
    return (
        <div className="absolute inset-0 flex items-center justify-center z-50 p-4">
            <div className="glass-pro p-8 rounded-2xl border border-nexa-primary/30 max-w-md w-full relative overflow-hidden group">
                 <div className="absolute inset-0 bg-gradient-to-b from-nexa-primary/5 to-transparent pointer-events-none"></div>
                 <h2 className="text-3xl font-display font-bold text-white mb-2">IDENTIFY</h2>
                 <p className="text-nexa-muted text-sm mb-6">Enter callsign to synchronize neuro-link.</p>
                 
                 <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="CALLSIGN..."
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white font-mono mb-4 focus:border-nexa-accent outline-none transition-colors"
                 />
                 
                 <button 
                    onClick={() => name && onRegister(name)}
                    disabled={!name}
                    className="w-full py-4 bg-nexa-primary text-white font-bold tracking-widest rounded-lg hover:bg-nexa-accent hover:text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    INITIALIZE
                 </button>
            </div>
        </div>
    );
};

// --- Navigation Component ---
const Navigation = ({ active, onChange, profile }: { active: AppView, onChange: (v: AppView) => void, profile: UserProfile }) => {
    const navItems: NavItem[] = [
        { id: AppView.DASHBOARD, label: 'BASE', icon: LayoutDashboard },
        { id: AppView.GARAGE, label: 'MODS', icon: Settings },
        { id: AppView.GAME, label: 'RACE', icon: Gamepad2 },
        { id: AppView.ARCADE, label: 'DRIVE', icon: Zap },
        { id: AppView.MARKET, label: 'MARKET', icon: ShoppingBag },
    ];

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
            <div className="glass-pro px-6 py-3 rounded-full border border-white/10 flex items-center gap-2 shadow-[0_10px_30px_rgba(0,0,0,0.5)] bg-black/80 backdrop-blur-xl">
                 {navItems.map(item => (
                     <button
                        key={item.id}
                        onClick={() => onChange(item.id)}
                        className={`relative p-3 rounded-full transition-all group ${active === item.id ? 'text-black bg-nexa-accent' : 'text-nexa-muted hover:text-white hover:bg-white/10'}`}
                     >
                        <item.icon size={20} />
                        {active === item.id && (
                            <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-nexa-accent text-black text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                {item.label}
                            </span>
                        )}
                     </button>
                 ))}
                 
                 <div className="w-px h-8 bg-white/10 mx-2"></div>
                 
                 <div className="flex items-center gap-3 px-2">
                     <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-nexa-primary to-nexa-accent flex items-center justify-center font-bold text-xs text-black">
                         {profile.name.substring(0,2).toUpperCase()}
                     </div>
                     <div className="flex flex-col">
                         <span className="text-[10px] text-nexa-muted font-bold">CREDITS</span>
                         <span className="text-xs text-white font-mono">{profile.credits.toLocaleString()}</span>
                     </div>
                 </div>
            </div>
        </div>
    );
};

// --- DashboardView Component ---
const DashboardView = ({ profile, onAction, carConfig }: { profile: UserProfile, onAction: (v: AppView) => void, carConfig: CarConfig }) => {
    const bentoCards: BentoCardProps[] = [
        {
            title: "NEON RUNNER",
            description: "High-speed endless avoidance.",
            label: "MAIN EVENT",
            color: "#7A3CFF",
            icon: <Gamepad2 size={24}/>,
            onClick: () => onAction(AppView.GAME)
        },
        {
            title: "GARAGE",
            description: "Customize your ride.",
            label: "WORKSHOP",
            color: "#0B101B", 
            icon: <Settings size={24}/>,
            onClick: () => onAction(AppView.GARAGE)
        },
        {
            title: "INTERCEPTOR",
            description: "Defense arcade protocol.",
            label: "ARCADE",
            color: "#FF3366",
            icon: <Crosshair size={24}/>,
            onClick: () => onAction(AppView.ARCADE)
        },
        {
            title: "MARKETPLACE",
            description: "Acquire new tech.",
            label: "STORE",
            color: "#0B101B",
            icon: <ShoppingBag size={24}/>,
            onClick: () => onAction(AppView.MARKET)
        },
        {
            title: "LEADERBOARD",
            description: "Global rankings.",
            label: "RANK: " + profile.rank,
            color: "#00F6FF",
            icon: <Trophy size={24} className="text-black"/>,
            onClick: () => onAction(AppView.LEADERBOARD)
        }
    ];

    return (
        <div className="w-full h-full pt-20 px-4 pb-24 overflow-y-auto custom-scroll relative z-10">
             <div className="max-w-6xl mx-auto">
                 <header className="mb-8 flex justify-between items-end">
                     <div>
                         <h2 className="text-4xl font-display font-black text-white mb-1">COMMAND CENTER</h2>
                         <p className="text-nexa-muted">Welcome back, {profile.name}. Systems Nominal.</p>
                     </div>
                     <div className="text-right">
                         <div className="text-xs text-nexa-accent font-mono tracking-widest mb-1">CURRENT XP</div>
                         <div className="text-2xl font-bold text-white">{profile.xp.toLocaleString()}</div>
                     </div>
                 </header>

                 <MagicBento 
                    cards={bentoCards} 
                    enableSpotlight={true} 
                    spotlightRadius={300}
                    enableStars={true}
                 />
                 
                 <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="glass-pro p-6 rounded-2xl border border-white/10">
                         <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><Activity size={20} className="text-nexa-success"/> RECENT ACTIVITY</h3>
                         <div className="space-y-3">
                             {[1,2,3].map(i => (
                                 <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                     <span className="text-sm text-nexa-text">Race Event #{100+i}</span>
                                     <span className="text-xs text-nexa-accent">+{(100*i)} XP</span>
                                 </div>
                             ))}
                         </div>
                     </div>
                     
                     <div className="glass-pro p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
                         <div className="absolute inset-0 bg-gradient-to-r from-transparent to-nexa-primary/20 group-hover:opacity-100 opacity-50 transition-opacity"></div>
                         <h3 className="text-xl font-bold text-white mb-2 relative z-10">DAILY CHALLENGE</h3>
                         <p className="text-sm text-nexa-muted mb-4 relative z-10">Complete 3 races without crashing.</p>
                         <div className="w-full bg-black/50 h-2 rounded-full overflow-hidden relative z-10">
                             <div className="h-full bg-nexa-accent w-2/3"></div>
                         </div>
                         <div className="mt-2 text-right text-xs text-white relative z-10">2/3 COMPLETED</div>
                     </div>
                 </div>
             </div>
        </div>
    );
};

// --- DEDICATED 3D SCENE FOR GARAGE ---
const Garage3DScene = ({ config, gestureRef, gestureActive }: { config: CarConfig, gestureRef: React.MutableRefObject<any>, gestureActive: boolean }) => {
    const groupRef = useRef<THREE.Group>(null);
    const angleDifference = (a: number, b: number) => {
        let diff = (b - a) % (2 * Math.PI);
        if (diff < -Math.PI) diff += 2 * Math.PI;
        if (diff > Math.PI) diff -= 2 * Math.PI;
        return diff;
    };

    useFrame((state, delta) => {
        if (!groupRef.current) return;
        const dt = Math.min(delta, 0.1);
        let targetRot = groupRef.current.rotation.y;
        let targetScale = 1.2;

        if (gestureActive && gestureRef.current) {
            const rawRot = gestureRef.current.rotation;
            const rawZoom = gestureRef.current.zoom;
            if (!isNaN(rawRot) && isFinite(rawRot)) targetRot = rawRot;
            if (!isNaN(rawZoom) && isFinite(rawZoom)) targetScale = Math.max(0.6, Math.min(1.8, rawZoom));
            
            const current = groupRef.current.rotation.y;
            const diff = angleDifference(current, targetRot);
            groupRef.current.rotation.y += diff * dt * 5;
            
            const currentScale = groupRef.current.scale.x;
            const newScale = THREE.MathUtils.lerp(currentScale, targetScale, dt * 5);
            if (!isNaN(newScale) && isFinite(newScale) && newScale > 0.1) {
                groupRef.current.scale.set(newScale, newScale, newScale);
            }
        } else {
            groupRef.current.rotation.y += dt * 0.5;
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

// --- SHADOW AI INTERFACE ---
const ShadowInterface = ({ isActive, isProcessing, text }: { isActive: boolean, isProcessing: boolean, text: string }) => {
    return (
        <div className={`absolute bottom-6 right-6 z-50 transition-all duration-500 ${isActive ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-50'}`}>
            <div className={`glass-pro p-4 rounded-2xl flex items-center gap-4 border-l-4 ${isActive ? 'border-nexa-accent shadow-[0_0_30px_rgba(0,246,255,0.3)]' : 'border-white/20'}`}>
                <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-black border ${isActive ? 'border-nexa-accent' : 'border-white/20'}`}>
                        {isProcessing ? (
                             <Loader className="animate-spin text-nexa-accent" size={24} />
                        ) : isActive ? (
                             <Command className="animate-pulse text-nexa-accent" size={24} />
                        ) : (
                             <MicOff className="text-white/30" size={24} />
                        )}
                    </div>
                    {isActive && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-nexa-accent opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-nexa-accent"></span>
                        </span>
                    )}
                </div>
                <div className="flex flex-col">
                    <span className={`text-[10px] font-bold tracking-widest ${isActive ? 'text-nexa-accent' : 'text-nexa-muted'}`}>SHADOW {isActive ? 'ONLINE' : 'STANDBY'}</span>
                    <span className="text-xs text-white font-mono max-w-[250px] truncate">{text || (isActive ? "Awaiting orders..." : "Say 'Shadow' to activate")}</span>
                </div>
            </div>
        </div>
    );
};

// 2. Garage View with Advanced Gesture Control (MediaPipe)
const GarageView = ({ config, setConfig, userInventory }: { config: CarConfig, setConfig: any, userInventory: string[] }) => {
    const [gestureActive, setGestureActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [recognizerReady, setRecognizerReady] = useState(false);
    const gestureData = useRef({ rotation: 0, zoom: 1.2 });
    const [statusText, setStatusText] = useState("AI SYSTEM OFFLINE");

    // Shadow AI State
    const [shadowActive, setShadowActive] = useState(false);
    const [shadowProcessing, setShadowProcessing] = useState(false);
    const [shadowText, setShadowText] = useState("");
    const recognitionRef = useRef<any>(null);
    const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
    
    // Refs for stable closure access in speech recognition callbacks
    const configRef = useRef(config);
    const chatHistoryRef = useRef(chatHistory);
    const shadowActiveRef = useRef(shadowActive);

    const models: CarModel[] = ['SPEEDSTER', 'TITAN', 'SPECTRE', 'VANGUARD'];
    const currentModelIdx = models.indexOf(config.model);
    
    // Sync state to refs
    useEffect(() => { configRef.current = config; }, [config]);
    useEffect(() => { chatHistoryRef.current = chatHistory; }, [chatHistory]);
    useEffect(() => { shadowActiveRef.current = shadowActive; }, [shadowActive]);
    
    // Play Idle Audio on Mount
    useEffect(() => {
        audioManager.playGarageAmbience();
        return () => audioManager.stopGarageAmbience();
    }, []);

    // --- SHADOW VOICE LOGIC ---
    const speak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9; // Deeper and slower for JARVIS vibe
        utterance.pitch = 0.8; 
        window.speechSynthesis.speak(utterance);
        setShadowText(text);
    };

    useEffect(() => {
        // Init Speech Recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.warn("Speech Recognition not supported");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = async (event: any) => {
            const last = event.results.length - 1;
            const transcript = event.results[last][0].transcript.trim();
            console.log("Voice Input:", transcript);
            
            // Access state via refs to avoid closure staleness without dependency updates
            const isShadowActive = shadowActiveRef.current;
            const currentConfig = configRef.current;
            const currentHistory = chatHistoryRef.current;

            // 1. WAKE WORD DETECTION
            if (!isShadowActive) {
                if (transcript.toLowerCase().includes("shadow")) {
                    setShadowActive(true);
                    const greetings = [
                        "Shadow online. I am listening, Boss.",
                        "Systems synced. Awaiting your brilliance.",
                        "Garage authority active. What is the plan?"
                    ];
                    speak(greetings[Math.floor(Math.random() * greetings.length)]);
                }
                return;
            } 
            
            // 2. DEACTIVATION COMMANDS
            const lower = transcript.toLowerCase();
            if (lower.includes("shadow sleep") || 
                lower.includes("go offline") || 
                lower.includes("shadow offline") ||
                lower.includes("deactivate")
            ) {
                speak("Powering down. I'll be here when you need me.");
                setShadowActive(false);
                return;
            }

            // 3. COMMAND & CHAT PROCESSING
            setShadowProcessing(true);
            const result = await processShadowCommand(transcript, currentConfig, currentHistory);
            setShadowProcessing(false);

            if (result.voiceResponse) {
                speak(result.voiceResponse);
                setChatHistory(prev => {
                    const newHistory = [...prev, { role: 'user', text: transcript }, { role: 'model', text: result.voiceResponse }];
                    return newHistory.slice(-6); // Keep last 6 exchanges context
                });
            }

            if (result.actions && Array.isArray(result.actions)) {
                // Execute Multiple Actions Sequentially
                const newConfig = { ...currentConfig };
                let changed = false;

                result.actions.forEach((action: any) => {
                    const p = action.params || {};
                    switch (action.type) {
                        case 'setCarColor':
                            if(p.color) { newConfig.color = p.color; if(p.texture) newConfig.texture = p.texture; changed = true; }
                            break;
                        case 'setRimColor':
                            if(p.color) { newConfig.rimColor = p.color; changed = true; }
                            break;
                        case 'setSpoiler':
                            if(p.enabled !== undefined) { newConfig.spoiler = p.enabled; changed = true; }
                            break;
                        case 'setNeon':
                            if(p.enabled !== undefined) { newConfig.neon = p.enabled; changed = true; }
                            break;
                        case 'setModel':
                            if(p.model && ['SPEEDSTER', 'TITAN', 'SPECTRE', 'VANGUARD'].includes(p.model)) { 
                                newConfig.model = p.model as CarModel; 
                                changed = true; 
                            }
                            break;
                        case 'resetCar':
                            Object.assign(newConfig, {
                                model: 'SPEEDSTER',
                                color: '#0B101B',
                                rimColor: '#00F6FF',
                                spoiler: true,
                                neon: true,
                                texture: 'metallic'
                            });
                            changed = true;
                            break;
                    }
                });

                if (changed) {
                    setConfig(newConfig);
                }
            }
        };

        recognition.onerror = (event: any) => {
            // Silently ignore no-speech errors to prevent console spam
            if (event.error === 'no-speech') return;
            
            console.error("Speech Recognition Error", event.error);
            // If network error, disable to prevent loops
            if(event.error === 'network') setShadowActive(false);
        };
        
        // Auto-restart on end to simulate continuous listening
        recognition.onend = () => {
             if (recognitionRef.current) {
                 try {
                     recognitionRef.current.start();
                 } catch (e) {
                     // Ignore start errors (e.g. if already started)
                 }
             }
        };

        try {
            recognition.start();
        } catch(e) { console.log("Recognition start failed", e); }
        
        recognitionRef.current = recognition;

        return () => {
            // Cleanup: remove onend to prevent restart loop during unmount
            if (recognitionRef.current) {
                recognitionRef.current.onend = null;
                recognitionRef.current.stop();
                recognitionRef.current = null;
            }
        };
    }, []); // Empty dependency array ensures stable instance


    // Helper to check if item is owned
    const isOwned = (type: string, value: string) => {
        if (type === 'model' && value === 'SPEEDSTER') return true;
        if (type === 'color' && ['#0B101B', '#E0E6ED', '#00F6FF', '#7A3CFF'].includes(value)) return true; // Defaults
        if (type === 'rim' && ['#E0E6ED', '#00F6FF', '#7A3CFF', '#FF3366'].includes(value)) return true; // Defaults

        // Check if market item exists for this value
        const marketItem = MARKET_ITEMS.find(i => i.value === value && i.type === type);
        if (!marketItem) return true; // Assume free if not in market list (simplified)
        
        return userInventory.includes(marketItem.id);
    };

    // Init MediaPipe ONLY ONCE globally
    useEffect(() => {
        const init = async () => {
            if (sharedRecognizer) {
                setRecognizerReady(true);
                setStatusText("AI READY. ACTIVATE SENSOR.");
                return;
            }
            if (recognizerLoading) return;
            recognizerLoading = true;
            setStatusText("INITIALIZING NEURAL LINK...");
            try {
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
                     drawingUtils.drawConnectors(hand, GestureRecognizer.HAND_CONNECTIONS, { color: "#00F6FF", lineWidth: 2 });
                     drawingUtils.drawLandmarks(hand, { color: "#FF3366", lineWidth: 1, radius: 2 });

                     const gesture = results.gestures.length > 0 ? results.gestures[0][0].categoryName : "None";
                     const wrist = hand[0]; 
                     const x = 1.0 - wrist.x; 
                     const targetRot = (x - 0.5) * Math.PI * 2; 
                     const y = wrist.y;
                     const targetZoom = 0.8 + (y * 1.0);
                     const clampedZoom = Math.max(0.5, Math.min(2.0, targetZoom));

                     if (gesture === "Closed_Fist") {
                         gestureData.current.rotation = targetRot;
                         gestureData.current.zoom = clampedZoom;
                         if(Date.now() - lastStatusUpdate > 500) {
                             setStatusText("GRIPPED: ROTATING");
                             lastStatusUpdate = Date.now();
                         }
                     } else if (gesture === "Thumb_Up") {
                         thumbUpFrames++;
                         if (thumbUpFrames === 30) {
                             cycleModel(1);
                             thumbUpFrames = 0;
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
        let nextIdx = currentModelIdx;
        let count = 0;
        // Cycle until we find an owned model or full loop
        do {
            nextIdx = (nextIdx + dir + models.length) % models.length;
            count++;
        } while (!isOwned('model', models[nextIdx]) && count < models.length);
        
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
                                     <p className="text-[10px] text-nexa-muted font-mono font-bold">{recognizerReady ? 'SYSTEM READY' : 'DOWNLOADING MODEL...'}</p>
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
                            {['#0B101B', '#E0E6ED', '#FF3366', '#00F6FF', '#7A3CFF', '#FFFF00', '#FFD700', '#050505'].map(c => {
                                const owned = isOwned('color', c);
                                return (
                                    <button 
                                        key={c} 
                                        onClick={() => owned && setConfig({...config, color: c})} 
                                        className={`w-8 h-8 rounded border transition-transform relative ${owned ? 'border-white/20 hover:scale-110' : 'border-white/5 opacity-40 cursor-not-allowed'}`}
                                        style={{backgroundColor: c}}
                                    >
                                        {!owned && <div className="absolute inset-0 flex items-center justify-center text-black/50"><Lock size={12}/></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-nexa-accent tracking-widest block mb-2">RIMS</label>
                        <div className="flex flex-wrap gap-2">
                            {['#E0E6ED', '#00F6FF', '#7A3CFF', '#FF3366', '#FFD700', '#FF0000'].map(c => {
                                const owned = isOwned('rim', c);
                                return (
                                    <button 
                                        key={c} 
                                        onClick={() => owned && setConfig({...config, rimColor: c})} 
                                        className={`w-8 h-8 rounded-full border-2 transition-transform relative ${owned ? 'border-white/20 hover:scale-110' : 'border-white/5 opacity-40 cursor-not-allowed'}`}
                                        style={{borderColor: c}}
                                    >
                                         {!owned && <div className="absolute inset-0 flex items-center justify-center text-white/50"><Lock size={12}/></div>}
                                    </button>
                                );
                            })}
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
                 <div className="absolute inset-0 bg-[linear-gradient(rgba(0,246,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,246,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                 <Canvas dpr={[1, 1.5]}>
                     <PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50} />
                     <Suspense fallback={<Html center><div className="text-nexa-accent font-mono animate-pulse text-xs">LOADING ENV...</div></Html>}>
                         <Environment resolution={512}>
                             <group rotation={[-Math.PI / 2, 0, 0]}>
                                 <mesh scale={100}>
                                     <sphereGeometry args={[1, 64, 64]} />
                                     <meshBasicMaterial color="#111" side={THREE.BackSide} />
                                 </mesh>
                                 <mesh position={[10, 10, 10]} scale={2}>
                                     <sphereGeometry />
                                     <meshBasicMaterial color="#00F6FF" />
                                 </mesh>
                                 <mesh position={[-10, 5, -10]} scale={2}>
                                     <sphereGeometry />
                                     <meshBasicMaterial color="#7A3CFF" />
                                 </mesh>
                             </group>
                         </Environment>
                         <Garage3DScene config={config} gestureRef={gestureData} gestureActive={gestureActive} />
                     </Suspense>
                     <ambientLight intensity={0.5} />
                     <spotLight position={[10, 10, 10]} intensity={1} castShadow />
                     <OrbitControls enablePan={false} enabled={!gestureActive} minDistance={3} maxDistance={10} />
                     <gridHelper args={[20, 20, 0x444444, 0x111111]} position={[0, -1, 0]} />
                 </Canvas>
                 
                 {/* Shadow AI Interface */}
                 <ShadowInterface isActive={shadowActive} isProcessing={shadowProcessing} text={shadowText} />
            </div>
        </div>
    );
};

// ... (Other components remain unchanged) ...

const App = () => {
  const [introFinished, setIntroFinished] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<AppView>(AppView.DASHBOARD);
  const [carConfig, setCarConfig] = useState<CarConfig>({
    model: 'SPEEDSTER',
    color: '#0B101B',
    rimColor: '#00F6FF',
    spoiler: true,
    neon: true,
    texture: 'metallic'
  });

  const handleRegister = (name: string) => {
    setUser({
      name,
      level: 1,
      xp: 0,
      credits: 5000,
      rank: 'ROOKIE',
      team: 'NEXA',
      inventory: ['model_speedster']
    });
  };

  const renderContent = () => {
    switch (activeView) {
      case AppView.GAME:
        return (
          <Game3D 
             config={carConfig} 
             onGameOver={(score) => {
               if(user) {
                   setUser({
                       ...user,
                       xp: user.xp + score,
                       credits: user.credits + Math.floor(score / 10)
                   });
               }
               setActiveView(AppView.DASHBOARD);
             }} 
             onExit={() => setActiveView(AppView.DASHBOARD)} 
          />
        );
      case AppView.ARCADE:
        return <DriveMadGame onExit={() => setActiveView(AppView.DASHBOARD)} />;
      case AppView.GARAGE:
        return <GarageView config={carConfig} setConfig={setCarConfig} userInventory={user?.inventory || []} />;
      case AppView.DASHBOARD:
        return <DashboardView profile={user} onAction={setActiveView} carConfig={carConfig} />;
      default:
         return (
            <div className="flex flex-col items-center justify-center h-screen w-full relative z-10 text-white">
                <ImmersiveBackground />
                <Navigation active={activeView} onChange={setActiveView} profile={user!} />
                <div className="glass-pro p-12 rounded-xl text-center">
                    <h1 className="text-4xl font-bold mb-4">{activeView}</h1>
                    <p className="text-nexa-muted mb-8">This module is currently under development.</p>
                    <button onClick={() => setActiveView(AppView.DASHBOARD)} className="px-6 py-2 bg-nexa-primary rounded">
                        RETURN TO BASE
                    </button>
                </div>
            </div>
         );
    }
  };

  if (!introFinished) {
    return <IntroSequence onComplete={() => setIntroFinished(true)} />;
  }

  if (!user) {
    return (
        <div className="relative w-full h-screen">
            <ImmersiveBackground />
            <AuthView onRegister={handleRegister} />
        </div>
    );
  }

  const isImmersive = activeView === AppView.GAME || activeView === AppView.ARCADE;

  return (
    <div className="relative w-full min-h-screen bg-black text-white font-sans selection:bg-nexa-accent selection:text-black overflow-x-hidden">
        {!isImmersive && <ImmersiveBackground />}
        {!isImmersive && <Navigation active={activeView} onChange={setActiveView} profile={user} />}
        
        <main className={`relative ${!isImmersive ? 'z-10' : 'z-0 h-screen'}`}>
            {renderContent()}
        </main>
    </div>
  );
};

export default App;
