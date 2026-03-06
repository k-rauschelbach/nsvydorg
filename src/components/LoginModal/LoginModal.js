// LoginModal.js — Login modal overlay.
// Rendered once at the App level. Visibility is controlled via AuthContext
// (loginModalOpen / closeLoginModal). The modal closes on backdrop click,
// Escape key, successful login, or the × button.
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './LoginModal.module.css';

// Map Firebase error codes to user-facing messages.
// Wrong-email and wrong-password intentionally share one message to
// avoid revealing which accounts exist (account enumeration prevention).
const ERROR_MESSAGES = {
    'auth/invalid-credential':     'Incorrect email or password.',
    'auth/user-not-found':         'Incorrect email or password.',
    'auth/wrong-password':         'Incorrect email or password.',
    'auth/invalid-email':          'Please enter a valid email address.',
    'auth/too-many-requests':      'Too many failed attempts. Please try again later.',
    'auth/user-disabled':          'This account has been disabled. Contact an administrator.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
    // Fires when Email/Password sign-in is not enabled in the Firebase console
    'auth/operation-not-allowed':  'Member login is not yet configured. Enable Email/Password sign-in in the Firebase console.',
};

function LoginModal() {
    const { loginModalOpen, closeLoginModal, login } = useAuth();
    const navigate = useNavigate();

    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [error,    setError]    = useState('');
    const [loading,  setLoading]  = useState(false);

    // Close and reset form state
    const handleClose = useCallback(() => {
        closeLoginModal();
        setEmail('');
        setPassword('');
        setError('');
        setLoading(false);
    }, [closeLoginModal]);

    // Close on Escape key
    useEffect(() => {
        if (!loginModalOpen) return;
        function onKeyDown(e) {
            if (e.key === 'Escape') handleClose();
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [loginModalOpen, handleClose]);

    // Prevent body scroll while modal is open
    useEffect(() => {
        if (loginModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [loginModalOpen]);

    // Close on backdrop click (not on modal panel click)
    function handleBackdropClick(e) {
        if (e.target === e.currentTarget) handleClose();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            handleClose();
        } catch (err) {
            // Log the raw Firebase error code to the browser console for diagnosis
            console.error('Login error:', err.code, err.message);
            const message =
                ERROR_MESSAGES[err.code] ||
                `An unexpected error occurred (${err.code ?? 'unknown'}). Please try again.`;
            setError(message);
        } finally {
            setLoading(false);
        }
    }

    // Nothing rendered when closed — no DOM overhead
    if (!loginModalOpen) return null;

    return (
        <div
            className={styles.backdrop}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-label="Member Login"
        >
            <div className={styles.modal}>

                {/* Close button */}
                <button
                    className={styles.closeBtn}
                    onClick={handleClose}
                    aria-label="Close login dialog"
                >
                    &times;
                </button>

                {/* Modal heading */}
                <div className={styles.modalHeader}>
                    <h2>Member Login</h2>
                    <p>Northern Shenandoah Valley Young Democrats</p>
                </div>

                {/* Login form */}
                <form className={styles.form} onSubmit={handleSubmit} noValidate>

                    <div className={styles.formGroup}>
                        <label htmlFor="login-email">Email Address</label>
                        <input
                            type="email"
                            id="login-email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                            required
                            disabled={loading}
                            autoFocus
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="login-password">Password</label>
                        <input
                            type="password"
                            id="login-password"
                            placeholder="Your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            disabled={loading}
                        />
                    </div>

                    {/* Error — role="alert" announces to screen readers on appear */}
                    {error && (
                        <p className={styles.errorMessage} role="alert">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Signing in\u2026' : 'Sign In'}
                    </button>

                </form>

            </div>
        </div>
    );
}

export default LoginModal;
