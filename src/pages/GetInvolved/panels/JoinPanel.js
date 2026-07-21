import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Turnstile, { isTurnstileConfigured } from '../../../components/Turnstile/Turnstile';
import styles from '../GetInvolved.module.css';

// possible localities
const LOCALITIES = [
    'Winchester City', 'Frederick County', 'Shenandoah County', 'Warren County', 'Clarke County', 'Other' ];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
];

function daysInMonth(month, year) {
    if (!month) return 31;
    return new Date(year || 2000, Number(month), 0).getDate();
}

// empty form data for join
const EMPTY_JOIN = {
    firstName: '', lastName: '',
    dobMonth: '', dobDay: '', dobYear: '',
    email: '', phone: '',
    locality: '', localityOther: '',
    registered: '', availability: [], skills: '', issues: '',
    company: '', // honeypot — see the hidden input in the join form
};

function JoinPanel({ onSuccess }) {

    // get logged in user role
    const { userRole } = useAuth();

    const navigate = useNavigate();

    // ======> join form <======
    const [joinData, setJoinData] = useState(EMPTY_JOIN);
    const [joinStatus, setJoinStatus] = useState('idle'); // idle, submitting, success, error

    // Separate Turnstile instance from the contact form — each widget issues
    // its own single-use token.
    const [joinToken, setJoinToken] = useState(null);
    const joinTurnstileRef = useRef(null);
    const [joinConsent, setJoinConsent] = useState(false);

    function handleJoinChange(e) {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setJoinData(prev => ({
                ...prev,
                availability: checked
                    ? [...prev.availability, value]
                    : prev.availability.filter(item => item !== value)
            }));
        } else if (name === 'dobMonth' || name === 'dobYear') {
            // auto-reset day if it exceeds the new month's max days
            setJoinData(prev => {
                const updated = { ...prev, [name]: value };
                const max = daysInMonth(
                    name === 'dobMonth' ? value : prev.dobMonth,
                    name === 'dobYear'  ? value : prev.dobYear
                );
                if (updated.dobDay && Number(updated.dobDay) > max) updated.dobDay = '';
                return updated;
            });
        } else {
            setJoinData(prev => ({ ...prev, [name]: value }));
        }
    }

    async function handleJoinSubmit(e) {
        e.preventDefault();

        if (isTurnstileConfigured() && !joinToken) {
            setJoinStatus('error');
            return;
        }

        setJoinStatus('submitting');
        //merge locality data, combine DOB parts, and combine name into one field
        const { localityOther, dobMonth, dobDay, dobYear, firstName, lastName, ...rest } = joinData;
        const dob = (dobYear && dobMonth && dobDay)
            ? `${dobYear}-${String(dobMonth).padStart(2,'0')}-${String(dobDay).padStart(2,'0')}`
            : '';
        const payload = {
            ...rest, // includes the 'company' honeypot, which the server checks
            name: `${firstName} ${lastName}`.trim(),
            dob,
            locality: joinData.locality === 'Other' ? localityOther : joinData.locality,
            turnstileToken: joinToken,
        };
        try {
            const res = await fetch('/api/join-member', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setJoinStatus('success');
                setJoinData(EMPTY_JOIN);
                setJoinConsent(false);
                onSuccess();
            } else {
                setJoinStatus('error');
            }
        } catch {
            // fetch itself failed (network error) -- without this the form
            // would be stuck on 'submitting' with the button disabled
            setJoinStatus('error');
        } finally {
            // Single-use token: clear it and re-challenge so a retry after an
            // error still has a valid one.
            setJoinToken(null);
            joinTurnstileRef.current?.reset();
        }
    }

    return (
        <section className={styles.joinSection}>
            <div className={styles.inner}>

                {(userRole === 'officer' || userRole === 'member') ? (

                    /*Signed in as member view*/
                    <div className={styles.memberPlaceholder}>
                        <h2>(PH!)You're already a Young Dem!(PH!)</h2>
                        <p>
                            (PH!)If you are looking for other groups that can help
                            you make a difference, check out some of our friends!(PH!)
                        </p>
                        <button
                            type={"button"}
                            className={styles.submitBtn}
                            onClick={() => navigate('/member')}
                            >
                            Want to add a new member?
                        </button>
                    </div>
                ) : (
                    /* Non-member form */
                    <>
                        <h2>Join NSVYD</h2>
                        <p>Interested in becoming a member? Fill out the form below and one of our officers will reach out!</p>

                        {joinStatus === 'success' && (
                            <p className={styles.statusSuccess} role={"status"}>
                                Thank you! Your information has been sent over. We will be in touch with you soon!
                            </p>
                        )}
                        {joinStatus === 'error' && (
                            <p className={styles.statusError} role={"alert"}>
                                Something went wrong. Please try again or contact us directly.
                            </p>
                        )}

                        <p className={styles.reqLegend}><span aria-hidden="true">*</span> Required</p>
                        <form className={styles.form} onSubmit={handleJoinSubmit}>
                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor={"firstName"}>First Name <span className={styles.reqMark} aria-hidden="true">*</span></label>
                                    <input type={"text"} id ="firstName" name={"firstName"}
                                           placeholder={"First Name"}
                                           value={joinData.firstName}
                                           onChange={handleJoinChange}
                                           required />
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor={"lastName"}>Last Name <span className={styles.reqMark} aria-hidden="true">*</span></label>
                                    <input type={"text"} id ="lastName" name={"lastName"}
                                           placeholder={"Last Name"}
                                           value={joinData.lastName}
                                           onChange={handleJoinChange}
                                           required />
                                </div>
                            </div>

                            <div className={styles.formRow}>
                                <div className={styles.formGroup}>
                                    <label htmlFor={"dobMonth"}>Date of Birth <span className={styles.reqMark} aria-hidden="true">*</span></label>
                                    <div className={styles.dobRow}>
                                        <select id={"dobMonth"} name={"dobMonth"} value={joinData.dobMonth}
                                                onChange={handleJoinChange} required aria-label="Month">
                                            <option value="">Month</option>
                                            {MONTHS.map((m, i) => (
                                                <option key={m} value={i + 1}>{m}</option>
                                            ))}
                                        </select>
                                        <select name={"dobDay"} value={joinData.dobDay}
                                                onChange={handleJoinChange} required aria-label="Day">
                                            <option value="">Day</option>
                                            {Array.from(
                                                { length: daysInMonth(joinData.dobMonth, joinData.dobYear) },
                                                (_, i) => i + 1
                                            ).map(d => (
                                                <option key={d} value={d}>{d}</option>
                                            ))}
                                        </select>
                                        <select name={"dobYear"} value={joinData.dobYear}
                                                onChange={handleJoinChange} required aria-label="Year">
                                            <option value="">Year</option>
                                            {Array.from(
                                                { length: new Date().getFullYear() - 1919 },
                                                (_, i) => new Date().getFullYear() - i
                                            ).map(y => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className={styles.formGroup}>
                                    <label htmlFor={"phone"}>Phone Number</label>
                                    <input type={"tel"} id ="phone" name={"phone"}
                                           value={joinData.phone}
                                           onChange={handleJoinChange}
                                    />
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor={"email"}>Email Address <span className={styles.reqMark} aria-hidden="true">*</span></label>
                                <input type={"email"} id ="email" name={"email"}
                                       placeholder={"Email Address"}
                                       value={joinData.email}
                                       onChange={handleJoinChange}
                                       required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor={"locality"}>Locality <span className={styles.reqMark} aria-hidden="true">*</span></label>
                                <select id={"locality"} name={"locality"}
                                        value={joinData.locality}
                                        onChange={handleJoinChange}
                                        required>
                                    <option value="">-- Select your area --</option>
                                    {LOCALITIES.map(locality => (
                                        <option key={locality} value={locality}>{locality}</option>
                                    ))}
                                </select>
                                {joinData.locality === 'Other' && (
                                    <input
                                        type={"text"}
                                        name={"localityOther"}
                                        placeholder={"Please specify your locality"}
                                        value={joinData.localityOther}
                                        onChange={handleJoinChange}
                                        required
                                        className={styles.localityOther}
                                    />
                                )}
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor={"registered"}>Are you currently registered to vote? <span className={styles.reqMark} aria-hidden="true">*</span></label>
                                <select id={"registered"} name={"registered"}
                                        value={joinData.registered} onChange={handleJoinChange} required>
                                    <option value={""} disabled>-Select-</option>
                                    <option value={"Yes"}>Yes</option>
                                    <option value={"No"}>No</option>
                                    <option value={"Not Sure"}>Not Sure</option>
                                </select>
                            </div>

                            <div className={styles.formGroup}>
                                <label>When are you most available for meetings during the week?</label>
                                <div className={styles.availabilityGroup}>
                                    {DAYS.map(day => (
                                        <label key={day} className={styles.checkLabel}>
                                            <input
                                                type={"checkbox"}
                                                name={"availability"}
                                                value={day}
                                                checked={joinData.availability.includes(day)}
                                                onChange={handleJoinChange}
                                            />
                                            {day}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor={"skills"}>Do you have any specific skills or talents?</label>
                                <textarea id={"skills"} name={"skills"} rows={3}
                                          placeholder={"e.g. graphic design, canvassing, social media, etc..."}
                                          value={joinData.skills} onChange={handleJoinChange}
                                          maxLength={5000} />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor={"issues"}>What issues are you most passionate about?</label>
                                <textarea id={"issues"} name={"issues"} rows={3}
                                          placeholder={"e.g. affordability, healthcare, education, etc..."}
                                          value={joinData.issues} onChange={handleJoinChange}
                                          maxLength={5000} />
                            </div>

                            {/* Honeypot — see the note on the contact form's copy */}
                            <div className={styles.honeypot} aria-hidden="true">
                                <label htmlFor={"join-company"}>Company (leave blank)</label>
                                <input
                                    type={"text"}
                                    id={"join-company"}
                                    name={"company"}
                                    value={joinData.company}
                                    onChange={handleJoinChange}
                                    tabIndex={-1}
                                    autoComplete={"off"}
                                />
                            </div>

                            <Turnstile
                                ref={joinTurnstileRef}
                                onVerify={setJoinToken}
                                onExpire={() => setJoinToken(null)}
                            />
                            <div className={styles.consentNote}>
                                <p className={styles.consentText}>We take security of your information very seriously. We encrypt your submission in transit and in storage, with access control limited to our officer team. We do not share this data with any third party.</p>
                                <input type="checkbox" id="consentCheckbox" name="consent"
                                       checked={joinConsent}
                                       onChange={(e) => setJoinConsent(e.target.checked)}
                                       required/>
                                <label htmlFor="consentCheckbox">I consent to share the above information with NSVYD</label>
                            </div>
                            <button
                                type={"submit"}
                                className={styles.submitBtn}
                                disabled={joinStatus === 'submitting' || !joinConsent}
                                >
                                {joinStatus === 'submitting' ? 'Submitting...' : 'Join NSVYD!'}
                            </button>

                        </form>
                    </>
                    )
                }
            </div>
        </section>
    );
}

export default JoinPanel;
