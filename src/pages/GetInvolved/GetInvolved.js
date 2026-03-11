// GetInvolved.js -- Join, volunteer, donate, and contact form page

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './GetInvolved.module.css';

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

// holder for involve cards
const WAYS = [
    {
        id: 1,
        title: '(PH!)Join as a Member',
        desc: '(PH!)Sign up to become an official member of NSVYD(PH!)',
        action: 'join',
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
        action: 'follow',
    },
];

// empty form data for join
const EMPTY_JOIN = {
    firstName: '', lastName: '',
    dobMonth: '', dobDay: '', dobYear: '',
    email: '', phone: '',
    locality: '', localityOther: '',
    registered: '', availability: [], skills: '', issues: '',
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
    
    // ======> action panels <======
    // null = none , 'join' = member form , 'follow' = social media links'
    const [activePanel, setActivePanel] = useState(null);
    
    // ======> join form <======
    const [joinData, setJoinData] = useState(EMPTY_JOIN);
    const [joinStatus, setJoinStatus] = useState('idle'); // idle, submitting, success, error
    
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
        setJoinStatus('submitting');
        //merge locality data, combine DOB parts, and combine name into one field
        const { localityOther, dobMonth, dobDay, dobYear, firstName, lastName, ...rest } = joinData;
        const dob = (dobYear && dobMonth && dobDay)
            ? `${dobYear}-${String(dobMonth).padStart(2,'0')}-${String(dobDay).padStart(2,'0')}`
            : '';
        const payload = {
            ...rest,
            name: `${firstName} ${lastName}`.trim(),
            dob,
            locality: joinData.locality === 'Other' ? localityOther : joinData.locality,
        };
        const res = await fetch('/api/join-member', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (res.ok) {
            setJoinStatus('success');
            setJoinData(EMPTY_JOIN);
            setActivePanel(null);
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
                                    className={`${styles.wayCard} ${styles.wayCardBtn} ${activePanel === way.action ? styles.wayCardActive : ''}`}
                                    onClick={() => setActivePanel(prev => prev === way.action ? null : way.action)}
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
            <div className={`${styles.joinFormWrap} ${activePanel === 'join' ? styles.joinFormOpen : ''}`}>
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

            {/* Follow us panel -- unfolds when action card is selected */}
            <div className={`${styles.joinFormWrap} ${activePanel === 'follow' ? styles.joinFormOpen : ''}`}>
                 <section className={styles.followSection}>
                     <div className={styles.inner}>
                         <h2>Follow Us</h2>
                         <p>(PH!)Stay connected to what we're up to on our social media accounts!(PH!)</p>
                         <div className={styles.socialBanners}>
                            <a
                                href={"https://www.facebook.com"}
                                target={"_blank"}
                                rel={"noopener noreferrer"}
                                className={`${styles.socialBanner} ${styles.socialFacebook}`}
                            >
                                <svg className={styles.socialChevron} viewBox="0 0 9 20" aria-hidden="true">
                                    <path d="M0,0 L8.5,10 L0,20 L0,15 L3.5,10 L0,5 Z"/>
                                </svg>
                                <svg className={styles.socialLogo} viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                                <span>Facebook</span>
                            </a>
                             <a
                                 href={"https://instagram.com"}
                                 target={"_blank"}
                                 rel={"noopener noreferrer"}
                                 className={`${styles.socialBanner} ${styles.socialInstagram}`}
                             >
                                 <svg className={styles.socialChevron} viewBox="0 0 9 20" aria-hidden="true">
                                     <path d="M0,0 L8.5,10 L0,20 L0,15 L3.5,10 L0,5 Z"/>
                                 </svg>
                                 <svg className={styles.socialLogo} viewBox="0 0 24 24" aria-hidden="true">
                                     <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                                 </svg>
                                 <span>Instagram</span>
                             </a>
                             <a
                                 href={"https://bsky.app"}
                                 target={"_blank"}
                                 rel={"noopener noreferrer"}
                                 className={`${styles.socialBanner} ${styles.socialBluesky}`}
                             >
                                 <svg className={styles.socialChevron} viewBox="0 0 9 20" aria-hidden="true">
                                     <path d="M0,0 L8.5,10 L0,20 L0,15 L3.5,10 L0,5 Z"/>
                                 </svg>
                                 <svg className={styles.socialLogo} viewBox="0 0 24 24" aria-hidden="true">
                                     <path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.815 2.736 3.713 3.66 6.383 3.364.136-.02.275-.039.415-.056-.138.022-.276.04-.415.056-3.912.58-7.387 2.005-2.83 7.078 5.013 5.19 6.87-1.113 7.823-4.308.953 3.195 2.05 9.175 7.412 4.539 4.256-3.81.516-6.658-3.584-7.476-.436-.063-.873-.118-1.312-.155.433.038.861.098 1.312.155 2.754.67 5.135-.79 5.762-3.655.207-.959.388-6.282.388-6.282C21.986 2.96 21.644 1.8 21 1.42c-.706-.408-1.557-.293-3.002.682-2.82 1.95-5.703 6.232-6 8.698z"/>
                                 </svg>
                                 <span>BlueSky</span>
                             </a>
                         </div>
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
