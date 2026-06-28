import { useEffect, useState, useRef } from 'react';
import { ref, update, onValue, off } from 'firebase/database';
import { db } from '../../config/firebase';
import { useGameStore } from '../../store/gameStore';

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
  status: string;
  roundOver: boolean;
}

// ========================
// CARD COMPONENT
// ========================
const CardUI = ({ card, small = false }: { card: Card; small?: boolean }) => {
  const isRed = card.suit === '♥' || card.suit === '♦';
  return (
    <div
      className={`${small ? 'w-10 h-14 text-xs' : 'w-14 h-20 text-sm'} 
      bg-white border-2 border-gray-300 rounded-lg flex flex-col items-center 
      justify-center shadow-md font-bold ${isRed ? 'text-red-600' : 'text-gray-900'}`}
    >
      <div>{card.rank}</div>
      <div className="text-lg">{card.suit}</div>
    </div>
  );
};

// Card back (hidden cards)
const CardBack = ({ small = false }: { small?: boolean }) => (
  <div
    className={`${small ? 'w-10 h-14' : 'w-14 h-20'} 
    bg-blue-700 border-2 border-blue-900 rounded-lg shadow-md`}
  />
);

// ========================
// MAIN GAME BOARD
// ========================
export const GameBoard = () => {
  const { gameCode, currentUser } = useGameStore();
  const [game, setGame] = useState<Game | null>(null);
  const [timer, setTimer] = useState(0);
  const [gameLog, setGameLog] = useState<string[]>([]);
  const roundOverRef = useRef(false);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Get current player's position
  const myPosition = game?.players.findIndex((p) => p.uid === currentUser?.uid) ?? 0;

  // Rotate view so current player is always at bottom
  const getRotatedPosition = (absolutePosition: number) => {
    return (absolutePosition - myPosition + 4) % 4;
  };

  // Get player at rotated position
  const getPlayerAtView = (viewPosition: number) => {
    const absolutePosition = (viewPosition + myPosition) % 4;
    return game?.players.find((p) => p.position === absolutePosition);
  };

  // Get hand at rotated position
  const getHandAtView = (viewPosition: number) => {
    if (!game) return [];
    const absolutePosition = (viewPosition + myPosition) % 4;
    return game.hands[absolutePosition] || [];
  };

  // My hand
  const myHand = game?.hands[myPosition] || [];

  // Check winning hand (4 identical cards)
  const checkWinningHand = (hand: Card[]) => {
    if (hand.length !== 4) return false;
    const rankCounts: Record<string, number> = {};
    hand.forEach((card) => {
      rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
    });
    return Object.values(rankCounts).some((count) => count === 4);
  };

  // Subscribe to game
  useEffect(() => {
    if (!gameCode) return;
    const gameRef = ref(db, `games/${gameCode}`);
    onValue(gameRef, (snapshot) => {
      if (snapshot.exists()) {
        const gameData = snapshot.val();
        setGame(gameData);

        if (gameData.roundOver || gameData.status !== 'playing') return;

        const currentP = gameData.currentPlayer;

        if (currentP === myPosition) {
          // My turn - start my timer
          startHumanTimer();
        } else {
          // Someone else's turn - auto-pass for them after 3 seconds
          clearAllTimers();
          aiTimeoutRef.current = setTimeout(async () => {
            if (roundOverRef.current) return;

            const hands = gameData.hands;
            if (!hands[currentP] || hands[currentP].length === 0) return;

            const newHands = hands.map((h: Card[]) => [...h]);
            const randomIdx = Math.floor(Math.random() * newHands[currentP].length);
            const cardToPass = newHands[currentP][randomIdx];
            newHands[currentP].splice(randomIdx, 1);

            const nextPlayer = (currentP + 1) % 4;
            newHands[nextPlayer].push(cardToPass);

            await update(ref(db, `games/${gameCode}`), {
              hands: newHands,
              currentPlayer: nextPlayer,
              updatedAt: Date.now(),
            });

            setGameLog((prev) => [
              ...prev,
              `Player ${currentP + 1} passed a card`,
            ]);
          }, 3000);
        }
      }
    });
    return () => off(gameRef);
  }, [gameCode, myPosition]);

  // Clear timers
  const clearAllTimers = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    timerIntervalRef.current = null;
    aiTimeoutRef.current = null;
  };

  // Start human 15-second timer
  const startHumanTimer = () => {
    clearAllTimers();
    setTimer(0);
    timerIntervalRef.current = setInterval(() => {
      setTimer((prev) => {
        if (roundOverRef.current) {
          clearAllTimers();
          return 0;
        }
        if (prev >= 15) {
          clearAllTimers();
          // Auto-pass random card
          if (game && game.hands[myPosition].length > 0) {
            const randomIdx = Math.floor(Math.random() * game.hands[myPosition].length);
            passCard(randomIdx);
          }
          return 0;
        }
        return prev + 1;
      });
    }, 1000);
  };

  // Get next player (clockwise)
  const getNextPlayer = (current: number) => (current + 1) % 4;

  // Pass card
  const passCard = async (cardIndex: number) => {
    if (!game || !gameCode) return;
    if (game.currentPlayer !== myPosition) return;
    if (roundOverRef.current) return;

    clearAllTimers();
    setTimer(0);

    const newHands = game.hands.map((h) => [...h]);
    const cardToPass = newHands[myPosition][cardIndex];
    newHands[myPosition].splice(cardIndex, 1);

    const nextPlayer = getNextPlayer(myPosition);
    newHands[nextPlayer].push(cardToPass);

    const nextIsHuman = nextPlayer === myPosition;

    await update(ref(db, `games/${gameCode}`), {
      hands: newHands,
      currentPlayer: nextPlayer,
      updatedAt: Date.now(),
    });

    setGameLog((prev) => [
      ...prev,
      `You passed ${cardToPass.rank}${cardToPass.suit}`,
    ]);

    if (!nextIsHuman) {
      // AI plays after 3 seconds (handled by other players' clients)
    }
  };

  // Handle Kawo call
  const handleKawoCall = async (type: 'kawo' | 'double' | 'full') => {
    if (!game || !gameCode || roundOverRef.current) return;

    clearAllTimers();
    roundOverRef.current = true;

    const myTeam = game.players[myPosition]?.team;
    const partnerPosition = game.players.findIndex(
      (p) => p.team === myTeam && p.position !== myPosition
    );
    const partnerHand = game.hands[partnerPosition];
    const myTeamKey = myTeam === 1 ? 'team1' : 'team2';
    const opponentTeamKey = myTeam === 1 ? 'team2' : 'team1';

    let pointsAwarded = 0;
    let toTeam = myTeamKey;
    let message = '';

    if (type === 'kawo') {
      if (checkWinningHand(partnerHand)) {
        pointsAwarded = 10;
        toTeam = myTeamKey;
        message = `KAWO! ${game.players[myPosition]?.username} called it! Team ${myTeam} scores 10 pts!`;
      } else {
        pointsAwarded = 10;
        toTeam = opponentTeamKey;
        message = `False KAWO! Opponents score 10 pts!`;
      }
    } else if (type === 'double') {
      if (checkWinningHand(myHand) && checkWinningHand(partnerHand)) {
        pointsAwarded = 20;
        toTeam = myTeamKey;
        message = `DOUBLE KAWO! Team ${myTeam} scores 20 pts!`;
      } else {
        pointsAwarded = 20;
        toTeam = opponentTeamKey;
        message = `False DOUBLE KAWO! Opponents score 20 pts!`;
      }
    } else if (type === 'full') {
      const allWinning = game.hands.every((h) => checkWinningHand(h));
      if (allWinning) {
        pointsAwarded = 40;
        toTeam = myTeamKey;
        message = `FULL KAWO! Team ${myTeam} scores 40 pts!`;
      } else {
        pointsAwarded = 40;
        toTeam = opponentTeamKey;
        message = `False FULL KAWO! Opponents score 40 pts!`;
      }
    }

    const newScores = { ...game.scores };
    newScores[toTeam as 'team1' | 'team2'] += pointsAwarded;

    const gameOver = newScores.team1 >= 100 || newScores.team2 >= 100;

    await update(ref(db, `games/${gameCode}`), {
      scores: newScores,
      roundOver: true,
      status: gameOver ? 'gameOver' : 'roundOver',
      updatedAt: Date.now(),
    });

    setGameLog((prev) => [...prev, message]);
  };

  // Signal partner
  const signalPartner = async () => {
    if (!game || !gameCode) return;
    if (!checkWinningHand(myHand)) return;
    setGameLog((prev) => [...prev, '🚨 You signaled your partner!']);
  };

  if (!game) {
    return (
      <div className="min-h-screen bg-green-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading game...</p>
      </div>
    );
  }

  const isMyTurn = game.currentPlayer === myPosition;
  const hasWinningHand = checkWinningHand(myHand);
  const gameOver = game.status === 'gameOver';
  const roundOver = game.roundOver;

  const topPlayer = getPlayerAtView(2);
  const leftPlayer = getPlayerAtView(1);
  const rightPlayer = getPlayerAtView(3);
  const topHand = getHandAtView(2);
  const leftHand = getHandAtView(1);
  const rightHand = getHandAtView(3);

  return (
    <div className="min-h-screen bg-green-900 p-4 flex flex-col">
      {/* Scores */}
      <div className="bg-black/30 rounded-xl p-3 mb-4 flex justify-between items-center">
        <div className="text-center">
          <p className="text-blue-300 text-xs">Team 1</p>
          <p className="text-white text-2xl font-bold">{game.scores.team1}</p>
        </div>
        <div className="text-center">
          <p className="text-white text-sm font-bold">KAWO 🎴</p>
          <p className="text-gray-300 text-xs">First to 100</p>
        </div>
        <div className="text-center">
          <p className="text-red-300 text-xs">Team 2</p>
          <p className="text-white text-2xl font-bold">{game.scores.team2}</p>
        </div>
      </div>

      {/* Top Player (Partner) */}
      <div className="flex flex-col items-center mb-4">
        <p className="text-white text-sm font-bold mb-1">
          {topPlayer?.username || 'Partner'} 
          <span className="text-blue-300 text-xs ml-1">(Partner)</span>
        </p>
        <div className="flex gap-1">
          {topHand.map((_, idx) => (
            <CardBack key={idx} small />
          ))}
        </div>
      </div>

      {/* Middle Row */}
      <div className="flex flex-1 items-center justify-between mb-4">
        {/* Left Player (Opponent) */}
        <div className="flex flex-col items-center">
          <div className="flex flex-col gap-1">
            {leftHand.map((_, idx) => (
              <CardBack key={idx} small />
            ))}
          </div>
          <p className="text-white text-xs mt-1">
            {leftPlayer?.username || 'Opponent'}
          </p>
        </div>

        {/* Center - Buttons */}
        <div className="flex flex-col gap-2 items-center">
          {/* Signal Partner */}
          <button
            onClick={signalPartner}
            disabled={roundOver || !hasWinningHand}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition text-xs"
          >
            👋 Signal
          </button>

          {/* Kawo Buttons */}
          <button
            onClick={() => handleKawoCall('kawo')}
            disabled={roundOver}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition text-xs"
          >
            KAWO!
          </button>
          <button
            onClick={() => handleKawoCall('double')}
            disabled={roundOver}
            className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition text-xs"
          >
            DOUBLE!
          </button>
          <button
            onClick={() => handleKawoCall('full')}
            disabled={roundOver}
            className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white font-bold py-2 px-3 rounded-lg transition text-xs"
          >
            FULL!
          </button>
        </div>

        {/* Right Player (Opponent) */}
        <div className="flex flex-col items-center">
          <div className="flex flex-col gap-1">
            {rightHand.map((_, idx) => (
              <CardBack key={idx} small />
            ))}
          </div>
          <p className="text-white text-xs mt-1">
            {rightPlayer?.username || 'Opponent'}
          </p>
        </div>
      </div>

      {/* My Hand (Bottom) */}
      <div className="flex flex-col items-center mb-4">
        {/* Timer */}
        {isMyTurn && !roundOver && (
          <div className={`text-lg font-bold mb-2 ${timer > 12 ? 'text-red-400' : 'text-green-300'}`}>
            {timer}s / 15s {timer > 12 ? '⚠️ HURRY!' : ''}
          </div>
        )}

        {/* My Cards */}
        <div className="flex gap-2 flex-wrap justify-center mb-2">
          {myHand.map((card, idx) => (
            <button
              key={idx}
              onClick={() => passCard(idx)}
              disabled={!isMyTurn || roundOver}
              className="hover:scale-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CardUI card={card} />
            </button>
          ))}
        </div>

        <p className="text-white text-sm font-bold">
          You ({game.players[myPosition]?.username})
          {isMyTurn && !roundOver && (
            <span className="ml-2 text-green-300 text-xs animate-pulse">← Your turn!</span>
          )}
        </p>
      </div>

      {/* Game Log */}
      <div className="bg-black/30 rounded-xl p-3 h-24 overflow-y-auto">
        {gameLog.length === 0 && (
          <p className="text-gray-400 text-xs">Game started! Pass your card...</p>
        )}
        {gameLog.map((log, idx) => (
          <p key={idx} className="text-gray-300 text-xs">{log}</p>
        ))}
      </div>

      {/* Round Over / Game Over */}
      {roundOver && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center">
          <div className="bg-gray-800 rounded-2xl p-8 text-center max-w-sm w-full mx-4">
            {gameOver ? (
              <>
                <p className="text-4xl mb-4">🏆</p>
                <h2 className="text-2xl font-bold text-white mb-2">Game Over!</h2>
                <p className="text-blue-300 text-lg mb-1">Team 1: {game.scores.team1} pts</p>
                <p className="text-red-300 text-lg mb-4">Team 2: {game.scores.team2} pts</p>
                <p className="text-yellow-400 font-bold text-xl mb-6">
                  {game.scores.team1 >= 100 ? 'Team 1 Wins! 🎉' : 'Team 2 Wins! 🎉'}
                </p>
                <button
                  onClick={async () => {
                    // Clear store FIRST to unmount GameBoard immediately
                    useGameStore.getState().setGameCode('');
                    useGameStore.getState().setCurrentGame(null);
                    // Then clean up Firebase
                    await update(ref(db, `games/${gameCode}`), {
                      scores: { team1: 0, team2: 0 },
                      status: 'waiting',
                      roundOver: false,
                      hands: [[], [], [], []],
                      updatedAt: Date.now(),
                    });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition"
                >
                  Back to Lobby
                </button>
              </>
            ) : (
              <>
                <p className="text-3xl mb-2">🎴</p>
                <h2 className="text-xl font-bold text-white mb-2">Round Over!</h2>
                <p className="text-blue-300">Team 1: {game.scores.team1} pts</p>
                <p className="text-red-300 mb-6">Team 2: {game.scores.team2} pts</p>
                {isHost && (
                  <button
                    onClick={async () => {
                      roundOverRef.current = false;
                      const newDealer = (game.dealer + 1) % 4;
                      const ranks: Card['rank'][] = ['A', 'K', 'Q', 'J'];
                      const suits: Card['suit'][] = ['♠', '♥', '♦', '♣'];
                      const deck: Card[] = [];
                      ranks.forEach((rank) => suits.forEach((suit) => deck.push({ rank, suit })));
                      for (let i = deck.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [deck[i], deck[j]] = [deck[j], deck[i]];
                      }
                      const hands: Card[][] = [[], [], [], []];
                      for (let i = 0; i < 4; i++) {
                        for (let j = 0; j < 4; j++) {
                          hands[i].push(deck[i * 4 + j]);
                        }
                      }
                      await update(ref(db, `games/${gameCode}`), {
                        hands,
                        dealer: newDealer,
                        currentPlayer: newDealer,
                        roundOver: false,
                        status: 'playing',
                        updatedAt: Date.now(),
                      });
                    }}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition"
                  >
                    🎴 Next Round
                  </button>
                )}
                {!isHost && (
                  <p className="text-gray-400 text-sm">Waiting for host to start next round...</p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};