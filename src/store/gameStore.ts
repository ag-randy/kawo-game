import { create } from 'zustand';

interface Card {
  rank: 'A' | 'K' | 'Q' | 'J';
  suit: '♠' | '♥' | '♦' | '♣';
}

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface ChatMessage {
  id: string;
  gameId: string;
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

interface LeaderboardEntry {
  uid: string;
  username: string;
  avatar: string;
  rating: number;
  wins: number;
  losses: number;
  totalGames: number;
  winRate: number;
  createdAt: number;
  rank: number;
}

interface GameStore {
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  currentGame: any | null;
  setCurrentGame: (game: any | null) => void;
  clearGame: () => void;
  gameCode: string;
  setGameCode: (code: string) => void;
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;
  leaderboard: LeaderboardEntry[];
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  currentGame: null,
  setCurrentGame: (game) => set({ currentGame: game }),
  clearGame: () => set({ currentGame: null, gameCode: '', messages: [] }),
  gameCode: '',
  setGameCode: (code) => set({ gameCode: code }),
  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),
  leaderboard: [],
  setLeaderboard: (entries) => set({ leaderboard: entries }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));