// Dashboard.js — Protected member dashboard at /member.
// Has its own minimal header (no public site Header or Footer).
// Placeholder cards will be replaced with real member features over time.
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AddMemberForm from './AddMemberForm';
import styles from './Dashboard.module.css';

function Dashboard() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    async function handleSignOut() {
        try {
            await logout();
            navigate('/', { replace: true });
        } catch (err) {
            // Sign-out failure is rare; log it but don't crash the UI
            console.error('Sign-out failed:', err);
        }
    }

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

                    <h1 className={styles.pageTitle}>Member Dashboard</h1>
                    <p className={styles.welcomeText}>
                        Welcome, {currentUser.email}. Member tools will appear here as they are built.
                    </p>

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

                </div>
            </main>

        </div>
    );
}

export default Dashboard;
