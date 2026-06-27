import { useAuth } from './hooks/useAuth';
import { useGameStore } from './store/gameStore';
import { LoginPage } from './components/Auth/LoginPage';
import { SignupPage } from './components/Auth/SignupPage';
import { LobbyPage } from './components/Game/LobbyPage';
import { useState } from 'react';

function App() {
  const { currentUser } = useAuth();
  const { gameCode } = useGameStore();
  const [showSignup, setShowSignup] = useState(false);

  // Not logged in → show auth pages
  if (!currentUser) {
    return showSignup ? (
      <SignupPage onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <LoginPage onSwitchToSignup={() => setShowSignup(true)} />
    );
  }

  // Logged in → show lobby
  return <LobbyPage />;
}

export default App;