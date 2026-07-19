import { useRef } from 'react';
import styles from './EventModal.module.css';

function EventModal({ event, onClose }) {
    const mouseDownOnBackdrop = useRef(false);

    function handleBackdropMouseDown(e) {
        mouseDownOnBackdrop.current = e.target === e.currentTarget;
    }

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget && mouseDownOnBackdrop.current) {
            onClose();
        }
    }

    const startStr = event.start
        ? event.start.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              ...(event.allDay ? {} : { hour: 'numeric', minute: '2-digit' }),
          })
        : '';

    const endStr =
        event.end && !event.allDay
            ? event.end.toLocaleString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
              })
            : '';

    return (
        <div
            className={styles.modalBackdrop}
            onMouseDown={handleBackdropMouseDown}
            onClick={handleBackdropClick}
            role="dialog"
            aria-modal="true"
            aria-label={event.title}
        >
            <div className={styles.modal}>
                <button
                    className={styles.modalClose}
                    onClick={onClose}
                    aria-label="Close event details"
                >
                    &times;
                </button>

                <h2 className={styles.modalTitle}>{event.title}</h2>

                <p className={styles.modalMeta}>
                    {startStr}
                    {endStr && ` – ${endStr}`}
                </p>

                {event.location && (
                    <p className={styles.modalMeta}>&#128205; {event.location}</p>
                )}

                {event.description && (
                    <p className={styles.modalDescription}>{event.description}</p>
                )}
            </div>
        </div>
    );
}

export default EventModal;
