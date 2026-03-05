// Header.js -- nav bar

import { NavLink } from 'react-router-dom';
import styles from './Header.module.css';

function Header() {
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

                {/*Nav links*/}
                <nav className={styles.nav}>
                    <NavLink to="/"             className={({isActive}) => isActive ? styles.active : ''}>Home</NavLink>
                    <NavLink to="/about"        className={({isActive}) => isActive ? styles.active : ''}>About Us</NavLink>
                    <NavLink to="/events"       className={({isActive}) => isActive ? styles.active : ''}>Events</NavLink>
                    <NavLink to="/get-involved" className={({isActive}) => isActive ? styles.active : ''}>Get Involved</NavLink>
                </nav>
                
            </div>
        </header>
    )
}

export default Header;