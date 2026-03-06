// Dashboard.js — Protected member dashboard at /member.
// Has its own minimal header (no public site Header or Footer).
// Placeholder cards will be replaced with real member features over time.
import { useState } from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import { IconEdit } from '../../components/Icons/Icons';
import AddMemberForm from './AddMemberForm';
import UpdatePasswordForm from './UpdatePasswordForm';
import styles from './Dashboard.module.css';

function Dashboard() {
    const { currentUser, logout, refreshCurrentUser, userRole } = useAuth();
    const navigate = useNavigate();

    //  Add Member modal 
    // Only officers ever see the button or the modal.
    const [addMemberOpen, setAddMemberOpen] = useState(false);

    //  Inline name edit state 
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

    //  Sign out 
    async function handleSignOut() {
        try {
            await logout();
            navigate('/', { replace: true });
        } catch (err) {
            // Sign-out failure is rare; log it but don't crash the UI
            console.error('Sign-out failed:', err);
        }
    }

    //  Derived display name (first word, or email prefix) 
    const firstName = currentUser.displayName?.split(' ')[0]
        ?? currentUser.email.split('@')[0];

    return (
        <div className={styles.shell}>

            {/*  Minimal member header  */}
            <header className={styles.memberHeader}>
                <div className={styles.memberHeaderInner}>

                    {/* Brand — links back to the public site */}
                    <Link to="/" className={styles.brand}>
                        <span className={styles.brandAbbr}>NSVYD</span>
                        <span className={styles.brandBadge}>Member</span>
                    </Link>

                    {/* Public site nav links */}
                    <nav className={styles.nav}>
                        <NavLink to="/"             className={({isActive}) => isActive ? styles.navActive : ''}>Home</NavLink>
                        <NavLink to="/about"        className={({isActive}) => isActive ? styles.navActive : ''}>About Us</NavLink>
                        <NavLink to="/events"       className={({isActive}) => isActive ? styles.navActive : ''}>Events</NavLink>
                        <NavLink to="/get-involved" className={({isActive}) => isActive ? styles.navActive : ''}>Get Involved</NavLink>
                    </nav>

                    <div className={styles.headerRight}>
                        {/*<span className={styles.email}>{currentUser.email}</span>*/}
                        <button
                            className={styles.signOutBtn}
                            onClick={handleSignOut}
                        >
                            Sign Out
                        </button>
                    </div>

                </div>
            </header>

            {/*  Dashboard body  */}
            <main className={styles.main}>
                <div className={styles.inner}>

                    {/*  Greeting + inline name edit  */}
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
                                    <IconEdit />
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

                    {/* Officer-only: Add Member button + modal */}
                    {userRole === 'officer' && (
                        <>
                            <button
                                className={styles.addMemberBtn}
                                onClick={() => setAddMemberOpen(true)}
                            >
                                Add Member
                            </button>
                            <AddMemberForm
                                isOpen={addMemberOpen}
                                onClose={() => setAddMemberOpen(false)}
                            />
                        </>
                    )}

                    {/* Update the currently signed-in member's password */}
                    <UpdatePasswordForm />

                </div>
            </main>

        </div>
    );
}

export default Dashboard;
