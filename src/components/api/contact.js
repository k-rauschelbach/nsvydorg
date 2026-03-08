// contact.js -- API calls for Resend email

// declare resend and attach API key
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
    // error if POST fails
    if (req.method !== 'POST') return res.status(405).end();
    
    // validate that all required fields are present
    const { name, email, subject, message } = req.body ?? {};
    if (!name || !email || !message) return res.status(400).json({ error: 'Name, email, and message are required.' });
    
    const { error } = await resend.emails.send({
        from: 'noreply@nsvyd.org', //(PH!) sender email
        to: process.env.CONTACT_FORM_TO_EMAIL, //(PH!) recipient email vp@nsvyd.org
        subject: subject || `Contact from: ${name}`, // default subject line to sender name
        html: `<p><strong>From:</strong> ${name} (${email})</p><p>${message}</p>`,
        replyTo: email,
    });
    
    // error if email fails
    if (error) return res.status(500).json({ error: 'Failed to send message.' });
    
    return res.status(200).json({ success: true });
}