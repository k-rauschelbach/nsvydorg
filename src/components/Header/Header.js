// Header.js -- nav bar

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';

function Header() {
    const { currentUser, openLoginModal } = useAuth();
    const navigate = useNavigate();

    const navClass = ({ isActive }) => isActive ? styles.active : '';

    return (
        <header className={styles.header}>
            <div className={styles.inner}>

                {/* Left nav links */}
                <nav className={styles.navLeft}>
                    <NavLink to="/about"   className={navClass}>About Us</NavLink>
                    <NavLink to="/events"  className={navClass}>Events</NavLink>
                </nav>

                {/* Center logo bug — links home */}
                <NavLink to="/" className={styles.logoBug}>
                    <img src="/NSVYD_Transparent_Logo.png" alt="NSVYD Home" />
                </NavLink>

                {/* Right nav links */}
                <nav className={styles.navRight}>
                    <NavLink to="/get-involved" className={navClass}>Get Involved</NavLink>

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
