// api/create-user.js — Vercel serverless function
// Creates a Firebase Authentication user without logging out the current user.
// Firebase's browser SDK cannot do this — it requires the Admin SDK, which
// only runs server-side and therefore lives here.
//
// Security model:
//   - Caller must supply a valid Firebase ID token in the Authorization header.
//   - The token is verified against Firebase before any user is created.
//   - Caller must have the 'officer' custom claim — members cannot create accounts.
//   - Admin credentials (service account) are stored as Vercel env vars and
//     are NEVER sent to the browser.

const admin = require('firebase-admin');

// Lazy singleton — initialise once, reuse across warm invocations.
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
            clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            // Vercel stores multi-line env vars with literal \n — restore real newlines.
            privateKey:  (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
        }),
    });
}

// Map Firebase Admin error codes to user-friendly messages.
const FRIENDLY_ERRORS = {
    'auth/email-already-exists': 'A member with that email address already exists.',
    'auth/invalid-email':        'Please enter a valid email address.',
    'auth/invalid-password':     'Password must be at least 6 characters.',
};

module.exports = async function handler(req, res) {
    // Only accept POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    // Require a Bearer token — proves the caller is a signed-in Firebase member
    const authHeader = req.headers.authorization ?? '';
    if (!authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing authentication token.' });
    }

    // Verify the token and check that the caller is an officer
    let decodedToken;
    try {
        decodedToken = await admin.auth().verifyIdToken(authHeader.slice(7));
    } catch {
        return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }

    if (decodedToken.role !== 'officer') {
        return res.status(403).json({ error: 'Only officers can create new members.' });
    }

    // Validate request body
    const { email, password, displayName, role } = req.body ?? {};
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Create the new Firebase Authentication user
    let user;
    try {
        user = await admin.auth().createUser({
            email,
            password,
            ...(displayName && { displayName }),
        });
    } catch (err) {
        const code = err.errorInfo?.code;
        return res.status(400).json({
            error: FRIENDLY_ERRORS[code] || 'Failed to create member. Please try again.',
        });
    }

    // Set the role custom claim on the new user.
    // Only 'officer' is promoted explicitly; everything else becomes 'member'.
    const newRole = (role === 'officer') ? 'officer' : 'member';
    try {
        await admin.auth().setCustomUserClaims(user.uid, { role: newRole });
    } catch {
        // Non-fatal: user exists but claim failed. Return success with a warning.
        return res.status(200).json({
            success: true,
            email: user.email,
            warning: 'Account created but role could not be set. Contact an admin.',
        });
    }

    return res.status(200).json({ success: true, email: user.email });
};
