// Icons.js — Centralized SVG icon components.
// All icons use the Feather icon style: stroke="currentColor", fill="none",
// strokeWidth 2, rounded caps/joins, 24×24 viewBox.
//
// Usage:
//   import { IconEdit, IconEye, IconEyeOff, IconClose } from '../Icons/Icons';
//   <IconEdit />                  — renders at default 18px
//   <IconEdit size={24} />        — override size
//   <IconEdit aria-hidden={false} />  — override any SVG attribute via ...props
//
// To add a new icon: copy any existing export, replace the inner <path>/<line>
// elements with the new Feather/W3 SVG paths, and give it a descriptive name.

// Shared SVG wrapper props — applied to every icon
function iconBase(size, rest) {
    return {
        xmlns:          'http://www.w3.org/2000/svg',
        viewBox:        '0 0 24 24',
        fill:           'none',
        stroke:         'currentColor',
        strokeWidth:    '2',
        strokeLinecap:  'round',
        strokeLinejoin: 'round',
        width:          size,
        height:         size,
        'aria-hidden':  'true',
        ...rest,
    };
}

// ── Edit (pencil + square) ────────────────────────────────────────────────────
// Used: Dashboard greeting — edit display name button
export function IconEdit({ size = 18, ...props }) {
    return (
        <svg {...iconBase(size, props)}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
    );
}

// ── Eye (open) ────────────────────────────────────────────────────────────────
// Used: Password "Show" toggle state
export function IconEye({ size = 18, ...props }) {
    return (
        <svg {...iconBase(size, props)}>
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

// ── Eye Off (eye with diagonal slash) ─────────────────────────────────────────
// Used: Password "Hide" toggle state
export function IconEyeOff({ size = 18, ...props }) {
    return (
        <svg {...iconBase(size, props)}>
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );
}

// ── Close (×) ────────────────────────────────────────────────────────────────
// Available for: modal close buttons (LoginModal, Events modal)
export function IconClose({ size = 18, ...props }) {
    return (
        <svg {...iconBase(size, props)}>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}
