// ========================
// CARD TYPES
// ========================
export type Rank = 'A' | 'K' | 'Q' | 'J';
export type Suit = '♠' | '♥' | '♦' | '♣';

export interface Card {
  rank: Rank;
  suit: Suit;
}

// ========================
// PLAYER TYPES
// ========================
export interface Player {
  uid: string;
  username: string;
  avatar: string;
  isReady: boolean;
  isConnected: boolean;
  team: 1 | 2;
  position: 0 | 1 | 2 | 3; // 0=bottom, 1=left, 2=top, 3=right
}

// ========================
// GAME TYPES
// ========================
export type GameStatus = 'waiting' | 'playing' | 'roundOver' | 'gameOver';
export type KawoType = 'kawo' | 'double' | 'full';
export type GameMode = 'classic' | 'speed' | 'blitz';

export interface Scores {
  team1: number;
  team2: number;
}

export interface Game {
  gameId: string;
  players: Player[];
  hands: Card[][];
  currentPlayer: number;
  dealer: number;
  scores: Scores;
  status: GameStatus;
  mode: GameMode;
  roundOver: boolean;
  createdAt: number;
  updatedAt: number;
}

// ========================
// LEADERBOARD TYPES
// ========================
export interface UserProfile {
  uid: string;
  username: string;
  avatar: string;
  rating: number;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  createdAt: number;
}

export interface LeaderboardEntry extends UserProfile {
  rank: number;
}

// ========================
// CHAT TYPES
// ========================
export interface ChatMessage {
  id: string;
  gameId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

// ========================
// AUTH TYPES
// ========================
export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}