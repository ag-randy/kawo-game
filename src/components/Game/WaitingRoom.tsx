import { useEffect, useState } from 'react';
import { subscribeToGame, startGame } from '../../services/gameService';
import { useGameStore } from '../../store/gameStore';

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
  status: string;
  scores: { team1: number; team2: number };
}

const POSITIONS = ['Bottom (You)', 'Left', 'Top', 'Right'];
const TEAM_COLORS = ['', 'text-blue-400', 'text-red-400'];

export const WaitingRoom = () => {
  const { gameCode, currentUser, setCurrentGame } = useGameStore();
  const [game, setGame] = useState<Game | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    if (!gameCode) return;

    const unsubscribe = subscribeToGame(gameCode, (gameData) => {
      if (gameData) {
        setGame(gameData as Game);
        setCurrentGame(gameData);
      }
    });

    return () => unsubscribe();
  }, [gameCode, setCurrentGame]);

  const handleStartGame = async () => {
    if (!gameCode) return;
    setIsStarting(true);
    try {
      await startGame(gameCode);
    } catch {
      setIsStarting(false);
    }
  };

  const isHost = game?.players[0]?.uid === currentUser?.uid;
  const canStart = game?.players.length === 4;

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading game...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-1">KAWO 🎴</h1>
          <p className="text-gray-400">Waiting for players...</p>
        </div>

        {/* Game Code */}
        <div className="bg-gray-700 rounded-xl p-4 mb-6 text-center">
          <p className="text-gray-400 text-xs mb-1">Game Code</p>
          <p className="text-2xl font-bold text-blue-400 tracking-widest">
            {gameCode}
          </p>
          <button
            onClick={() => navigator.clipboard.writeText(gameCode)}
            className="mt-1 text-xs text-gray-400 hover:text-white transition"
          >
            📋 Copy
          </button>
        </div>

        {/* Players List */}
        <div className="space-y-3 mb-6">
          {[0, 1, 2, 3].map((position) => {
            const player = game.players.find((p) => p.position === position);
            return (
              <div
                key={position}
                className={`flex items-center justify-between p-3 rounded-xl ${
                  player ? 'bg-gray-700' : 'bg-gray-700/40 border border-dashed border-gray-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      player ? 'bg-blue-600 text-white' : 'bg-gray-600 text-gray-400'
                    }`}
                  >
                    {player ? player.username[0].toUpperCase() : '?'}
                  </div>
                  <div>
                    <p className={`font-bold ${player ? 'text-white' : 'text-gray-500'}`}>
                      {player ? player.username : 'Waiting...'}
                      {player?.uid === currentUser?.uid && (
                        <span className="ml-2 text-xs text-green-400">(You)</span>
                      )}
                      {position === 0 && player && (
                        <span className="ml-2 text-xs text-yellow-400">👑 Host</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">{POSITIONS[position]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-xs font-bold ${TEAM_COLORS[player?.team || 0]}`}>
                    {player ? `Team ${player.team}` : ''}
                  </p>
                  <div className={`w-2 h-2 rounded-full ml-auto mt-1 ${player ? 'bg-green-400' : 'bg-gray-600'}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Player Count */}
        <p className="text-center text-gray-400 text-sm mb-4">
          {game.players.length}/4 players connected
        </p>

        {/* Start Button - only host sees it */}
        {isHost && (
          <button
            onClick={handleStartGame}
            disabled={!canStart || isStarting}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition text-lg mb-3"
          >
            {isStarting
              ? 'Starting...'
              : canStart
              ? '🎮 Start Game!'
              : `Need ${4 - game.players.length} more player(s)`}
          </button>
        )}

        {!isHost && (
          <p className="text-center text-gray-400 text-sm mb-3">
            Waiting for host to start the game...
          </p>
        )}
      </div>
    </div>
  );
};