import { useEffect, useState } from 'react'
import { auth } from './config/firebase'

function App() {
  const [firebaseStatus, setFirebaseStatus] = useState('Connecting...')

  useEffect(() => {
    try {
      if (auth) {
        setFirebaseStatus('Firebase Connected ✅')
      }
    } catch (error) {
      setFirebaseStatus('Firebase Error ❌')
    }
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">KAWO 🎴</h1>
        <p className="text-xl text-green-400">{firebaseStatus}</p>
      </div>
    </div>
  )
}

export default App