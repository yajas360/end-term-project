import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch additional profile from Firestore
          const profileDoc = await getDoc(doc(db, 'userProfiles', firebaseUser.uid));
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            profile: profileDoc.exists() ? profileDoc.data() : null,
          });
        } catch {
          // Firestore might not be ready (rules, not created yet) — still authenticate the user
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            profile: null,
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = useCallback(async (email, password, displayName) => {
    setError('');
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName });
    // Create initial Firestore profile
    await setDoc(doc(db, 'userProfiles', cred.user.uid), {
      userId: cred.user.uid,
      displayName,
      email,
      age: '',
      weight: '',
      bloodType: '',
      allergies: [],
      conditions: [],
      emergencyContact: '',
      doctorName: '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return cred;
  }, []);

  const login = useCallback(async (email, password) => {
    setError('');
    return signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    // Create profile if first login
    const profileRef = doc(db, 'userProfiles', cred.user.uid);
    const profileSnap = await getDoc(profileRef);
    if (!profileSnap.exists()) {
      await setDoc(profileRef, {
        userId: cred.user.uid,
        displayName: cred.user.displayName,
        email: cred.user.email,
        age: '',
        weight: '',
        bloodType: '',
        allergies: [],
        conditions: [],
        emergencyContact: '',
        doctorName: '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return cred;
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  const resetPassword = useCallback((email) => sendPasswordResetEmail(auth, email), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, setError, signup, login, loginWithGoogle, logout, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
