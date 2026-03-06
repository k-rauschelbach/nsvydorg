// UpdatePasswordForm.js — Change-password form inside the member dashboard.
// Re-authenticates the user with their current password before updating,
// satisfying Firebase's security requirement for sensitive account operations.
import { useState } from 'react';
import {
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
} from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
// Shares the same visual style as AddMemberForm — no separate CSS needed
import styles from './AddMemberForm.module.css';

// Map Firebase error codes to user-friendly messages.
const PASSWORD_ERRORS = {
    'auth/wrong-password':         'Current password is incorrect.',
    'auth/invalid-credential':     'Current password is incorrect.',
    'auth/too-many-requests':      'Too many failed attempts. Please try again later.',
    'auth/weak-password':          'New password must be at least 6 characters.',
    'auth/requires-recent-login':  'Please sign out and sign back in, then try again.',
    'auth/network-request-failed': 'Network error. Please check your connection and try again.',
};

function UpdatePasswordForm() {
    const { currentUser } = useAuth();

    const [currentPw,   setCurrentPw]   = useState('');
    const [newPw,       setNewPw]       = useState('');
    const [confirmPw,   setConfirmPw]   = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew,     setShowNew]     = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading,     setLoading]     = useState(false);
    const [error,       setError]       = useState('');
    const [success,     setSuccess]     = useState('');

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (newPw.length < 6) {
            setError('New password must be at least 6 characters.');
            return;
        }
        if (newPw !== confirmPw) {
            setError('New passwords do not match.');
            return;
        }

        setLoading(true);
        try {
            // Re-authenticate — Firebase requires this before password changes
            const credential = EmailAuthProvider.credential(currentUser.email, currentPw);
            await reauthenticateWithCredential(currentUser, credential);

            await updatePassword(currentUser, newPw);

            setSuccess('Password updated successfully.');
            setCurrentPw('');
            setNewPw('');
            setConfirmPw('');
            setShowCurrent(false);
            setShowNew(false);
            setShowConfirm(false);
        } catch (err) {
            setError(
                PASSWORD_ERRORS[err.code] ||
                `An unexpected error occurred (${err.code ?? 'unknown'}). Please try again.`
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Change Password</h2>
            <p className={styles.sectionSubtitle}>
                Enter your current password to confirm your identity, then choose a new one.
            </p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>

                {/* Current Password */}
                <div className={styles.formGroup}>
                    <label htmlFor="update-current-password">Current Password</label>
                    <div className={styles.passwordWrapper}>
                        <input
                            type={showCurrent ? 'text' : 'password'}
                            id="update-current-password"
                            placeholder="Your current password"
                            value={currentPw}
                            onChange={e => setCurrentPw(e.target.value)}
                            autoComplete="current-password"
                            required
                            disabled={loading}
                        />
                        <button
                            type="button"
                            className={styles.showToggle}
                            onClick={() => setShowCurrent(v => !v)}
                            aria-label={showCurrent ? 'Hide password' : 'Show password'}
                        >
                            {showCurrent ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

                {/* New Password */}
                <div className={styles.formGroup}>
                    <label htmlFor="update-new-password">New Password</label>
                    <div className={styles.passwordWrapper}>
                        <input
                            type={showNew ? 'text' : 'password'}
                            id="update-new-password"
                            placeholder="Min. 6 characters"
                            value={newPw}
                            onChange={e => setNewPw(e.target.value)}
                            autoComplete="new-password"
                            required
                            disabled={loading}
                        />
                        <button
                            type="button"
                            className={styles.showToggle}
                            onClick={() => setShowNew(v => !v)}
                            aria-label={showNew ? 'Hide password' : 'Show password'}
                        >
                            {showNew ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

                {/* Confirm New Password */}
                <div className={styles.formGroup}>
                    <label htmlFor="update-confirm-password">Confirm New Password</label>
                    <div className={styles.passwordWrapper}>
                        <input
                            type={showConfirm ? 'text' : 'password'}
                            id="update-confirm-password"
                            placeholder="Repeat new password"
                            value={confirmPw}
                            onChange={e => setConfirmPw(e.target.value)}
                            autoComplete="new-password"
                            required
                            disabled={loading}
                        />
                        <button
                            type="button"
                            className={styles.showToggle}
                            onClick={() => setShowConfirm(v => !v)}
                            aria-label={showConfirm ? 'Hide password' : 'Show password'}
                        >
                            {showConfirm ? 'Hide' : 'Show'}
                        </button>
                    </div>
                </div>

                {error   && <p className={styles.errorMessage}   role="alert">{error}</p>}
                {success && <p className={styles.successMessage} role="status">{success}</p>}

                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                >
                    {loading ? 'Updating\u2026' : 'Update Password'}
                </button>

            </form>
        </section>
    );
}

export default UpdatePasswordForm;
