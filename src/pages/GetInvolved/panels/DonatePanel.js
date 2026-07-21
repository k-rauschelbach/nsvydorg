import LinkCards from '../LinkCards';
import donateLinks from '../../../data/donateLinks.json';
import styles from '../GetInvolved.module.css';

function DonatePanel() {
    return (
        <section className={styles.donateSection}>
            <div className={styles.inner}>
                <h2>Donate</h2>
                <p>(PH!)Lorem ipsum dolor sit amet, consectetur adipiscing elit. Your financial support helps us organize events, run campaigns, and build a stronger community for young Democrats in the Northern Shenandoah Valley.(PH!)</p>
                <LinkCards links={donateLinks} cta="Donate" />
                <p className={styles.donateDisclaimer}>
                    (PH!)Donation links go to third-party payment processors operated by the campaigns and organizations themselves, not by NSVYD. Contributions are not tax-deductible.(PH!)
                </p>
            </div>
        </section>
    );
}

export default DonatePanel;
