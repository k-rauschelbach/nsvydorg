// AuthContext.js — Provides authentication state and the login modal toggle
// to the entire React tree via the useAuth() hook.
import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
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

// ── Inactivity timeout settings ───────────────────────────────────────────────
// After IDLE_TIMEOUT_MS of no mouse/keyboard/touch activity the user is
// automatically signed out. The interval polls every CHECK_INTERVAL_MS.
const IDLE_TIMEOUT_MS   = 30 * 60 * 1000; // 30 minutes
const CHECK_INTERVAL_MS =      60 * 1000; // check every 60 seconds
const ACTIVITY_EVENTS   = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

export function AuthProvider({ children }) {
    // Firebase User object when logged in, null when logged out
    const [currentUser, setCurrentUser] = useState(null);

    // True while Firebase is resolving the persisted session from localStorage.
    // Children are hidden until this resolves to prevent a redirect flicker for
    // already-authenticated users.
    const [loading, setLoading] = useState(true);

    // Controls the LoginModal visibility from anywhere in the tree
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    // ── Idle timeout refs ─────────────────────────────────────────────────────
    // useRef instead of useState — updating these on every mouse move must
    // NOT trigger re-renders, so we mutate the ref directly.
    const lastActivityRef = useRef(Date.now());
    const intervalRef     = useRef(null);

    // Stable callback — same function reference across renders so
    // addEventListener / removeEventListener always get the same handle.
    const resetIdleTimer = useCallback(() => {
        lastActivityRef.current = Date.now();
    }, []);

    // Start monitoring when logged in; tear down when logged out or unmounted.
    useEffect(() => {
        if (!currentUser) {
            // User signed out — clear the interval and stop listening
            clearInterval(intervalRef.current);
            ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetIdleTimer));
            return;
        }

        // User just logged in — reset the activity clock
        lastActivityRef.current = Date.now();

        // Track any interaction as activity
        ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, resetIdleTimer));

        // Poll once per minute; sign out when idle threshold is exceeded
        intervalRef.current = setInterval(() => {
            if (Date.now() - lastActivityRef.current >= IDLE_TIMEOUT_MS) {
                signOut(auth); // triggers onAuthStateChanged → currentUser = null
            }
        }, CHECK_INTERVAL_MS);

        return () => {
            clearInterval(intervalRef.current);
            ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, resetIdleTimer));
        };
    }, [currentUser, resetIdleTimer]);

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
