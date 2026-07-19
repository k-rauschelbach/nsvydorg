// Events.js -- Events page with FullCalendar Google Calendar integration

import { useState, useRef, useCallback, useEffect, memo } from 'react';

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

import { fetchUpcomingEvents, cleanDescription, isCalendarConfigured } from '../../api/calendar';
import EventCard from '../../components/EventCard/EventCard';
import EventModal from '../../components/EventModal/EventModal';
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
        const truncated = title.slice(0, 64) + '…'; // …
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
            // Don't pad the grid to 6 rows — skip any trailing row of next-month days
            fixedWeekCount={false}
            // "auto" expands the calendar to show the full grid
            // rather than scrolling inside a fixed height
            height="auto"
            eventDidMount={handleEventDidMount}
        />
    );
});

function Events() {
    // selectedEvent holds the plain normalized event shape, or null when no modal is open
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [highlights, setHighlights] = useState([]);
    const calendarRef = useRef(null);

    useEffect(() => {
        fetchUpcomingEvents().then((events) => {
            const tagged = events.filter((ev) => ev.tags.includes('featured'));
            setHighlights(tagged.length > 0 ? tagged.slice(0, 6) : events.slice(0, 3));
        });
    }, []);

    // Stable references so CalendarGrid's memo check passes when modal opens/closes
    const handleEventClick = useCallback((clickInfo) => {
        // Without preventDefault, FullCalendar would navigate to the
        // event's Google Calendar URL instead of opening our modal
        clickInfo.jsEvent.preventDefault();
        const ev = clickInfo.event;
        // FullCalendar surfaces location/description under extendedProps;
        // description is raw HTML so run it through cleanDescription.
        setSelectedEvent({
            id: ev.id,
            title: ev.title,
            start: ev.start,
            end: ev.end,
            allDay: ev.allDay,
            location: ev.extendedProps?.location || '',
            description: cleanDescription(ev.extendedProps?.description || ''),
        });
    }, []);

    const handleDateClick = useCallback((info) => {
        const api = calendarRef.current.getApi();
        api.gotoDate(info.date);
        api.changeView('timeGridDay');
    }, []);

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
                    <div className={styles.calendarCard}>
                        {!isCalendarConfigured() ? (
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
                </div>
            </section>

            {highlights.length > 0 && (
                <section className={styles.highlightSection}>
                    <div className={styles.highlightInner}>
                        <h2>Highlighted Events</h2>
                        <div className={styles.highlightGrid}>
                            {highlights.map((ev) => (
                                <EventCard
                                    key={ev.id}
                                    event={ev}
                                    onClick={() => setSelectedEvent(ev)}
                                />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {selectedEvent && (
                <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
            )}

        </div>
    );
}

export default Events;
