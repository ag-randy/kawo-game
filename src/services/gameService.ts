import { ref, set, get, update, onValue, off } from 'firebase/database';
import { db } from '../config/firebase';

// ========================
// TYPES
// ========================
interface Card {
  rank: 'A' | 'K' | 'Q' | 'J';
  suit: '♠' | '♥' | '♦' | '♣';
}

interface GamePlayer {
  uid: string;
  username: string;
  isReady: boolean;
  isConnected: boolean;
  position: number;
  team: number;
}

interface Game {
  gameId: string;
  players: GamePlayer[];
  hands: Card[][];
  currentPlayer: number;
  dealer: number;
  scores: { team1: number; team2: number };
  status: 'waiting' | 'playing' | 'roundOver' | 'gameOver';
  roundOver: boolean;
  createdAt: number;
  updatedAt: number;
}

// ========================
// GENERATE GAME CODE
// ========================
const generateGameCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'KAWO-';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

// ========================
// CREATE GAME
// ========================
export const createGame = async (
  uid: string,
  username: string
): Promise<string> => {
  const gameId = generateGameCode();

  const newGame: Game = {
    gameId,
    players: [
      {
        uid,
        username,
        isReady: true,
        isConnected: true,
        position: 0,
        team: 1,
      },
    ],
    hands: [[], [], [], []],
    currentPlayer: 0,
    dealer: 0,
    scores: { team1: 0, team2: 0 },
    status: 'waiting',
    roundOver: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  await set(ref(db, `games/${gameId}`), newGame);
  return gameId;
};

// ========================
// JOIN GAME
// ========================
export const joinGame = async (
  gameId: string,
  uid: string,
  username: string
): Promise<{ success: boolean; message: string }> => {
  const gameRef = ref(db, `games/${gameId}`);
  const snapshot = await get(gameRef);

  if (!snapshot.exists()) {
    return { success: false, message: 'Game not found. Check your code!' };
  }

  const game: Game = snapshot.val();

  if (game.status !== 'waiting') {
    return { success: false, message: 'Game already started!' };
  }

  if (game.players.length >= 4) {
    return { success: false, message: 'Game is full!' };
  }

  // Check if player already in game
  const alreadyIn = game.players.some((p) => p.uid === uid);
  if (alreadyIn) {
    return { success: true, message: 'Rejoining game...' };
  }

  // Assign position and team
  const position = game.players.length;
  const team = position === 0 || position === 2 ? 1 : 2;

  const newPlayer: GamePlayer = {
    uid,
    username,
    isReady: true,
    isConnected: true,
    position,
    team,
  };

  const updatedPlayers = [...game.players, newPlayer];

  await update(gameRef, {
    players: updatedPlayers,
    updatedAt: Date.now(),
  });

  return { success: true, message: 'Joined successfully!' };
};

// ========================
// SUBSCRIBE TO GAME
// ========================
export const subscribeToGame = (
  gameId: string,
  callback: (game: Game | null) => void
) => {
  const gameRef = ref(db, `games/${gameId}`);
  onValue(gameRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback(null);
    }
  });
  return () => off(gameRef);
};

// ========================
// START GAME
// ========================
export const startGame = async (gameId: string): Promise<void> => {
  const gameRef = ref(db, `games/${gameId}`);
  const snapshot = await get(gameRef);
  const game: Game = snapshot.val();

  // Create and shuffle deck
  const ranks: Card['rank'][] = ['A', 'K', 'Q', 'J'];
  const suits: Card['suit'][] = ['♠', '♥', '♦', '♣'];
  const deck: Card[] = [];

  ranks.forEach((rank) => {
    suits.forEach((suit) => {
      deck.push({ rank, suit });
    });
  });

  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // Deal 4 cards to each player
  const hands: Card[][] = [[], [], [], []];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      hands[i].push(deck[i * 4 + j]);
    }
  }

  await update(gameRef, {
    hands,
    status: 'playing',
    currentPlayer: 0,
    dealer: 0,
    updatedAt: Date.now(),
  });
};