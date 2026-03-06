// Dashboard.js — Protected member dashboard at /member.
// Has its own minimal header (no public site Header or Footer).
// Placeholder cards will be replaced with real member features over time.
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import AddMemberForm from './AddMemberForm';
import UpdatePasswordForm from './UpdatePasswordForm';
import styles from './Dashboard.module.css';

function Dashboard() {
    const { currentUser, logout, refreshCurrentUser } = useAuth();
    const navigate = useNavigate();

    // ── Inline name edit state ────────────────────────────────
    const [editingName, setEditingName] = useState(false);
    const [nameFirst,   setNameFirst]   = useState('');
    const [nameLast,    setNameLast]    = useState('');
    const [nameSaving,  setNameSaving]  = useState(false);
    const [nameError,   setNameError]   = useState('');

    function startEditing() {
        const parts = (currentUser.displayName || '').split(' ');
        setNameFirst(parts[0] || '');
        setNameLast(parts.slice(1).join(' ') || '');
        setNameError('');
        setEditingName(true);
    }

    async function handleNameSave() {
        const displayName = `${nameFirst.trim()} ${nameLast.trim()}`.trim();
        setNameSaving(true);
        setNameError('');
        try {
            await updateProfile(currentUser, { displayName: displayName || null });
            refreshCurrentUser(); // re-render Header + Dashboard with new name
            setEditingName(false);
        } catch {
            setNameError('Failed to save name. Please try again.');
        } finally {
            setNameSaving(false);
        }
    }

    // ── Sign out ──────────────────────────────────────────────
    async function handleSignOut() {
        try {
            await logout();
            navigate('/', { replace: true });
        } catch (err) {
            // Sign-out failure is rare; log it but don't crash the UI
            console.error('Sign-out failed:', err);
        }
    }

    // ── Derived display name (first word, or email prefix) ────
    const firstName = currentUser.displayName?.split(' ')[0]
        ?? currentUser.email.split('@')[0];

    return (
        <div className={styles.shell}>

            {/* ── Minimal member header ── */}
            <header className={styles.memberHeader}>
                <div className={styles.memberHeaderInner}>

                    {/* Brand — links back to the public site */}
                    <Link to="/" className={styles.brand}>
                        <span className={styles.brandAbbr}>NSVYD</span>
                        <span className={styles.brandBadge}>Member</span>
                    </Link>

                    <div className={styles.headerRight}>
                        <span className={styles.email}>{currentUser.email}</span>
                        <button
                            className={styles.signOutBtn}
                            onClick={handleSignOut}
                        >
                            Sign Out
                        </button>
                    </div>

                </div>
            </header>

            {/* ── Dashboard body ── */}
            <main className={styles.main}>
                <div className={styles.inner}>

                    {/* ── Greeting + inline name edit ── */}
                    <div className={styles.greeting}>
                        {editingName ? (
                            <div className={styles.nameEditForm}>
                                <div className={styles.nameEditRow}>
                                    <div className={styles.nameEditGroup}>
                                        <label htmlFor="edit-first-name">First Name</label>
                                        <input
                                            id="edit-first-name"
                                            type="text"
                                            value={nameFirst}
                                            onChange={e => setNameFirst(e.target.value)}
                                            placeholder="Jane"
                                            disabled={nameSaving}
                                            autoFocus
                                        />
                                    </div>
                                    <div className={styles.nameEditGroup}>
                                        <label htmlFor="edit-last-name">Last Name</label>
                                        <input
                                            id="edit-last-name"
                                            type="text"
                                            value={nameLast}
                                            onChange={e => setNameLast(e.target.value)}
                                            placeholder="Smith"
                                            disabled={nameSaving}
                                        />
                                    </div>
                                </div>
                                {nameError && (
                                    <p className={styles.nameEditError} role="alert">{nameError}</p>
                                )}
                                <div className={styles.nameEditActions}>
                                    <button
                                        className={styles.nameEditSave}
                                        onClick={handleNameSave}
                                        disabled={nameSaving}
                                    >
                                        {nameSaving ? 'Saving\u2026' : 'Save'}
                                    </button>
                                    <button
                                        className={styles.nameEditCancel}
                                        onClick={() => setEditingName(false)}
                                        disabled={nameSaving}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <>
                                <h1 className={styles.greetingTitle}>
                                    Hello, {firstName}.
                                </h1>
                                <button
                                    className={styles.editNameBtn}
                                    onClick={startEditing}
                                    aria-label="Edit your display name"
                                    title="Edit your display name"
                                >
                                    {/* Feather "edit-2" — pencil + square */}
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        width="18"
                                        height="18"
                                        aria-hidden="true"
                                    >
                                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                </button>
                            </>
                        )}
                    </div>

                    {/* Placeholder feature cards */}
                    <div className={styles.cards}>

                        <div className={styles.card}>
                            <h2>Events</h2>
                            <p>Create and manage events beyond what appears on the public calendar.</p>
                            <span className={styles.comingSoon}>Coming soon</span>
                        </div>

                        <div className={styles.card}>
                            <h2>Documents</h2>
                            <p>Access meeting minutes, bylaws, and member-only files.</p>
                            <span className={styles.comingSoon}>Coming soon</span>
                        </div>

                        <div className={styles.card}>
                            <h2>Communications</h2>
                            <p>Send announcements and manage outreach to members.</p>
                            <span className={styles.comingSoon}>Coming soon</span>
                        </div>

                    </div>

                    {/* Add new member accounts without leaving the portal */}
                    <AddMemberForm />

                    {/* Update the currently signed-in member's password */}
                    <UpdatePasswordForm />

                </div>
            </main>

        </div>
    );
}

export default Dashboard;
