// api/send-contact.js — Vercel serverless function
// Receives contact form submissions from the public /get-involved page and
// forwards them as emails via Resend to the officers' inbox.
//
// This is a PUBLIC endpoint — no authentication required.
// The form is publicly accessible on the website.
//
// Required environment variables (set in .env.local and Vercel dashboard):
//   RESEND_API_KEY          — from resend.com dashboard (Sending access only)
//   CONTACT_FORM_TO_EMAIL   — destination inbox, e.g. info@nsvyd.org
//   CONTACT_FORM_FROM_EMAIL — verified sending address, e.g. contact@nsvyd.org
//
// The submitter's email is set as Reply-To so officers can reply directly
// from their inbox without needing to copy/paste the sender's address.

const { Resend } = require('resend');

module.exports = async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    // Validate required env vars — fail fast with a clear server-side error
    if (!process.env.RESEND_API_KEY || !process.env.CONTACT_FORM_TO_EMAIL || !process.env.CONTACT_FORM_FROM_EMAIL) {
        console.error('send-contact: Missing required environment variable(s).');
        return res.status(500).json({ error: 'Server configuration error. Please contact us directly.' });
    }

    // Validate request body
    const { name, email, subject, message } = req.body ?? {};

    if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    // Basic email format check — the browser already validates, but the API
    // should never trust client-side validation alone.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    // Send the email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        await resend.emails.send({
            from:    process.env.CONTACT_FORM_FROM_EMAIL,
            to:      process.env.CONTACT_FORM_TO_EMAIL,
            replyTo: email,  // officers hit Reply → goes directly to the submitter
            subject: subject
                ? `[Contact] ${subject}`
                : 'New message from NSVYD website',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; color: #1a1a2e;">
                    <h2 style="color: #1a237e; margin-top: 0;">
                        New Contact Form Submission
                    </h2>
                    <table style="width:100%; border-collapse:collapse;">
                        <tr>
                            <td style="padding:6px 0; font-weight:600; width:80px;">Name</td>
                            <td style="padding:6px 0;">${escapeHtml(name)}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; font-weight:600;">Email</td>
                            <td style="padding:6px 0;">${escapeHtml(email)}</td>
                        </tr>
                        ${subject ? `
                        <tr>
                            <td style="padding:6px 0; font-weight:600;">Subject</td>
                            <td style="padding:6px 0;">${escapeHtml(subject)}</td>
                        </tr>` : ''}
                    </table>
                    <hr style="border:none; border-top:1px solid #e0e0e0; margin:16px 0;" />
                    <p style="font-weight:600; margin:0 0 8px;">Message</p>
                    <p style="white-space:pre-wrap; margin:0; line-height:1.6;">
                        ${escapeHtml(message)}
                    </p>
                    <hr style="border:none; border-top:1px solid #e0e0e0; margin:24px 0 16px;" />
                    <p style="font-size:12px; color:#666; margin:0;">
                        Sent via the NSVYD website contact form. Reply to this email to respond directly to ${escapeHtml(name)}.
                    </p>
                </div>
            `,
        });

        return res.status(200).json({ success: true });
    } catch (err) {
        console.error('send-contact: Resend API error:', err);
        return res.status(500).json({ error: 'Failed to send message. Please try again.' });
    }
};

// Prevent HTML injection from form input appearing in the email body
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
