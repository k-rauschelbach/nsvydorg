// Events.js -- Events page with FullCalendar Google Calendar integration

import { useState, useRef, useCallback, memo } from 'react';

// FullCalendar core React wrapper
import FullCalendar from '@fullcalendar/react';
// dayGridPlugin provides the month-grid view
import dayGridPlugin from '@fullcalendar/daygrid';
// timeGridPlugin provides the week and day time-slot views
import timeGridPlugin from '@fullcalendar/timegrid';
// listPlugin provides the scrollable agenda/list view
import listPlugin from '@fullcalendar/list';
// googleCalendarPlugin lets FullCalendar fetch directly from Google Calendar
import googleCalendarPlugin from '@fullcalendar/google-calendar';
// interactionPlugin is required for the eventClick callback to fire
import interactionPlugin from '@fullcalendar/interaction';

import styles from './Events.module.css';

// Read keys from .env.local at build time.
// CRA exposes any variable prefixed with REACT_APP_ to the browser bundle.
// After editing .env.local you must restart npm start for changes to take effect.
const API_KEY = process.env.REACT_APP_GOOGLE_CALENDAR_API_KEY;
const CALENDAR_ID = process.env.REACT_APP_GOOGLE_CALENDAR_ID;

// Truncate event titles longer than 64 characters.
// Defined outside the component so the reference is stable across renders.
function handleEventDidMount(info) {
    const title = info.event.title;
    if (title.length > 64) {
        const truncated = title.slice(0, 64) + '\u2026'; // …
        // Month / week / day grid chips
        const chipTitle = info.el.querySelector('.fc-event-title');
        if (chipTitle) chipTitle.textContent = truncated;
        // List view — title is inside a <td> in the event <tr>
        const listTitle = info.el.querySelector('.fc-list-event-title a');
        if (listTitle) listTitle.textContent = truncated;
    }
}

// Memoized calendar — isolated from modal state so opening/closing the modal
// does not trigger a FullCalendar re-render and re-fetch.
const CalendarGrid = memo(function CalendarGrid({ calendarRef, onEventClick, onDateClick }) {
    return (
        <FullCalendar
            ref={calendarRef}
            // All five plugins registered — each one unlocks a view or feature
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, googleCalendarPlugin, interactionPlugin]}
            // Default to month-grid on first load
            initialView="dayGridMonth"
            // API key for the Google Calendar API
            googleCalendarApiKey={API_KEY}
            // The events prop with a googleCalendarId object is how
            // the google-calendar plugin knows which calendar to fetch
            events={{ googleCalendarId: CALENDAR_ID }}
            // Message shown when the visible range has no events
            noEventsContent="No events this period."
            // Wire up click handler — requires interactionPlugin
            eventClick={onEventClick}
            // Navigate to day view when clicking empty space in a day cell
            dateClick={onDateClick}
            // Cap visible event rows per day in month view; extras show as "+N more"
            dayMaxEventRows={3}
            // Toolbar layout:
            //   left  — prev/next arrows and Today button
            //   center — current month/week/day title
            //   right — view-switcher buttons (Month | Week | Day | List)
            headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
            }}
            // Friendlier button labels for the view switcher
            buttonText={{
                today: 'Today',
                month: 'Month',
                week:  'Week',
                day:   'Day',
                list:  'List',
            }}
            // "auto" expands the calendar to show the full grid
            // rather than scrolling inside a fixed height
            height="auto"
            eventDidMount={handleEventDidMount}
        />
    );
});

function Events() {
    // selectedEvent holds the FullCalendar event object the user clicked,
    // or null when no modal is open
    const [selectedEvent, setSelectedEvent] = useState(null);
    const mouseDownOnBackdrop = useRef(false);
    const calendarRef = useRef(null);

    // Stable references so CalendarGrid's memo check passes when modal opens/closes
    const handleEventClick = useCallback((clickInfo) => {
        // Without preventDefault, FullCalendar would navigate to the
        // event's Google Calendar URL instead of opening our modal
        clickInfo.jsEvent.preventDefault();
        setSelectedEvent(clickInfo.event);
    }, []);

    const handleDateClick = useCallback((info) => {
        const api = calendarRef.current.getApi();
        api.gotoDate(info.date);
        api.changeView('timeGridDay');
    }, []);

    // Close the modal when the user clicks on the dark backdrop
    // (but not when clicking inside the modal panel itself).
    // Track mousedown origin so dragging from inside the modal to outside
    // the backdrop does not accidentally close it.
    function handleBackdropMouseDown(e) {
        mouseDownOnBackdrop.current = e.target === e.currentTarget;
    }

    function handleBackdropClick(e) {
        if (e.target === e.currentTarget && mouseDownOnBackdrop.current) {
            setSelectedEvent(null);
        }
    }

    // Safely extract display values from the selected event.
    // Google Calendar-specific fields (location, description) surface
    // under extendedProps in FullCalendar's event object.
    const modalTitle = selectedEvent ? selectedEvent.title : '';

    const modalStart = selectedEvent
        ? selectedEvent.start.toLocaleString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit',
          })
        : '';

    const modalEnd =
        selectedEvent && selectedEvent.end
            ? selectedEvent.end.toLocaleString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
              })
            : '';

    const modalLocation =
        selectedEvent ? selectedEvent.extendedProps.location || '' : '';

    const modalDescription =
        selectedEvent ? selectedEvent.extendedProps.description || '' : '';

    // Show a developer-friendly error if the .env.local file is missing or empty
    const isMisconfigured = !API_KEY || !CALENDAR_ID;

    return (
        <div>

            {/* Blue page header */}
            <section className={styles.pageHeader}>
                <div className={styles.headerInner}>
                    <h1>Events</h1>
                    <p>Join us at our upcoming meetings, canvasses, and community events.</p>
                </div>
            </section>

            {/* Calendar section */}
            <section className={styles.calendarSection}>
                <div className={styles.calendarInner}>

                    {isMisconfigured ? (
                        // Rendered during development if .env.local is not yet set up
                        <p className={styles.errorMessage}>
                            Calendar not configured. Add{' '}
                            <code>REACT_APP_GOOGLE_CALENDAR_API_KEY</code> and{' '}
                            <code>REACT_APP_GOOGLE_CALENDAR_ID</code> to your{' '}
                            <code>.env.local</code> file, then restart the dev server.
                        </p>
                    ) : (
                        <CalendarGrid
                            calendarRef={calendarRef}
                            onEventClick={handleEventClick}
                            onDateClick={handleDateClick}
                        />
                    )}

                </div>
            </section>

            {/* Event detail modal — only mounted when selectedEvent is non-null */}
            {selectedEvent && (
                <div
                    className={styles.modalBackdrop}
                    onMouseDown={handleBackdropMouseDown}
                    onClick={handleBackdropClick}
                    role="dialog"
                    aria-modal="true"
                    aria-label={modalTitle}
                >
                    <div className={styles.modal}>

                        {/* Close button — top-right corner of the modal panel */}
                        <button
                            className={styles.modalClose}
                            onClick={() => setSelectedEvent(null)}
                            aria-label="Close event details"
                        >
                            &times;
                        </button>

                        <h2 className={styles.modalTitle}>{modalTitle}</h2>

                        {/* Date and optional end time */}
                        <p className={styles.modalMeta}>
                            {modalStart}{modalEnd && ` – ${modalEnd}`}
                        </p>

                        {/* Location — only rendered if the event has one */}
                        {modalLocation && (
                            <p className={styles.modalMeta}>
                                {/* Map pin emoji via HTML entity */}
                                &#128205; {modalLocation}
                            </p>
                        )}

                        {/* Description — only rendered if the event has one.
                            Google Calendar can embed HTML in descriptions,
                            so we strip tags with a simple regex to keep the
                            modal plain-text without using dangerouslySetInnerHTML */}
                        {modalDescription && (
                            <p className={styles.modalDescription}>
                                {modalDescription.replace(/<[^>]*>/g, '')}
                            </p>
                        )}

                    </div>
                </div>
            )}

        </div>
    );
}

export default Events;
