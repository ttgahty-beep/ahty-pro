
export enum AppView {
  INTRO = 'INTRO',
  DASHBOARD = 'DASHBOARD',
  GARAGE = 'GARAGE',
  GAME = 'GAME',
  ARCADE = 'ARCADE',
  LEADERBOARD = 'LEADERBOARD',
  MARKET = 'MARKET',
  TROPHY_ROOM = 'TROPHY_ROOM',
  EVENTS = 'EVENTS',
  AI_CHIEF = 'AI_CHIEF',
  PROFILE = 'PROFILE'
}

export interface UserProfile {
  name: string;
  level: number;
  xp: number;
  credits: number;
  rank: string;
  team: string;
}

export type CarModel = 'SPEEDSTER' | 'TITAN' | 'SPECTRE' | 'VANGUARD';

export interface CarConfig {
  model: CarModel;
  color: string;
  rimColor: string;
  spoiler: boolean;
  neon: boolean;
  texture: 'matte' | 'glossy' | 'metallic';
}

export enum GameState {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
}

export interface NavItem {
  id: AppView;
  label: string;
  icon: any;
}
