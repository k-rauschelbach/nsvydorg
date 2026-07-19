// api/geocode.js — Vercel serverless function
//
// Proxies address geocoding to the US Census Bureau geocoder for the
// Elections precinct-finder. The Census geocoder is free, keyless, and the
// most accurate source for US street addresses, but it does not send CORS
// headers — so the browser can't call it directly. This proxy makes the
// request same-origin. The client falls back to Nominatim if this
// endpoint is unavailable (e.g. running under the CRA dev server, which
// doesn't serve /api functions).
//
// Only matches inside the covered localities are returned, tested
// against the same precinct polygons the map renders. A bounding box
// won't do here: its corners overlap neighboring counties, and the
// directional retry below must know that a match in one of those
// slivers is NOT covered, or it would never fire.

const fs = require('fs');
const path = require('path');

// fs.readFileSync instead of require(): Node's require can't parse the
// .geojson extension, and Vercel's file tracer picks this pattern up so
// the data ships with the function
const PRECINCTS = JSON.parse(
    fs.readFileSync(
        path.join(__dirname, '..', 'public', 'data', 'precincts.geojson'),
        'utf8'
    )
);

// Census caps addressMatches well below this; a plain "Main St" query
// yields a handful of in-coverage towns at most
const MAX_MATCHES = 10;

// Census matches street names literally: "150 Main St" will never match
// "150 N Main St". Directional prefixes tried when the plain query has
// none and finds nothing in coverage.
const DIRECTIONALS = ['N', 'S', 'E', 'W'];

// ── Point-in-polygon (ray casting; same logic as Elections.js) ──
// GeoJSON positions are [lng, lat].

function pointInRing(lng, lat, ring) {
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        if (
            (yi > lat) !== (yj > lat) &&
            lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi
        ) {
            inside = !inside;
        }
    }
    return inside;
}

// Outer ring (index 0) minus hole rings (indexes 1+)
function pointInPolygonCoords(lng, lat, polygonCoords) {
    if (!pointInRing(lng, lat, polygonCoords[0])) return false;
    for (let i = 1; i < polygonCoords.length; i++) {
        if (pointInRing(lng, lat, polygonCoords[i])) return false;
    }
    return true;
}

function inCoverage(lng, lat) {
    for (const feature of PRECINCTS.features) {
        const { type, coordinates } = feature.geometry;
        const polys = type === 'Polygon' ? [coordinates] : coordinates;
        for (const poly of polys) {
            if (pointInPolygonCoords(lng, lat, poly)) return true;
        }
    }
    return false;
}

// ── Census lookup ───────────────────────────────────────────

// "150 main street" → ["150", "main street"]; null when the address
// doesn't start with a house number (nothing to prefix a directional to)
function splitHouseNumber(address) {
    const m = address.match(/^(\d+[a-z]?)\s+(.+)$/i);
    return m ? [m[1], m[2]] : null;
}

// True when the street already leads with a directional ("150 N Main St",
// "150 North Main St") — no point trying the variants
function hasDirectional(address) {
    const parts = splitHouseNumber(address);
    return parts !== null && /^(n|s|e|w|north|south|east|west)\.?\s/i.test(parts[1]);
}

async function censusMatches(address) {
    const url =
        'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress' +
        `?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;
    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`Census geocoder HTTP ${upstream.status}`);
    const data = await upstream.json();
    return data?.result?.addressMatches ?? [];
}

// Distinct in-coverage matches, appended to `matches` (capped, deduped
// by label)
function collectInCoverage(all, matches, seen) {
    for (const m of all) {
        if (matches.length >= MAX_MATCHES) break;
        const lng = m.coordinates.x;
        const lat = m.coordinates.y;
        if (seen.has(m.matchedAddress)) continue;
        if (!inCoverage(lng, lat)) continue;
        seen.add(m.matchedAddress);
        matches.push({ lat, lng, label: m.matchedAddress });
    }
}

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    const address = (req.query.address ?? '').toString().trim();
    if (!address || address.length > 200) {
        return res.status(400).json({ error: 'A valid address is required.' });
    }

    try {
        // An ambiguous address (no town given) can match dozens of places
        // statewide. Return every distinct in-coverage match so the
        // client can offer a choice when there's more than one.
        const all = await censusMatches(address);
        const seen = new Set();
        const matches = [];
        collectInCoverage(all, matches, seen);
        let anyMatch = all.length > 0;

        // Nothing in coverage and no directional given: the address may
        // exist here only in directional form ("150 Main St" → "150 N
        // Main St, Woodstock"). Try the four variants and pool their
        // in-coverage hits.
        const parts = splitHouseNumber(address);
        if (matches.length === 0 && parts && !hasDirectional(address)) {
            const variants = await Promise.all(
                DIRECTIONALS.map((d) =>
                    censusMatches(`${parts[0]} ${d} ${parts[1]}`).catch(() => [])
                )
            );
            for (const variantAll of variants) {
                anyMatch = anyMatch || variantAll.length > 0;
                collectInCoverage(variantAll, matches, seen);
            }
        }

        // outsideCoverage: the address geocoded fine but every match is
        // away from the coverage area — the client can say so instead of
        // "not found"
        return res.status(200).json({
            matches,
            outsideCoverage: matches.length === 0 && anyMatch,
        });
    } catch (err) {
        console.error('geocode: Census geocoder error:', err);
        return res.status(502).json({ error: 'Geocoding service unavailable.' });
    }
};
