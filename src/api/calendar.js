const API_KEY = process.env.REACT_APP_GOOGLE_CALENDAR_API_KEY;
const CALENDAR_ID = process.env.REACT_APP_GOOGLE_CALENDAR_ID;

// No lookbehind here: Safari < 16.4 fails to parse it and the whole bundle
// dies at load. Match any 2+ hash run instead; the helpers below treat runs
// of 3+ hashes as plain text so only an exact ## counts as a tag.
const TAG_RE = /#{2,}[a-z0-9][a-z0-9-]*/gi;

export function parseTags(description) {
    if (!description) return [];
    const stripped = description.replace(/<[^>]*>/g, '');
    const matches = stripped.match(TAG_RE);
    if (!matches) return [];
    return matches
        .filter((tag) => !tag.startsWith('###'))
        .map((tag) => tag.slice(2).toLowerCase());
}

export function cleanDescription(html) {
    if (!html) return '';
    return html
        .replace(/<[^>]*>/g, '')
        .replace(TAG_RE, (m) => (m.startsWith('###') ? m : ''))
        .replace(/ {2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

export function snippet(cleanText, max = 140) {
    if (!cleanText) return '';
    return cleanText.length > max ? cleanText.slice(0, max) + '…' : cleanText;
}

export function parseLocalDate(dateStr) {
    if (!dateStr) return new Date(NaN);
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function normalizeEvent(item) {
    const raw = item.description || '';
    return {
        id: item.id,
        title: item.summary || '(untitled event)',
        start: item.start?.dateTime
            ? new Date(item.start.dateTime)
            : parseLocalDate(item.start?.date),
        end: item.end?.dateTime ? new Date(item.end.dateTime) : null,
        allDay: !item.start?.dateTime,
        location: item.location || '',
        description: cleanDescription(raw),
        tags: parseTags(raw),
        recurringEventId: item.recurringEventId || null,
    };
}

export function isCalendarConfigured() {
    return Boolean(API_KEY && CALENDAR_ID);
}

export async function fetchUpcomingEvents() {
    if (!API_KEY || !CALENDAR_ID) return [];
    const url =
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events` +
        `?key=${API_KEY}&timeMin=${new Date().toISOString()}` +
        `&singleEvents=true&orderBy=startTime&maxResults=50`;
    try {
        const res = await fetch(url);
        if (!res.ok) return [];
        const data = await res.json();
        return (data.items || []).map(normalizeEvent);
    } catch {
        return [];
    }
}

export function dedupeSeries(events) {
    const seen = new Map();
    const result = [];
    for (const ev of events) {
        const key = ev.recurringEventId || ev.title.toLowerCase().trim().replace(/\s+/g, ' ');
        if (!seen.has(key)) {
            seen.set(key, true);
            result.push(ev);
        }
    }
    return result;
}

const KNOWN_SLUGS = {
    nsvyd: 'Our Meetings',
    partner: 'Partner & Community Groups',
    gov: 'Public & Government Meetings',
};

const KNOWN_ORDER = ['nsvyd', 'partner', 'gov'];

function toTitleCase(str) {
    return str
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

export function groupMeetings(events) {
    const meetingEvents = events.filter((ev) =>
        ev.tags.some((t) => t === 'meeting' || t.startsWith('meeting-'))
    );
    const deduped = dedupeSeries(meetingEvents);

    const buckets = new Map();
    for (const ev of deduped) {
        const meetingTags = ev.tags.filter((t) => t === 'meeting' || t.startsWith('meeting-'));
        for (const tag of meetingTags) {
            const slug = tag === 'meeting' ? 'other' : tag.slice(8);
            if (!buckets.has(slug)) buckets.set(slug, []);
            buckets.get(slug).push(ev);
        }
    }

    const groups = [];
    for (const slug of KNOWN_ORDER) {
        if (buckets.has(slug)) {
            groups.push({ slug, label: KNOWN_SLUGS[slug], events: buckets.get(slug) });
            buckets.delete(slug);
        }
    }

    const unknownSlugs = [...buckets.keys()]
        .filter((s) => s !== 'other')
        .sort();
    for (const slug of unknownSlugs) {
        const label = toTitleCase(slug.replace(/-/g, ' '));
        groups.push({ slug, label, events: buckets.get(slug) });
    }

    if (buckets.has('other')) {
        groups.push({ slug: 'other', label: 'Other Meetings', events: buckets.get('other') });
    }

    return groups.filter((g) => g.events.length > 0);
}
