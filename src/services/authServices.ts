import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth } from '../config/firebase';

const googleProvider = new GoogleAuthProvider();

// ========================
// REGISTER WITH EMAIL
// ========================
export const registerWithEmail = async (
  email: string,
  password: string,
  username: string
) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  // Set display name
  await updateProfile(userCredential.user, {
    displayName: username,
  });

  return userCredential.user;
};

// ========================
// LOGIN WITH EMAIL
// ========================
export const loginWithEmail = async (email: string, password: string) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
};

// ========================
// LOGIN WITH GOOGLE
// ========================
export const loginWithGoogle = async () => {
  const userCredential = await signInWithPopup(auth, googleProvider);
  return userCredential.user;
};

// ========================
// LOGOUT
// ========================
export const logout = async () => {
  await signOut(auth);
};