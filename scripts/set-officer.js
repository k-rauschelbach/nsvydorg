// scripts/set-officer.js — One-time local bootstrap script.
// Sets the 'officer' custom claim on a Firebase Auth user so they gain
// access to officer-only features (e.g., the Add Member form) in the
// member portal.
//
// Usage:
//   node scripts/set-officer.js your@email.com
//
// Requirements:
//   • Run from the project root (where .env.local lives)
//   • .env.local must contain:
//       FIREBASE_ADMIN_PROJECT_ID
//       FIREBASE_ADMIN_CLIENT_EMAIL
//       FIREBASE_ADMIN_PRIVATE_KEY
//   • firebase-admin must be installed
//
// After running: sign out of the member portal and sign back in.
// The 'Add Member' button will then appear on the dashboard.

const fs    = require('fs');
const path  = require('path');
const admin = require('firebase-admin');

// ── Parse .env.local manually ─────────────────────────────────────────────────
// Deliberately avoids requiring dotenv — not a listed project dependency.
const envPath = path.resolve(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
    console.error('Error: .env.local not found at', envPath);
    process.exit(1);
}

const envLines = fs.readFileSync(envPath, 'utf8').split('\n');
for (const line of envLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key   = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^"(.*)"$/, '$1');
    process.env[key] = value;
}

// ── Validate required env vars ────────────────────────────────────────────────
const required = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
];
const missing = required.filter(k => !process.env[k]);
if (missing.length) {
    console.error('Error: Missing env vars in .env.local:', missing.join(', '));
    process.exit(1);
}

// ── Validate CLI argument ─────────────────────────────────────────────────────
const email = process.argv[2];
if (!email || !email.includes('@')) {
    console.error('Usage: node scripts/set-officer.js your@email.com');
    process.exit(1);
}

// ── Initialize Firebase Admin ─────────────────────────────────────────────────
admin.initializeApp({
    credential: admin.credential.cert({
        projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        // Vercel (and some editors) store multi-line env vars with literal \n
        privateKey:  (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
});

// ── Set custom claim ──────────────────────────────────────────────────────────
(async () => {
    try {
        const user = await admin.auth().getUserByEmail(email);
        await admin.auth().setCustomUserClaims(user.uid, { role: 'officer' });

        console.log(`\u2713 Role 'officer' set for ${email} (uid: ${user.uid})`);
        console.log('  \u2192 Sign out of the member portal and sign back in to activate the role.');
    } catch (err) {
        if (err.code === 'auth/user-not-found') {
            console.error(`Error: No Firebase user found for email: ${email}`);
        } else {
            console.error('Error:', err.message);
        }
        process.exit(1);
    }
})();
