//join-member.js -- API call to send new member information to Membership google sheet

//ENV Required:
//RESEND_API_KEY
//CONTACT_FORM_FROM_EMAIL
//CONTACT_FORM_TO_EMAIL (PH!)If we want these to go to a different email address from the general contact form
//APPS_SCRIPT_URL for existing sheet

const {Resend} = require('resend')

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({error: 'Method not allowed."'}); //POST only enforcement
    }

    //check for required env vars
    if (!process.env.RESEND_API_KEY || !process.env.CONTACT_FORM_FROM_EMAIL || !process.env.CONTACT_FORM_TO_EMAIL || !process.env.APPS_SCRIPT_URL) {
        console.error('join-member: Missing required environment variable(s).');
        return res.status(500).json({error: 'Server configuration error. Please contact us directly.'});
    }

    const {
        name, dob, email, phone, locality, registered, availability, skills, issues,
    } = req.body ?? {};

    //check for required fields -- name, dob, email, locality, registered to vote
    if (!name || !dob || !email || !locality || !registered) {
        return res.status(400).json({error: 'Required fields are missing.'});
    }
    
    //check for valid email configuration
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({error: 'Please enter a valid email address.'});
    }
    
    // data structure for submission to google sheet, creation of timestamp
    const timestamp = new Date().toISOString();
    const payload = {
        timestamp,
        name, dob, email,
        phone: phone || '',
        locality, registered,
        availability: Array.isArray(availability) ? availability : [],
        skills: skills || '',
        issues: issues || '',
    };
    
    // best effort write to google sheet
    // Apps Script redirects POST with 302; Node fetch switches to GET on redirect.
    // Use redirect:'manual' and re-POST to the Location header to keep the method.
    try {
        const body = JSON.stringify(payload);
        const headers = { 'Content-Type': 'application/json' };
        let scriptRes = await fetch(process.env.APPS_SCRIPT_URL, {
            method: 'POST', headers, body, redirect: 'manual',
        });
        if (scriptRes.status === 302 || scriptRes.status === 301) {
            const location = scriptRes.headers.get('location');
            scriptRes = await fetch(location, { method: 'POST', headers, body });
        }
        if (!scriptRes.ok) {
            console.error('join-member: Failed to write to Google Sheets.', scriptRes.status);
        }
    } catch (err) {
        console.error('join-member: Apps Script fetch failed.', err);
        // no return, send email with information if failed
    }
    
    // send email notification to officers
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const row = (label, value) => value
        ? `<tr>
                <td style="padding:6px 0; font-weight:600;width:180px;vertical-align:top;">${label}</td>
                <td style="padding:6px 0;">${escapeHtml(String(value))}</td>
            </tr>`
        : '';
    
    try {
        await resend.emails.send({
            from:    process.env.CONTACT_FORM_FROM_EMAIL,
            to:      process.env.CONTACT_FORM_TO_EMAIL.split(',').map(e => e.trim()),
            replyTo: email,
            subject: `[New Member Request] ${name}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; color: #1a1a2e;">
                    <h2 style="color: #1a237e; margin-top: 0;">New Membership Entry</h2>
                    <table style="width:100%;border-collapse:collapse;">
                        ${row('Submitted',  new Date(timestamp).toLocaleString('en-US'))}
                        ${row('Name', name)}
                        ${row('Date of Birth',  dob)}
                        ${row('Email',  email)}
                        ${row('Phone',  phone)}
                        ${row('Locality',  locality)}
                        ${row('Registered to Vote',  registered)}
                        ${row('Availability',   payload.availability.join(', '))}
                        ${row('Skills / Talents',   skills)}
                        ${row('Issues',   issues)}
                    </table>
                    <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0 16px;" />
                    <p style="font-size:12px;color:#666;margin:0;">
                        Sent via the NSVYD website new member form.
                        Reply to this email to respond directly to ${escapeHtml(name)} at ${escapeHtml(email)}
                    </p>
                </div>`,
            });
            return res.status(200).json({success: true});
    } catch (err) {
        console.error('join-member: Resend API error:', err);
        return res.status(500).json({error: 'Failed to send officer notification. Please try again.'});
    }
};

//helper function for escaping html special characters
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}