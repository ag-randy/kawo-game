import { useState } from 'react';
import { createGame, joinGame } from '../../services/gameService';
import { useGameStore } from '../../store/gameStore';
import { logout } from '../../services/authService';

export const LobbyPage = () => {
  const { currentUser, setGameCode, gameCode } = useGameStore();
  const [joinCode, setJoinCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateGame = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setError('');

    try {
      const code = await createGame(currentUser.uid, currentUser.displayName || 'Player');
      setGameCode(code);
    } catch {
      setError('Failed to create game. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinGame = async () => {
    if (!currentUser || !joinCode.trim()) return;
    setIsLoading(true);
    setError('');

    try {
      const result = await joinGame(
        joinCode.toUpperCase().trim(),
        currentUser.uid,
        currentUser.displayName || 'Player'
      );

      if (result.success) {
        setGameCode(joinCode.toUpperCase().trim());
      } else {
        setError(result.message);
      }
    } catch {
      setError('Failed to join game. Try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  // If in a game, show waiting room
if (gameCode) {
  return null;
}

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-8 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">KAWO 🎴</h1>
          <p className="text-green-400">
            Welcome, {currentUser?.displayName || currentUser?.email}!
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-400 rounded-lg p-3 mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Create Game */}
        <button
          onClick={handleCreateGame}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold py-4 rounded-xl transition mb-4 text-lg"
        >
          {isLoading ? 'Creating...' : '🎮 Create Game'}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-600" />
          <span className="text-gray-400 text-sm">or</span>
          <div className="flex-1 h-px bg-gray-600" />
        </div>

        {/* Join Game */}
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="Enter game code..."
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            maxLength={11}
            className="flex-1 bg-gray-700 text-white placeholder-gray-400 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase tracking-widest"
          />
          <button
            onClick={handleJoinGame}
            disabled={isLoading || !joinCode.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold px-4 rounded-lg transition"
          >
            Join
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full text-gray-400 hover:text-white transition text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  );
};