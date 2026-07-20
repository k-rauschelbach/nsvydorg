// api/_lib/turnstile.js — Shared Cloudflare Turnstile verification.
//
// Files under api/ whose path contains a segment starting with '_' are NOT
// deployed as serverless functions by Vercel, so this module is importable
// by the real handlers without becoming a public endpoint itself.
//
// The browser widget produces a single-use token which the client sends in
// the request body. We hand that token to Cloudflare along with our secret
// key; Cloudflare tells us whether it came from a real browser session.
// The secret key never leaves the server.

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// True only when Cloudflare affirmatively confirms the token. Every failure
// path — missing token, network error, malformed response — returns false so
// the caller fails closed.
async function verifyTurnstile(token, remoteIp) {
    if (!token || typeof token !== 'string') return false;

    const body = new URLSearchParams({
        secret:   process.env.TURNSTILE_SECRET_KEY,
        response: token,
    });
    // Optional but recommended: lets Cloudflare factor in the caller's IP
    if (remoteIp) body.append('remoteip', remoteIp);

    try {
        const res = await fetch(VERIFY_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body,
        });
        if (!res.ok) {
            console.error('turnstile: siteverify HTTP', res.status);
            return false;
        }
        const data = await res.json();
        if (!data.success) {
            // 'error-codes' distinguishes an expired/duplicate token (normal,
            // user retried) from a bad secret key (deployment problem).
            console.error('turnstile: verification failed', data['error-codes']);
        }
        return data.success === true;
    } catch (err) {
        console.error('turnstile: siteverify request failed', err);
        return false;
    }
}

// Vercel puts the real client IP first in x-forwarded-for; everything after
// is proxy hops.
function clientIp(req) {
    const fwd = req.headers['x-forwarded-for'];
    return fwd ? String(fwd).split(',')[0].trim() : undefined;
}

// Bots fill in every field they find, including ones a human never sees.
// A non-empty value here means the submission is automated.
function isBot(body) {
    return Boolean(body?.company);
}

module.exports = { verifyTurnstile, clientIp, isBot };
