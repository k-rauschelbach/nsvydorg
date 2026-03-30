import { Link } from 'react-router-dom';
import styles from './Home.module.css';

function Home() {
    return (
        <div>
            <section className={styles.hero}>
                <div className={styles.heroImageFrame}>
                    <img
                        src="/HomeBannerGhostCropped.png"
                        alt="Emerald Pond with NSVYD Logo"
                        className={styles.heroImage}
                    />
                    <h1 className={styles.heroTitle}>(PH!)Forging a Bright Future for the Shenandoah Valley(PH!)</h1>
                </div>
                <div className={styles.heroInner}>
                    <p>
                        (PH!)The Northern Shenandoah Valley Young Democrats organize, empower, and support
                        the future generations of Clarke, Frederick, Winchester, Shenandoah, and Warren Counties(PH!)
                    </p>
                    {/* Links from react router */}
                    <div className={styles.heroCta}>
                        <Link to="/get-involved" className={styles.btnPrimary}>Get Involved</Link>
                        <Link to="/events" className={styles.btnSecondary}>Upcoming Events</Link>
                    </div>
                </div>
            </section>

            {/* Mission */}
            <section className={styles.mission}>
                {/* styles.inner is the correct class name defined in Home.module.css */}
                <div className={styles.inner}>
                    <h2>Our Mission</h2>
                    <p>
                        (PH!) Mission statement about striving to build a better, more
                        inclusive, more equitable future for the Shenandoah Valley(PH!)
                    </p>
                </div>
            </section>

            {/* Highlights */}
            <section className={styles.highlights}>
                {/* styles.inner is the correct class name defined in Home.module.css */}
                <div className={styles.inner}>
                    <h2>What We Do</h2>
                    <div className={styles.cards}>

                        <div className={styles.card}>
                            <h3>Organize</h3>
                            <p>
                                (PH!)We knock doors, make calls, and empower young voters.(PH!)
                            </p>
                        </div>

                        <div className={styles.card}>
                            <h3>Advocate</h3>
                            <p>
                                (PH!)e engage local government and advocate for policies
                                that build for the future.(PH!)
                            </p>
                        </div>

                        <div className={styles.card}>
                            <h3>Elect</h3>
                            <p>
                                (PH!)We support Democratic candidates at every level
                                from school board to President.(PH!)
                            </p>
                        </div>

                    </div>
                </div>
            </section>
            
        </div>
    );
}

export default Home;