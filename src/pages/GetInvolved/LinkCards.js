import styles from './GetInvolved.module.css';

function LinkCards({ links, cta }) {
    return (
        <div className={styles.linkCards}>
            {links.map((link) => (
                <div key={link.id} className={styles.linkCard}>
                    {link.image ? (
                        <img
                            className={styles.linkCardImg}
                            src={link.image}
                            alt={link.imageAlt}
                        />
                    ) : (
                        <div className={styles.linkCardImg} />
                    )}
                    <div className={styles.linkCardBody}>
                        <h3>{link.name}</h3>
                        <p>{link.blurb}</p>
                    </div>
                    {link.url ? (
                        <a
                            className={styles.linkCardBtn}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`${cta}: ${link.name} (opens in new tab)`}
                        >
                            {cta}
                        </a>
                    ) : (
                        <div className={styles.linkCardBtnWrap}>
                            <span className={styles.linkCardBtnDisabled}>(PH!){cta}(PH!)</span>
                            <span className={styles.linkCardComingSoon}>(PH!)Coming soon(PH!)</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}

export default LinkCards;
