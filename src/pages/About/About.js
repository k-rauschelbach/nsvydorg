// About.js -- About Us page

import styles from './About.module.css';

// Placeholder leadership data -- replace names, titles, and bios with real info
const OFFICERS = [
    {
        id: 1,
        name: 'Mary Tylka',
        title: 'President',
        bio: '(PH!)Committed Democratic organizer from Winchester, VA.(PH!)',
    },
    {
        id: 2,
        name: 'Karl Rauschelbach',
        title: 'Vice President',
        bio: '(PH!) Presidents boyfriend.(PH!)',
    },
    {
        id: 3,
        name: 'Amanda Herman',
        title: 'Secretary',
        bio: '(PH!)Handles meeting minutes and member communications.(PH!)',
    },
    {
        id: 4,
        name: 'Lindy Davenport',
        title: 'Treasurer',
        bio: '(PH!)Manages NSVYD finances and fundraising.(PH!)',
    },
];

function About() {
    return (
        <div>

            {/* Blue page header -- same pattern used on all interior pages */}
            <section className={styles.pageHeader}>
                <div className={styles.headerInner}>
                    <h1>About Us</h1>
                    <p>(PH!)Learn about who we are, what we stand for, and our leadership team.(PH!)</p>
                </div>
            </section>

            {/* Who we are */}
            <section className={styles.section}>
                <div className={styles.inner}>
                    <h2>Who We Are</h2>
                    <p>
                        (PH!)The Northern Shenandoah Valley Young Democrats (NSVYD) is the official
                        Young Democrats chapter for Clarke, Frederick, Winchester, Shenandoah, and Warren
                        Counties in Virginia.(PH!)
                    </p>
                    <p>
                        (PH!)Founded to provide a home for young Democratic voters and activists in
                        our region, we are affiliated with the Young Democrats of Virginia
                        and the Young Democrats of America.(PH!)
                    </p>
                    <p>
                        (PH!)Membership is open to Democrats and Democrat-leaning independents
                        ages 15–35.(PH!)
                    </p>
                </div>
            </section>

            {/* Leadership grid */}
            <section className={styles.sectionAlt}>
                <div className={styles.inner}>
                    <h2>Our Leadership</h2>
                    {/* .map() turns the OFFICERS array into a list of cards.
                        The key prop helps React efficiently update the list. */}
                    <div className={styles.teamGrid}>
                        {OFFICERS.map((officer) => (
                            <div key={officer.id} className={styles.memberCard}>
                                {/* Placeholder avatar box -- replace with <img> when you have photos */}
                                <div className={styles.memberAvatar}>Photo</div>
                                <h3>{officer.name}</h3>
                                <p className={styles.memberTitle}>{officer.title}</p>
                                <p>{officer.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
}

export default About;
