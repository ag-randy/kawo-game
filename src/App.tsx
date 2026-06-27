import { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './components/Auth/LoginPage';
import { SignupPage } from './components/Auth/SignupPage';

function App() {
  const { currentUser } = useAuth();
  const [showSignup, setShowSignup] = useState(false);

  // Not logged in → show auth pages
  if (!currentUser) {
    return showSignup ? (
      <SignupPage onSwitchToLogin={() => setShowSignup(false)} />
    ) : (
      <LoginPage onSwitchToSignup={() => setShowSignup(true)} />
    );
  }

  // Logged in → show game (placeholder for now)
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-white mb-4">KAWO 🎴</h1>
        <p className="text-green-400 text-xl mb-2">
          Welcome, {currentUser.displayName || currentUser.email}!
        </p>
        <p className="text-gray-400">Game lobby coming soon...</p>
      </div>
    </div>
  );
}

export default App;