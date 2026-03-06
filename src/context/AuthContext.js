// AuthContext.js — Provides authentication state and the login modal toggle
// to the entire React tree via the useAuth() hook.
import { createContext, useContext, useEffect, useState } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
} from 'firebase/auth';
import { auth } from '../firebase';

const AuthContext = createContext(null);

// useAuth — consume auth state anywhere without importing AuthContext directly
export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    // Firebase User object when logged in, null when logged out
    const [currentUser, setCurrentUser] = useState(null);

    // True while Firebase is resolving the persisted session from localStorage.
    // Children are hidden until this resolves to prevent a redirect flicker for
    // already-authenticated users.
    const [loading, setLoading] = useState(true);

    // Controls the LoginModal visibility from anywhere in the tree
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    // Subscribe to Firebase auth state changes. Fires immediately on mount
    // with the persisted session (if any), then again on login/logout.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });
        return unsubscribe; // cleanup on unmount
    }, []);

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    function openLoginModal()  { setLoginModalOpen(true);  }
    function closeLoginModal() { setLoginModalOpen(false); }

    // Forces all context consumers (Header, Dashboard, etc.) to re-render so
    // they pick up the mutated displayName after updateProfile() is called.
    const [, forceUpdate] = useState(0);
    function refreshCurrentUser() { forceUpdate(n => n + 1); }

    const value = {
        currentUser,
        login,
        logout,
        loginModalOpen,
        openLoginModal,
        closeLoginModal,
        refreshCurrentUser,
    };

    // Render nothing until Firebase has resolved the initial auth state
    if (loading) return null;

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
