// GetInvolved.js -- Join, volunteer, donate, and contact form page

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './GetInvolved.module.css';

// possible localities
const LOCALITIES = [
    'Winchester City', 'Frederick County', 'Shenandoah County', 'Warren County', 'Clarke County', 'Other' ];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// holder for involve cards
const WAYS = [
    {
        id: 1,
        title: '(PH!)Join as a Member',
        desc: '(PH!)Sign up to become an official member of NSVYD(PH!)',
        action: true,
    },
    {
        id: 2,
        title: '(PH!)Volunteer',
        desc: '(PH!)',
    },
    {
        id: 3,
        title: '(PH!)Attend a Meeting',
        desc: "(PH!)Our monthly general meetings are open to everyone(PH!)",
    },
    {
        id: 4,
        title: '(PH!)Donate',
        desc: '(PH!)Financial contributions help us(PH!)',
    },
    {
        id: 5,
        title: '(PH!)Follow Us',
        desc: '(PH!)Stay connected on Facebook, Instagram, and BlueSky(PH!)',
    },
];

// empty form data for join
const EMPTY_JOIN = {
    firstName: '', lastName: '', dob: '', email: '', phone: '', locality: '', localityOther: '', registered: '', availability: [], skills: '', issues: '',
};

function GetInvolved() {
    
    // get logged in user role
    const { userRole } = useAuth();
    
    const navigate = useNavigate();
    
    // ======> contact form <======
    // useState tracks each form field so React controls the inputs (controlled components)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
    });

    // Called whenever any input changes.
    // e.target.name matches the name attribute on each <input>/<textarea>.
    function handleChange(e) {
        const { name, value } = e.target;
        // Spread the previous state and only overwrite the field that changed
        setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Called when the form is submitted
    async function handleSubmit(e) {
        e.preventDefault(); // Prevent the default browser behavior (page reload)
        const res = await fetch('/api/send-contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        if (res.ok) {
            alert('Thank you for your message! We will be in touch soon.');
            setFormData({ name: '', email: '', subject: '', message: '' }); // reset form to empty strings
        } else {
            alert('Something went wrong. Please try again later.')
        }

    }
    
    // ======> join form <======
    const [joinOpen, setJoinOpen] = useState(false);
    const [joinData, setJoinData] = useState(EMPTY_JOIN);
    const [joinStatus, setJoinStatus] = useState('idle'); // idle, submitting, success, error
    
    function handleJoinChange(e) {
        const { name, value, type, checked } = e.target;
        if ( type === 'checkbox') {
            setJoinData(prev => ({
                ...prev,
                availability: checked
                    ? [...prev.availability, value]
                    : prev.availability.filter(item => item !== value)
            }));
        } else {
            setJoinData(prev => ({ ...prev, [name]: value }));
        }
    }
    
    async function handleJoinSubmit(e) {
        e.preventDefault();
        setJoinStatus('submitting');
        //merge locality data, prevent both fields sending
        const { localityOther, ...rest } = joinData;
        const payload = { ...rest, locality: joinData.locality === 'Other' ? localityOther : joinData.locality };
        const res = await fetch('/api/join-member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            setJoinStatus('success');
            setJoinData(EMPTY_JOIN);
            setJoinOpen(false);
        } else {
            setJoinStatus('error');
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
                                    className={`${styles.wayCard} ${styles.wayCardBtn} ${joinOpen ? styles.wayCardActive : ''}`}
                                    onClick={() => setJoinOpen(prev => !prev)}
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

            {/* Membership form -- unfolds when action card is selected */}
            <div className={`${styles.joinFormWrap} ${joinOpen ? styles.joinFormOpen : ''}`}>
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
                                
                                <form className={styles.form} onSubmit={handleJoinSubmit}>
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor={"firstName"}>First Name</label>
                                            <input type={"text"} id ="firstName" name={"firstName"}
                                                   placeholder={"First Name"}
                                                   value={joinData.firstName}
                                                   onChange={handleJoinChange}
                                                   required />
                                        </div>
                                        <div className={styles.formGroup}>
                                            <label htmlFor={"lastName"}>Last Name</label>
                                            <input type={"text"} id ="lastName" name={"lastName"}
                                                   placeholder={"Last Name"}
                                                   value={joinData.lastName}
                                                   onChange={handleJoinChange}
                                                   required />
                                        </div>
                                    </div>
                                    
                                    <div className={styles.formRow}>
                                        <div className={styles.formGroup}>
                                            <label htmlFor={"dob"}>Date of Birth</label>
                                            <input type={"date"} id ="dob" name={"dob"}
                                                   value={joinData.dob}
                                                   onChange={handleJoinChange}
                                                   required />
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
                                        <label htmlFor={"email"}>Email Address</label>
                                        <input type={"email"} id ="email" name={"email"}
                                               placeholder={"Email Address"}
                                               value={joinData.email}
                                               onChange={handleJoinChange}
                                               required
                                        />
                                    </div>
                                    
                                    <div className={styles.formGroup}>
                                        <label htmlFor={"locality"}>Locality</label>
                                        <select id={"locality"} name={"locality"}
                                                value={joinData.locality}
                                                onChange={handleJoinChange}
                                                required>
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
                                        <label htmlFor={"registered"}>Are you currently registered to vote?</label>
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
                                                  value={joinData.skills} onChange={handleJoinChange} />
                                    </div>
                                    
                                    <div className={styles.formGroup}>
                                        <label htmlFor={"issues"}>What issues are you most passionate about?</label>
                                        <textarea id={"issues"} name={"issues"} rows={3}
                                                  placeholder={"e.g. affordability, healthcare, education, etc..."}
                                                  value={joinData.issues} onChange={handleJoinChange} />
                                    </div>
                                    
                                    <button
                                        type={"submit"}
                                        className={styles.submitBtn}
                                        disabled={joinStatus === 'submitting'}
                                        >
                                        {joinStatus === 'submitting' ? 'Submitting...' : 'Join NSVYD!'}
                                    </button>
                                    
                                </form>
                            </>
                            )
                        }
                    </div>
                </section>
            </div>

            {/* Contact form */}
            <section className={styles.contactSection}>
                <div className={styles.inner}>
                    <h2>Send Us a Message</h2>
                    <p>Have a question or want to connect? Fill out the form below and we will get back to you.</p>

                    {/* onSubmit fires handleSubmit when the user clicks "Send Message" */}
                    <form className={styles.form} onSubmit={handleSubmit}>

                        <div className={styles.formGroup}>
                            {/* htmlFor must match the input's id for screen readers */}
                            <label htmlFor="name">Full Name</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder="Your full name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="subject">Subject</label>
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                placeholder="How can we help?"
                                value={formData.subject}
                                onChange={handleChange}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="message">Message</label>
                            {/* textarea uses rows to set default height */}
                            <textarea
                                id="message"
                                name="message"
                                rows={5}
                                placeholder="Your message..."
                                value={formData.message}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn}>
                            Send Message
                        </button>

                    </form>
                </div>
            </section>

        </div>
    );
}

export default GetInvolved;
