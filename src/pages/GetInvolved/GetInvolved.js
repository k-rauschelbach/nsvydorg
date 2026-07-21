// GetInvolved.js -- Join, volunteer, donate, and contact form page

import { useState, useRef } from 'react';
import JoinPanel from './panels/JoinPanel';
import MeetingsPanel from './panels/MeetingsPanel';
import FollowPanel from './panels/FollowPanel';
import DonatePanel from './panels/DonatePanel';
import VolunteerPanel from './panels/VolunteerPanel';
import ContactForm from './panels/ContactForm';
import styles from './GetInvolved.module.css';

// holder for involve cards
const WAYS = [
    {
        id: 1,
        title: 'Join as a Member',
        desc: 'Sign up to become an official member of NSVYD',
        action: 'join',
    },
    {
        id: 2,
        title: 'Volunteer',
        desc: '(PH!)Give your time to make a better future(PH!)',
        action: 'volunteer',
    },
    {
        id: 3,
        title: 'Attend a Meeting',
        desc: 'From our own meetups to public forums - show up, be informed, be heard.',
        action: 'meetings',
    },
    {
        id: 4,
        title: 'Donate',
        desc: '(PH!)Financial contributions help us(PH!)',
        action: 'donate',
    },
    {
        id: 5,
        title: '(PH!)Follow Us',
        desc: '(PH!)Stay connected on Facebook, Instagram, and BlueSky(PH!)',
        action: 'follow',
    },
];

function GetInvolved() {

    // ======> action panels <======
    // null = none , 'join' = member form , 'follow' = social media links, 'meetings' = meeting list
    const [activePanel, setActivePanel] = useState(null);

    // Marks the top of the panel stack. Only one panel is ever open and the
    // rest collapse to zero height, so whichever one unfolds, its top lands
    // here -- a point that never moves. Scrolling to this anchor instead of to
    // the panel itself avoids aiming at the still-collapsing layout, which sent
    // the page to the bottom before correcting back up.
    const panelAnchorRef = useRef(null);

    function togglePanel(action) {
        const next = activePanel === action ? null : action;
        setActivePanel(next);
        if (next) {
            panelAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    return (
        <div>

            {/* Blue page header */}
            <section className={styles.pageHeader}>
                <div className={styles.headerInner}>
                    <h1>Get Involved</h1>
                    <p>There are many ways to make a difference. Find the right one for you.</p>
                </div>
            </section>

            {/* Ways to get involved -- card grid */}
            <section className={styles.section}>
                <div className={styles.inner}>
                    <h2>How to Help</h2>
                    <div className={styles.waysGrid}>
                        {WAYS.map((way) =>
                            way.action ? (
                                <button
                                    key={way.id}
                                    type="button"
                                    className={`${styles.wayCard} ${styles.wayCardBtn} ${activePanel === way.action ? styles.wayCardActive : ''}`}
                                    onClick={() => togglePanel(way.action)}
                                    >
                                    <h3>{way.title}</h3>
                                    <p>{way.desc}</p>
                                </button>
                            ) : (
                            <div key={way.id} className={styles.wayCard}>
                                <h3>{way.title}</h3>
                                <p>{way.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Scroll target for every unfolding panel -- see panelAnchorRef */}
            <div ref={panelAnchorRef} className={styles.panelAnchor} aria-hidden="true" />

            {/* Membership form -- unfolds when action card is selected */}
            <div className={`${styles.joinFormWrap} ${activePanel === 'join' ? styles.joinFormOpen : ''}`}>
                <JoinPanel onSuccess={() => setActivePanel(null)} />
            </div>

            {/* #region Attend a meeting */}
            <div className={`${styles.joinFormWrap} ${activePanel === 'meetings' ? styles.meetingsFormOpen : ''}`}>
                <MeetingsPanel />
            </div>

            {/* Follow us panel -- unfolds when action card is selected */}
            <div className={`${styles.joinFormWrap} ${activePanel === 'follow' ? styles.joinFormOpen : ''}`}>
                <FollowPanel />
            </div>

            {/* Donate panel -- unfolds when action card is selected */}
            <div className={`${styles.joinFormWrap} ${activePanel === 'donate' ? styles.joinFormOpen : ''}`}>
                <DonatePanel />
            </div>

            {/* Volunteer panel -- unfolds when action card is selected */}
            <div className={`${styles.joinFormWrap} ${activePanel === 'volunteer' ? styles.joinFormOpen : ''}`}>
                <VolunteerPanel />
            </div>

            {/* Contact form */}
            <ContactForm />

        </div>
    );
}

export default GetInvolved;
