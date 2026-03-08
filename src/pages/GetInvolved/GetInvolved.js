// GetInvolved.js -- Join, volunteer, donate, and contact form page

import { useState } from 'react';
import styles from './GetInvolved.module.css';

const WAYS = [
    {
        id: 1,
        title: '(PH!)Join as a Member',
        desc: '(PH!)Sign up to become an official member of NSVYD(PH!)',
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

function GetInvolved() {
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
                        {WAYS.map((way) => (
                            <div key={way.id} className={styles.wayCard}>
                                <h3>{way.title}</h3>
                                <p>{way.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

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
