import LinkCards from '../LinkCards';
import volunteerLinks from '../../../data/volunteerLinks.json';
import styles from '../GetInvolved.module.css';

const VOLUNTEER_TERMS = [
    {
        term: 'Canvassing',
        def: '(PH!)Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.(PH!)',
    },
    {
        term: 'Text & Phone Banking',
        def: '(PH!)Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.(PH!)',
    },
    {
        term: 'Post Cards',
        def: '(PH!)Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation.(PH!)',
    },
];

function VolunteerPanel() {
    return (
        <section className={styles.volunteerSection}>
            <div className={styles.inner}>
                <h2>Volunteer</h2>
                <p>(PH!)Lorem ipsum dolor sit amet, consectetur adipiscing elit. Volunteering is one of the most impactful ways you can support Democratic candidates and causes in the Northern Shenandoah Valley. Whether you have an hour or a whole weekend, there is a role for you.(PH!)</p>
                <LinkCards links={volunteerLinks} cta="Sign Up" />
                <h3>(PH!)Common Volunteer Efforts(PH!)</h3>
                <div className={styles.volunteerTerms}>
                    {VOLUNTEER_TERMS.map((item) => (
                        <div key={item.term} className={styles.volunteerTerm}>
                            <h4>{item.term}</h4>
                            <p>{item.def}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

export default VolunteerPanel;
