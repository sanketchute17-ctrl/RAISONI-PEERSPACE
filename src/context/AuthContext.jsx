import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        setIsAnonymous(false);

        // Subscribe to real-time profile changes from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const normalizedRole = (data.role || 'student').toLowerCase().trim();
            setUserProfile(data);
            setRole(normalizedRole);
          } else {
            // Fallback profile if Firestore document does not exist yet
            const defaultProfile = {
              uid: user.uid,
              email: user.email,
              fullName: user.displayName || (user.email ? user.email.split('@')[0] : 'Student'),
              role: 'student',
              department: 'Not provided',
              branch: 'Not provided',
              regNo: 'Not provided',
              dob: '',
              about: '',
              profilePicUrl: user.photoURL || ''
            };
            setUserProfile(defaultProfile);
            setRole('student');
          }
          setLoading(false);
        }, (error) => {
          console.error("AuthContext Firestore Error:", error);
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setRole(null);
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const loginAsGuest = (guestRole = 'student') => {
    setIsAnonymous(true);
    setCurrentUser(null);
    const normalizedRole = guestRole.toLowerCase().trim();
    setRole(normalizedRole);
    setUserProfile({
      uid: 'guest_user',
      fullName: 'Ghost Protocol',
      email: 'guest@raisoni.ac.in',
      role: normalizedRole,
      department: 'Nagpur Campus',
      branch: 'Nagpur Campus',
      regNo: 'GUEST-001',
      dob: 'Not provided',
      about: 'Anonymous Guest User Session',
      profilePicUrl: ''
    });
    setLoading(false);
  };

  const updateProfile = async (updates) => {
    if (!currentUser) return;
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, updates, { merge: true });
      setUserProfile((prev) => ({ ...prev, ...updates }));
      return { success: true };
    } catch (error) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    setIsAnonymous(false);
    setCurrentUser(null);
    setUserProfile(null);
    setRole(null);
    try {
      await signOut(auth);
    } catch (e) {
      console.error("SignOut error:", e);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      role,
      loading,
      isAnonymous,
      loginAsGuest,
      updateProfile,
      logout,
      setUserProfile,
      setRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
