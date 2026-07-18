// build-districts.mjs — generate src/data/precinctDistricts.json
//
// For each precinct, takes a guaranteed-interior point (computed by
// mapshaper) and asks the US Census geographies API which districts
// contain it: Congressional, State Senate (upper), House of Delegates
// (lower), and incorporated place (city/town).
//
// Usage (from scripts/geodata/):
//   npx mapshaper nsv_precincts_full.geojson \
//     -each "ix=this.innerX; iy=this.innerY" \
//     -filter-fields "UNIQUE_ID,ix,iy" -o inner_points.json format=json
//   node build-districts.mjs
//
// Caveat: assignments are by interior point. If a precinct is ever split
// between two districts (rare in VA since the 2021 maps, but possible),
// the point's district wins — cross-check against registrar data when a
// new map cycle lands.

import { readFileSync, writeFileSync } from 'node:fs';

const points = JSON.parse(readFileSync(new URL('./inner_points.json', import.meta.url), 'utf8'));

// Census layer names as of the Public_AR_Current / Current_Current vintage.
// The congressional layer name changes with each Congress (118th, 119th, …),
// so match it by suffix.
function extractDistricts(geographies) {
    const layer = (pattern) => {
        const key = Object.keys(geographies).find((k) => pattern.test(k));
        return key ? geographies[key][0] : null;
    };

    const cong  = layer(/Congressional Districts$/);
    const upper = layer(/State Legislative Districts - Upper$/);
    const lower = layer(/State Legislative Districts - Lower$/);
    const place = layer(/^Incorporated Places$/);

    return {
        // GEOID is state(2) + district; strip the state prefix, keep zero-padding
        cd: cong ? cong.GEOID.slice(2) : null,
        sd: upper ? upper.GEOID.slice(2) : null,
        hd: lower ? lower.GEOID.slice(2) : null,
        // e.g. "Winchester city", "Front Royal town" — null outside any town.
        // Interior-point-based: a precinct partially inside a town may not
        // reflect that here.
        place: place ? place.NAME : null,
    };
}

async function queryPoint(lng, lat, attempt = 1) {
    const url =
        'https://geocoding.geo.census.gov/geocoder/geographies/coordinates' +
        `?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&layers=all&format=json`;
    try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        return extractDistricts(data.result.geographies);
    } catch (err) {
        if (attempt >= 3) throw err;
        await new Promise((r) => setTimeout(r, 2000 * attempt));
        return queryPoint(lng, lat, attempt + 1);
    }
}

const out = {};
for (const [i, p] of points.entries()) {
    out[p.UNIQUE_ID] = await queryPoint(p.ix, p.iy);
    process.stdout.write(`\r${i + 1}/${points.length}  ${p.UNIQUE_ID.padEnd(60)}`);
    await new Promise((r) => setTimeout(r, 150)); // be polite to the API
}
console.log();

const result = {
    _meta: {
        generated: new Date().toISOString().slice(0, 10),
        source: 'US Census geographies API (Public_AR_Current / Current_Current) at mapshaper interior points',
        fields: 'cd = US House district, sd = VA Senate, hd = House of Delegates, place = incorporated city/town at interior point',
    },
    precincts: out,
};

const dest = new URL('../../src/data/precinctDistricts.json', import.meta.url);
writeFileSync(dest, JSON.stringify(result, null, 2) + '\n');

// Sanity summary: district combinations per locality — districts should be
// contiguous, so each locality should have only a few combinations
const combos = {};
for (const [id, d] of Object.entries(out)) {
    const locality = id.split('-:-')[0];
    const combo = `CD-${d.cd} / SD-${d.sd} / HD-${d.hd}`;
    combos[locality] ??= {};
    combos[locality][combo] = (combos[locality][combo] ?? 0) + 1;
}
for (const [loc, c] of Object.entries(combos)) {
    console.log(`\n${loc}`);
    for (const [combo, n] of Object.entries(c)) console.log(`  ${combo}  ×${n}`);
}
console.log(`\nWrote ${Object.keys(out).length} precincts to src/data/precinctDistricts.json`);
