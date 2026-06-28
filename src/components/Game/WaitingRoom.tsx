import { useEffect, useState } from 'react';
import { subscribeToGame, startGame, pickTeammate } from '../../services/gameService';
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

export const WaitingRoom = () => {
  const { gameCode, currentUser, setCurrentGame } = useGameStore();
  const [game, setGame] = useState<Game | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [selectedTeammate, setSelectedTeammate] = useState<string>('');

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

  const handlePickTeammate = async () => {
    if (!gameCode || !selectedTeammate) return;
    try {
      await pickTeammate(gameCode, selectedTeammate);
    } catch {
      console.error('Failed to pick teammate');
    }
  };

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
  const allPlayersJoined = game?.players.length === 4;
  const teamsSelected = game?.status === 'teamsSelected';

  if (!game) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Loading game...</p>
      </div>
    );
  }

  // ========================
  // TEAMS SELECTED VIEW
  // ========================
  if (teamsSelected) {
    const team1 = game.players.filter((p) => p.team === 1);
    const team2 = game.players.filter((p) => p.team === 2);

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-4xl font-bold text-white mb-1">KAWO 🎴</h1>
            <p className="text-gray-400">Teams are set!</p>
          </div>

          {/* Team 1 */}
          <div className="bg-blue-600/20 border border-blue-500 rounded-xl p-4 mb-4">
            <p className="text-blue-400 font-bold text-center mb-3">Team 1</p>
            {team1.map((p) => (
              <div key={p.uid} className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                  {p.username[0].toUpperCase()}
                </div>
                <p className="text-white font-bold">
                  {p.username}
                  {p.uid === currentUser?.uid && (
                    <span className="ml-2 text-xs text-green-400">(You)</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Team 2 */}
          <div className="bg-red-600/20 border border-red-500 rounded-xl p-4 mb-6">
            <p className="text-red-400 font-bold text-center mb-3">Team 2</p>
            {team2.map((p) => (
              <div key={p.uid} className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                  {p.username[0].toUpperCase()}
                </div>
                <p className="text-white font-bold">
                  {p.username}
                  {p.uid === currentUser?.uid && (
                    <span className="ml-2 text-xs text-green-400">(You)</span>
                  )}
                </p>
              </div>
            ))}
          </div>

          {/* Start Button - host only */}
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={isStarting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-xl transition text-lg"
            >
              {isStarting ? 'Starting...' : '🎮 Start Game!'}
            </button>
          ) : (
            <p className="text-center text-gray-400">
              Waiting for host to start...
            </p>
          )}
        </div>
      </div>
    );
  }

  // ========================
  // WAITING / TEAM SELECTION VIEW
  // ========================
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-white mb-1">KAWO 🎴</h1>
          <p className="text-gray-400">
            {allPlayersJoined ? 'Pick your teammate!' : 'Waiting for players...'}
          </p>
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
          {game.players.map((player) => (
            <div
              key={player.uid}
              className={`flex items-center justify-between p-3 rounded-xl transition ${
                isHost && allPlayersJoined && player.uid !== currentUser?.uid
                  ? selectedTeammate === player.uid
                    ? 'bg-blue-600/40 border-2 border-blue-500 cursor-pointer'
                    : 'bg-gray-700 hover:bg-gray-600 cursor-pointer border-2 border-transparent'
                  : 'bg-gray-700'
              }`}
              onClick={() => {
                if (isHost && allPlayersJoined && player.uid !== currentUser?.uid) {
                  setSelectedTeammate(player.uid);
                }
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
                  {player.username[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-white font-bold">
                    {player.username}
                    {player.uid === currentUser?.uid && (
                      <span className="ml-2 text-xs text-green-400">(You)</span>
                    )}
                    {player.uid === game.players[0]?.uid && (
                      <span className="ml-2 text-xs text-yellow-400">👑 Host</span>
                    )}
                  </p>
                  {isHost && allPlayersJoined && player.uid !== currentUser?.uid && (
                    <p className="text-xs text-blue-400">
                      {selectedTeammate === player.uid ? '✓ Selected as teammate' : 'Click to pick as teammate'}
                    </p>
                  )}
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: 4 - game.players.length }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-700/40 border border-dashed border-gray-600"
            >
              <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 text-lg">
                ?
              </div>
              <p className="text-gray-500">Waiting...</p>
            </div>
          ))}
        </div>

        {/* Player Count */}
        <p className="text-center text-gray-400 text-sm mb-4">
          {game.players.length}/4 players connected
        </p>

        {/* Confirm Teammate - host only */}
        {isHost && allPlayersJoined && (
          <button
            onClick={handlePickTeammate}
            disabled={!selectedTeammate}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition text-lg"
          >
            {selectedTeammate ? '✓ Confirm Teammate' : 'Select your teammate'}
          </button>
        )}

        {!isHost && (
          <p className="text-center text-gray-400 text-sm">
            {allPlayersJoined
              ? 'Waiting for host to pick teams...'
              : 'Waiting for more players...'}
          </p>
        )}
      </div>
    </div>
  );
};