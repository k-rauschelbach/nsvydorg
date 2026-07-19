// Header.js -- nav bar

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Header.module.css';

function Header() {
    const { currentUser, openLoginModal } = useAuth();
    const navigate = useNavigate();
    const [menuOpen, setMenuOpen] = useState(false);

    const navClass = ({ isActive }) => isActive ? styles.active : '';
    const closeMenu = () => setMenuOpen(false);

    // On phones the logo bug is the menu toggle instead of a home link
    const handleLogoClick = (e) => {
        if (window.matchMedia('(max-width: 700px)').matches) {
            e.preventDefault();
            setMenuOpen(open => !open);
        }
    };

    // Rendered in the desktop right wing and again in the mobile dropdown
    const renderMemberBtn = () => currentUser ? (
        <button
            className={styles.memberBtnActive}
            onClick={() => { closeMenu(); navigate('/member'); }}
            title={currentUser.displayName || currentUser.email}
        >
            {currentUser.displayName?.split(' ')[0] ?? currentUser.email.split('@')[0]}
        </button>
    ) : (
        <button
            className={styles.memberBtn}
            onClick={() => { closeMenu(); openLoginModal(); }}
        >
            Member Login
        </button>
    );

    return (
        <header className={styles.header}>
            <div className={styles.inner}>

                {/* Left nav links */}
                <nav className={styles.navLeft}>
                    <NavLink to="/about"     className={navClass}>About Us</NavLink>
                    <NavLink to="/events"    className={navClass}>Events</NavLink>
                    <NavLink to="/elections" className={navClass}>Elections</NavLink>
                </nav>

                {/* Center logo bug — links home on desktop, toggles the menu on phones */}
                <NavLink
                    to="/"
                    className={styles.logoBug}
                    onClick={handleLogoClick}
                    aria-expanded={menuOpen}
                >
                    <img src="/NSVYD_Transparent_Logo.png" alt="NSVYD Home" />
                </NavLink>

                {/* Right nav links */}
                <nav className={styles.navRight}>
                    <NavLink to="/get-involved" className={navClass}>Get Involved</NavLink>
                    {renderMemberBtn()}
                </nav>

            </div>

            {/* Mobile dropdown — hidden on desktop, toggled by tapping the logo */}
            <nav className={menuOpen ? `${styles.mobileMenu} ${styles.menuOpen}` : styles.mobileMenu}>
                <NavLink to="/" end          className={navClass} onClick={closeMenu}>Home</NavLink>
                <NavLink to="/about"         className={navClass} onClick={closeMenu}>About Us</NavLink>
                <NavLink to="/events"        className={navClass} onClick={closeMenu}>Events</NavLink>
                <NavLink to="/elections"     className={navClass} onClick={closeMenu}>Elections</NavLink>
                <NavLink to="/get-involved"  className={navClass} onClick={closeMenu}>Get Involved</NavLink>
                {renderMemberBtn()}
            </nav>
        </header>
    );
}

export default Header;
