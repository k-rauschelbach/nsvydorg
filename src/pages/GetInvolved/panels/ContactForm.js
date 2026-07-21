import { useState, useRef } from 'react';
import Turnstile, { isTurnstileConfigured } from '../../../components/Turnstile/Turnstile';
import styles from '../GetInvolved.module.css';

function ContactForm() {

    // ======> contact form <======
    // useState tracks each form field so React controls the inputs (controlled components)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: '',
        company: '', // honeypot — see the hidden input in the contact form
    });

    // Turnstile token for the contact form. Null until the widget solves the
    // challenge, and cleared again after each submit since tokens are
    // single-use. The ref resets the widget so it issues a fresh one.
    const [contactToken, setContactToken] = useState(null);
    const contactTurnstileRef = useRef(null);

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

        // The server rejects a missing token anyway; catching it here gives a
        // clearer message than a generic failure.
        if (isTurnstileConfigured() && !contactToken) {
            alert('Please wait a moment for the verification check to finish, then try again.');
            return;
        }

        try {
            const res = await fetch('/api/send-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formData, turnstileToken: contactToken }),
            });
            if (res.ok) {
                alert('Thank you for your message! We will be in touch soon.');
                setFormData({ name: '', email: '', subject: '', message: '', company: '' }); // reset form to empty strings
            } else {
                alert('Something went wrong. Please try again later.')
            }
        } catch {
            // fetch itself failed (network error) -- surface the same message
            alert('Something went wrong. Please try again later.')
        } finally {
            // Tokens are single-use — burn this one and request a fresh
            // challenge whether or not the send succeeded, so a retry works.
            setContactToken(null);
            contactTurnstileRef.current?.reset();
        }
    }

    return (
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
                            maxLength={240}
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
                            maxLength={240}
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
                            maxLength={5000}
                        />
                    </div>

                    {/* Honeypot: positioned off-screen rather than
                        display:none, which bots learn to skip. Hidden from
                        screen readers and removed from the tab order so no
                        real user can reach it. */}
                    <div className={styles.honeypot} aria-hidden="true">
                        <label htmlFor="company">Company (leave blank)</label>
                        <input
                            type="text"
                            id="company"
                            name="company"
                            value={formData.company}
                            onChange={handleChange}
                            tabIndex={-1}
                            autoComplete="off"
                        />
                    </div>

                    <Turnstile
                        ref={contactTurnstileRef}
                        onVerify={setContactToken}
                        onExpire={() => setContactToken(null)}
                    />

                    <button type="submit" className={styles.submitBtn}>
                        Send Message
                    </button>

                </form>
            </div>
        </section>
    );
}

export default ContactForm;
