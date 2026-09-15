import { useAuth } from './hooks/useAuth';
import { useGameStore } from './store/gameStore';
import { LoginPage } from './components/Auth/LoginPage';
import { SignupPage } from './components/Auth/SignupPage';
import { LobbyPage } from './components/Game/LobbyPage';
import { WaitingRoom } from './components/Game/WaitingRoom';
import { GameBoard } from './components/Game/GameBoard';
import { useState } from 'react';

function App() {
  const { currentUser } = useAuth();
  const { gameCode, currentGame } = useGameStore();
  const [showSignup, setShowSignup] = useState(false);

  // Not logged in → show auth pages
  if (!currentUser) {
    return showSignup ? (
      <SignupPage onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <LoginPage onSwitchToSignup={() => setShowSignup(true)} />
    );
  }

  // Game is playing, round just ended, or game just ended → show game board
  // (GameBoard handles its own Round Over / Game Over modals internally)
  if (
    gameCode &&
    (currentGame?.status === 'playing' ||
      currentGame?.status === 'roundOver' ||
      currentGame?.status === 'gameOver')
  ) {
    return <GameBoard />;
  }
  
  // In a game → show waiting room (waiting, teamsSelected)
  if (gameCode && (currentGame?.status === 'waiting' || currentGame?.status === 'teamsSelected')) {
    return <WaitingRoom />;
  }

  // Logged in → show lobby
  return <LobbyPage />;
}

export default App;