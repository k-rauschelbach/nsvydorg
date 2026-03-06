// Header.js -- nav bar

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';

function Header() {
    const { currentUser, openLoginModal } = useAuth();
    const navigate = useNavigate();

    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                {/*Site logo*/}
                <NavLink to="/" className={styles.brand}>
                    <span className={styles.brandAbbr}>NSVYD</span>
                    <span className={styles.brandFull}>
                        Northern Shenandoah Valley Young Democrats
                    </span>
                </NavLink>

                {/*Nav links + member auth button*/}
                <nav className={styles.nav}>
                    <NavLink to="/"             className={({isActive}) => isActive ? styles.active : ''}>Home</NavLink>
                    <NavLink to="/about"        className={({isActive}) => isActive ? styles.active : ''}>About Us</NavLink>
                    <NavLink to="/events"       className={({isActive}) => isActive ? styles.active : ''}>Events</NavLink>
                    <NavLink to="/get-involved" className={({isActive}) => isActive ? styles.active : ''}>Get Involved</NavLink>

                    {/* Auth button — ghost when logged out, filled white when logged in */}
                    {currentUser ? (
                        <button
                            className={styles.memberBtnActive}
                            onClick={() => navigate('/member')}
                            title={currentUser.displayName || currentUser.email}
                        >
                            {currentUser.displayName?.split(' ')[0] ?? currentUser.email.split('@')[0]}
                        </button>
                    ) : (
                        <button
                            className={styles.memberBtn}
                            onClick={openLoginModal}
                        >
                            Member Login
                        </button>
                    )}
                </nav>

            </div>
        </header>
    );
}

export default Header;