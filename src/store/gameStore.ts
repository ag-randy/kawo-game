import { create } from 'zustand';
import { Game, AuthUser, ChatMessage, LeaderboardEntry } from '../types';

// ========================
// GAME STORE
// ========================
interface GameStore {
  // Auth
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;

  // Game
  currentGame: Game | null;
  setCurrentGame: (game: Game | null) => void;
  clearGame: () => void;

  // Lobby
  gameCode: string;
  setGameCode: (code: string) => void;

  // Chat
  messages: ChatMessage[];
  addMessage: (message: ChatMessage) => void;
  clearMessages: () => void;

  // Leaderboard
  leaderboard: LeaderboardEntry[];
  setLeaderboard: (entries: LeaderboardEntry[]) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
}

export const useGameStore = create<GameStore>((set) => ({
  // Auth
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),

  // Game
  currentGame: null,
  setCurrentGame: (game) => set({ currentGame: game }),
  clearGame: () => set({ currentGame: null, gameCode: '', messages: [] }),

  // Lobby
  gameCode: '',
  setGameCode: (code) => set({ gameCode: code }),

  // Chat
  messages: [],
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  clearMessages: () => set({ messages: [] }),

  // Leaderboard
  leaderboard: [],
  setLeaderboard: (entries) => set({ leaderboard: entries }),

  // UI State
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  error: null,
  setError: (error) => set({ error }),
}));