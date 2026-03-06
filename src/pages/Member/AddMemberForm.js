// AddMemberForm.js — Officer-only modal for creating new Firebase Auth members.
// Rendered from Dashboard.js only when userRole === 'officer'.
// Uses a Vercel serverless function (/api/create-user) so the current
// user's session is never interrupted by the creation of the new account.
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { IconEye, IconEyeOff, IconClose } from '../../components/Icons/Icons';
import styles from './AddMemberForm.module.css';

function AddMemberForm({ isOpen, onClose }) {
    const { currentUser } = useAuth();

    const [firstName, setFirstName] = useState('');
    const [lastName,  setLastName]  = useState('');
    const [email,     setEmail]     = useState('');
    const [password,  setPassword]  = useState('');
    const [role,      setRole]      = useState('member');
    const [showPw,    setShowPw]    = useState(false);
    const [loading,   setLoading]   = useState(false);
    const [error,     setError]     = useState('');
    const [success,   setSuccess]   = useState('');

    // Focus the first input when the modal opens
    const firstInputRef = useRef(null);
    useEffect(() => {
        if (isOpen) {
            // Small timeout lets the modal finish rendering before focusing
            const id = setTimeout(() => firstInputRef.current?.focus(), 50);
            return () => clearTimeout(id);
        }
    }, [isOpen]);

    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        function onKeyDown(e) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    // Reset form when the modal is closed (after success or manual close)
    function resetForm() {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPassword('');
        setRole('member');
        setShowPw(false);
        setError('');
        setSuccess('');
    }

    function handleClose() {
        resetForm();
        onClose();
    }

    // Prevent click inside the modal panel from bubbling up to the backdrop
    function handlePanelClick(e) {
        e.stopPropagation();
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');

        const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();

        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }

        setLoading(true);

        try {
            // Get a fresh ID token to prove to the server we're an officer
            const idToken = await currentUser.getIdToken();

            const res = await fetch('/api/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    email,
                    password,
                    role,
                    ...(displayName && { displayName }),
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to create member. Please try again.');
            } else {
                const nameLabel = displayName || email;
                setSuccess(`Account created for ${nameLabel}. Share the password with them securely.`);
                // Auto-close after a short delay so the user sees the confirmation
                setTimeout(() => {
                    handleClose();
                }, 1500);
            }
        } catch {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }

    // Don't render anything when closed — keeps DOM clean
    if (!isOpen) return null;

    return (
        <div
            className={styles.backdrop}
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
            aria-label="Add New Member"
        >
            <div className={styles.modal} onClick={handlePanelClick}>

                {/* Close button */}
                <button
                    className={styles.closeBtn}
                    onClick={handleClose}
                    aria-label="Close"
                    type="button"
                >
                    <IconClose size={20} />
                </button>

                {/* Modal header */}
                <div className={styles.modalHeader}>
                    <h2 className={styles.sectionTitle}>Add New Member</h2>
                    <p className={styles.sectionSubtitle}>
                        Creates a login account for a new officer or member. Share the
                        temporary password with them directly — they can update it later.
                    </p>
                </div>

                <form className={styles.form} onSubmit={handleSubmit} noValidate>

                    {/* First + Last Name */}
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="new-member-first-name">First Name</label>
                            <input
                                ref={firstInputRef}
                                type="text"
                                id="new-member-first-name"
                                placeholder="Jane"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                autoComplete="off"
                                disabled={loading}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="new-member-last-name">Last Name</label>
                            <input
                                type="text"
                                id="new-member-last-name"
                                placeholder="Smith"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                autoComplete="off"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    {/* Email + Password */}
                    <div className={styles.formRow}>
                        <div className={styles.formGroup}>
                            <label htmlFor="new-member-email">Email Address</label>
                            <input
                                type="email"
                                id="new-member-email"
                                placeholder="member@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="off"
                                required
                                disabled={loading}
                            />
                        </div>

                        {/* Password with show/hide toggle */}
                        <div className={styles.formGroup}>
                            <label htmlFor="new-member-password">Temporary Password</label>
                            <div className={styles.passwordWrapper}>
                                <input
                                    type={showPw ? 'text' : 'password'}
                                    id="new-member-password"
                                    placeholder="Min. 6 characters"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="new-password"
                                    required
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    className={styles.showToggle}
                                    onClick={() => setShowPw(v => !v)}
                                    aria-label={showPw ? 'Hide password' : 'Show password'}
                                >
                                    {showPw ? <IconEyeOff size={16} /> : <IconEye size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Role selector */}
                    <div className={styles.formGroup}>
                        <label htmlFor="new-member-role">Role</label>
                        <select
                            id="new-member-role"
                            className={styles.roleSelect}
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            disabled={loading}
                        >
                            <option value="member">Member</option>
                            <option value="officer">Officer</option>
                        </select>
                    </div>

                    {error   && <p className={styles.errorMessage}   role="alert">{error}</p>}
                    {success && <p className={styles.successMessage} role="status">{success}</p>}

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={loading}
                    >
                        {loading ? 'Creating\u2026' : 'Create Account'}
                    </button>

                </form>
            </div>
        </div>
    );
}

export default AddMemberForm;
