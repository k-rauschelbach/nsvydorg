import { snippet } from '../../api/calendar';
import styles from './EventCard.module.css';

function EventCard({ event, onClick }) {
    return (
        <button
            type="button"
            className={styles.eventCard}
            onClick={onClick}
        >
            <div className={styles.dateBadge}>
                <span className={styles.dateBadgeDay}>
                    {event.start.getDate()}
                </span>
                <span className={styles.dateBadgeMonth}>
                    {event.start.toLocaleString('en-US', { month: 'short' })}
                </span>
            </div>
            <h3>{event.title}</h3>
            <p className={styles.eventCardMeta}>
                {event.allDay
                    ? event.start.toLocaleDateString('en-US', { weekday: 'long' }) + ' · All day'
                    : event.start.toLocaleString('en-US', {
                          weekday: 'long',
                          hour: 'numeric',
                          minute: '2-digit',
                      })}
            </p>
            {event.location && (
                <p className={styles.eventCardMeta}>&#128205; {event.location}</p>
            )}
            {event.description && (
                <p className={styles.eventCardDesc}>{snippet(event.description)}</p>
            )}
        </button>
    );
}

export default EventCard;
