// Turnstile.js — Cloudflare Turnstile widget.
//
// Renders the "verify you're human" checkbox and hands the resulting token
// up to the parent form, which sends it to the API for server-side
// verification. Turnstile usually resolves silently without the user
// clicking anything.
//
// Tokens are single-use and expire after ~5 minutes, so the parent must
// call reset() via ref after each submit before the form can be sent again.
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// ?render=explicit stops the script auto-scanning the DOM, so we control
// exactly when and where the widget mounts.
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

// Site key is public by design — it identifies the widget, it doesn't
// authorize anything. The secret key lives only in the serverless function.
const SITE_KEY = process.env.REACT_APP_TURNSTILE_SITE_KEY;

// Module-level promise so two forms on one page share a single <script> tag
// instead of racing to append their own.
let scriptPromise = null;

function loadTurnstile() {
    if (window.turnstile) return Promise.resolve();
    if (scriptPromise) return scriptPromise;

    scriptPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src   = SCRIPT_SRC;
        script.async = true;
        script.defer = true;
        script.onload  = resolve;
        script.onerror = () => {
            scriptPromise = null; // allow a retry on the next mount
            reject(new Error('Turnstile script failed to load'));
        };
        document.head.appendChild(script);
    });
    return scriptPromise;
}

// Lets forms detect a missing site key and skip gating submission on a
// widget that will never appear.
export function isTurnstileConfigured() {
    return Boolean(SITE_KEY);
}

const Turnstile = forwardRef(function Turnstile({ onVerify, onExpire }, ref) {
    const containerRef = useRef(null);
    const widgetIdRef  = useRef(null);

    // Callbacks are stashed in refs so a parent re-render (which creates new
    // function identities) never tears down and re-renders the widget —
    // that would throw away a token the user already earned.
    const onVerifyRef = useRef(onVerify);
    const onExpireRef = useRef(onExpire);
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;

    useImperativeHandle(ref, () => ({
        reset() {
            if (widgetIdRef.current !== null && window.turnstile) {
                window.turnstile.reset(widgetIdRef.current);
            }
        },
    }), []);

    useEffect(() => {
        if (!SITE_KEY) return;

        // Guards the async gap: StrictMode's double-invoke in development
        // can unmount before the script resolves.
        let cancelled = false;

        loadTurnstile()
            .then(() => {
                if (cancelled || !containerRef.current) return;
                if (widgetIdRef.current !== null) return; // already rendered

                widgetIdRef.current = window.turnstile.render(containerRef.current, {
                    sitekey: SITE_KEY,
                    callback: (token) => onVerifyRef.current?.(token),
                    // Both paths clear the parent's token so a stale value is
                    // never submitted; the widget re-challenges on its own.
                    'expired-callback': () => onExpireRef.current?.(),
                    'error-callback':   () => onExpireRef.current?.(),
                });
            })
            .catch(() => {
                // Script blocked (ad blocker, offline). The widget stays
                // absent and the form's own guard reports the failure.
            });

        return () => {
            cancelled = true;
            if (widgetIdRef.current !== null && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, []);

    if (!SITE_KEY) return null;

    return <div ref={containerRef} />;
});

export default Turnstile;
