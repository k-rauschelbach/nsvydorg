// Footer.js -- site footer

import styles from './Footer.module.css';

function Footer() {
    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                
                <p className={styles.org}>
                    Northern Shenandoah Valley Young Democrats
                </p>
                
                <p className={styles.tagline}>
                    (PH!)Giving a voice to the next generation of Democratic Leaders in the Shenandoah Valley(PH!)
                </p>

                {/* External Links */}
                <div className={styles.links}>
                    <a href="https://www.facebook.com/" target="_blank" rel="noopener noreferrer">Facebook</a>
                    <a href="https://www.instagram.com//" target="_blank" rel="noopener noreferrer">Instagram</a>
                    <a href="https://www.bksy.app" target="_blank" rel="noopener noreferrer">BlueSky</a>
                </div>
                {/* ownership stamp */}
                <p className={styles.copy}>
                    &copy; {new Date().getFullYear()} NSVYD. Paid for by the Northern Shenandoah Valley Young Democrats.
                </p>
                
            </div>
        </footer>
    );
}

export default Footer;