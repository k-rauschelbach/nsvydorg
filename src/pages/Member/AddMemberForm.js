// AddMemberForm.js — Form for creating new Firebase Authentication members.
// Uses a Vercel serverless function (/api/create-user) so the current
// user's session is never interrupted by the creation of the new account.
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { IconEye, IconEyeOff } from '../../components/Icons/Icons';
import styles from './AddMemberForm.module.css';

function AddMemberForm() {
    const { currentUser } = useAuth();

    const [firstName, setFirstName] = useState('');
    const [lastName,  setLastName]  = useState('');
    const [email,    setEmail]    = useState('');
    const [password, setPassword] = useState('');
    const [showPw,   setShowPw]   = useState(false);
    const [loading,  setLoading]  = useState(false);
    const [error,    setError]    = useState('');
    const [success,  setSuccess]  = useState('');

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
            // Get a fresh ID token to prove to the server we're authenticated
            const idToken = await currentUser.getIdToken();

            const res = await fetch('/api/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type':  'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({ email, password, ...(displayName && { displayName }) }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to create member. Please try again.');
            } else {
                const nameLabel = displayName || data.email;
                setSuccess(`Member account created for ${nameLabel}. Share the password with them securely.`);
                setFirstName('');
                setLastName('');
                setEmail('');
                setPassword('');
                setShowPw(false);
            }
        } catch {
            setError('Network error. Please check your connection and try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Add New Member</h2>
            <p className={styles.sectionSubtitle}>
                Creates a login account for a new officer or member. Share the
                temporary password with them directly — they can update it later.
            </p>

            <form className={styles.form} onSubmit={handleSubmit} noValidate>

                {/* First + Last Name */}
                <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                        <label htmlFor="new-member-first-name">First Name</label>
                        <input
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

                <div className={styles.formRow}>
                    {/* Email */}
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

                {error   && <p className={styles.errorMessage}   role="alert">{error}</p>}
                {success && <p className={styles.successMessage} role="status">{success}</p>}

                <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={loading}
                >
                    {loading ? 'Creating\u2026' : 'Create Member Account'}
                </button>

            </form>
        </section>
    );
}

export default AddMemberForm;
