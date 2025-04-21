import React, { createContext, useState, useContext, useEffect } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useRouter } from 'expo-router';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  serverTimestamp
} from 'firebase/firestore';

// Initialize Firestore
const db = getFirestore();

// Route constants
const ROUTES = {
  MAIN: '/(tabs)',
  SPLASH: '/splash',
};

// Define types
type UserProfile = {
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
};

type User = {
  uid: string;
  email: string | null;
  firstName?: string;
  lastName?: string;
  contactNumber?: string;
} | null;

type AuthContextType = {
  user: User;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
};

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper to map Firebase errors to user-friendly messages
const getErrorMessage = (error: any): string => {
  const code = error.code || '';
  switch (code) {
    case 'auth/user-not-found':
      return 'No user found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/email-already-in-use':
      return 'This email is already registered.';
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/weak-password':
      return 'Password is too weak.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        setUserProfile(data);
        return data;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        const profile = await fetchUserProfile(authUser.uid);
        setUser({
          uid: authUser.uid,
          email: authUser.email,
          firstName: profile?.firstName,
          lastName: profile?.lastName,
          contactNumber: profile?.contactNumber
        });
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in with email and password
  const login = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace(ROUTES.MAIN as any);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  };

  // Create user with email and password
  const register = async (email: string, password: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  };

  // Update user profile
  const updateUserProfile = async (profile: UserProfile) => {
    try {
      if (!auth.currentUser) throw new Error("No authenticated user");

      const { uid } = auth.currentUser;

      const fullName = `${profile.firstName} ${profile.lastName}`.trim();
      if ((auth.currentUser.displayName || '').trim() !== fullName) {
        await updateProfile(auth.currentUser, {
          displayName: fullName,
        });
      }

      await setDoc(doc(db, 'users', uid), {
        ...profile,
        createdAt: serverTimestamp(),
      });

      setUserProfile(profile);

      router.replace(ROUTES.MAIN as any);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      router.replace(ROUTES.SPLASH as any);
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, login, register, logout, updateUserProfile }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
