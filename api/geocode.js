// api/geocode.js — Vercel serverless function
//
// Proxies address geocoding to the US Census Bureau geocoder for the
// Elections precinct-finder. The Census geocoder is free, keyless, and the
// most accurate source for US street addresses, but it does not send CORS
// headers — so the browser can't call it directly. This proxy makes the
// request same-origin. The client falls back to Nominatim if this
// endpoint is unavailable (e.g. running under the CRA dev server, which
// doesn't serve /api functions).

module.exports = async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed.' });
    }

    const address = (req.query.address ?? '').toString().trim();
    if (!address || address.length > 200) {
        return res.status(400).json({ error: 'A valid address is required.' });
    }

    const url =
        'https://geocoding.geo.census.gov/geocoder/locations/onelineaddress' +
        `?address=${encodeURIComponent(address)}&benchmark=Public_AR_Current&format=json`;

    try {
        const upstream = await fetch(url);
        if (!upstream.ok) {
            return res.status(502).json({ error: 'Geocoding service unavailable.' });
        }

        const data = await upstream.json();
        const match = data?.result?.addressMatches?.[0];

        // Normalize to the minimal shape the client needs;
        // match: null means the address couldn't be found
        if (!match) {
            return res.status(200).json({ match: null });
        }

        return res.status(200).json({
            match: {
                lat: match.coordinates.y,
                lng: match.coordinates.x,
                label: match.matchedAddress,
            },
        });
    } catch (err) {
        console.error('geocode: Census geocoder error:', err);
        return res.status(502).json({ error: 'Geocoding service unavailable.' });
    }
};
