import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUpcomingEvents, groupMeetings } from '../../../api/calendar';
import EventCard from '../../../components/EventCard/EventCard';
import EventModal from '../../../components/EventModal/EventModal';
import styles from '../GetInvolved.module.css';

function MeetingsPanel() {

    // ======> meetings panel <======
    const [meetingGroups, setMeetingGroups] = useState([]);
    // distinguishes "still fetching" from "fetched, nothing found" so the
    // empty-state message never flashes before the events arrive
    const [meetingsLoaded, setMeetingsLoaded] = useState(false);
    const [selectedMeeting, setSelectedMeeting] = useState(null);

    useEffect(() => {
        fetchUpcomingEvents().then((events) => {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() + 60);
            const upcoming = events.filter((ev) => ev.start <= cutoff);
            setMeetingGroups(groupMeetings(upcoming));
            setMeetingsLoaded(true);
        });
    }, []);

    return (
        <>
            <section className={styles.meetingsSection}>
                <div className={styles.inner}>
                    <h2>Upcoming Meetings</h2>
                    <p>Find a meeting near you and show up. Every voice matters.</p>
                    {!meetingsLoaded ? (
                        <p>Loading meetings…</p>
                    ) : meetingGroups.length === 0 ? (
                        <p>
                            No public meetings on the calendar right now -{' '}
                            <Link to="/events">check the full calendar</Link> for other events.
                        </p>
                    ) : (
                        <>
                            {meetingGroups.map((group) => {
                                const shown = group.events.slice(0, 4);
                                const overflow = group.events.length - 4;
                                return (
                                    <div key={group.slug} className={styles.meetingGroup}>
                                        <h3>{group.label}</h3>
                                        <div className={styles.meetingGrid}>
                                            {shown.map((ev) => (
                                                <EventCard
                                                    key={ev.id}
                                                    event={ev}
                                                    onClick={() => setSelectedMeeting(ev)}
                                                />
                                            ))}
                                        </div>
                                        {overflow > 0 && (
                                            <p className={styles.meetingMore}>
                                                <Link to="/events">+{overflow} more on the calendar</Link>
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                            <p className={styles.meetingFooter}>
                                <Link to="/events">See the full calendar →</Link>
                            </p>
                        </>
                    )}
                </div>
            </section>

            {selectedMeeting && (
                <EventModal event={selectedMeeting} onClose={() => setSelectedMeeting(null)} />
            )}
        </>
    );
}

export default MeetingsPanel;
