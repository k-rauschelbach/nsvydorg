// ballotData.js -- election / ballot reference data for the Elections map page
//
// This file is the single place to update each cycle:
//   1. Update ELECTION when the next election is scheduled
//   2. Add/edit RACES as candidates file (VA filing deadlines: primaries in
//      spring, general-election lineup final by late June)
//   3. Confirm district names with each registrar and fill DISTRICT_NAMES
//
// Sources for race/candidate info:
//   - VA Dept of Elections candidate lists: https://www.elections.virginia.gov/candidatepac-info/candidate-list/
//   - VPAP: https://www.vpap.org/elections/
//   - Ballotpedia locality pages

// ── Localities ──────────────────────────────────────────────
// Keyed by county FIPS code (COUNTYFP in the precinct GeoJSON).
// Colors are the map fill colors — chosen to be distinguishable,
// not to imply anything partisan.
export const LOCALITIES = {
    '069': { name: 'Frederick County',  color: '#4a7fd4' },
    '840': { name: 'Winchester City',   color: '#d46a5f' },
    '043': { name: 'Clarke County',     color: '#9b6fc9' },
    '187': { name: 'Warren County',     color: '#d9a441' },
    '171': { name: 'Shenandoah County', color: '#5aa876' },
};

// ── Local district names ────────────────────────────────────
// Virginia precinct numbers encode the local election district in
// their first digit (e.g. Frederick "502 - Bass-Hoover" is in county
// district 5; Winchester "402 - Rolling Hills" is in Ward 4).
//
// TODO: confirm the digit → district-name mapping against each
// registrar's precinct list, then fill in the names below.
// Example once confirmed:  '069': { 1: 'Back Creek', 2: 'Gainesboro', ... }
export const DISTRICT_NAMES = {
    '069': {},  // Frederick — 6 magisterial districts
    '840': {},  // Winchester — 4 wards
    '043': {},  // Clarke
    '187': {},  // Warren
    '171': {},  // Shenandoah — 6 districts
};

// ── Election ────────────────────────────────────────────────
export const ELECTION = {
    name: 'November 2026 General Election',
    date: '2026-11-03',
    displayDate: 'Tuesday, November 3, 2026',
    registrationUrl: 'https://vote.elections.virginia.gov/VoterInformation',
    citizenPortalUrl: 'https://www.elections.virginia.gov/citizen-portal/',
};

// ── Races ───────────────────────────────────────────────────
// Each race has a `scope` describing which precincts it appears for:
//   { type: 'statewide' }                      — every precinct
//   { type: 'coverage' }                       — whole 5-locality area (e.g. CD-6)
//   { type: 'locality', fips }                 — one county/city
//   { type: 'district', fips, district }       — one local district/ward
//
// Candidates: [] means the lineup isn't final yet — the UI shows a
// "candidates TBD" note instead of an empty list. Candidate shape:
//   { name, party, website }
export const RACES = [
    {
        id: 'us-senate-2026',
        office: 'U.S. Senate',
        area: 'Virginia (statewide)',
        scope: { type: 'statewide' },
        candidates: [],
    },
    {
        id: 'us-house-va06-2026',
        office: 'U.S. House of Representatives',
        area: '6th Congressional District',
        scope: { type: 'coverage' },
        candidates: [],
    },
    // Add state (SD/HD), county, school board, and town races here as
    // they are confirmed for the cycle. Local example:
    // {
    //     id: 'frederick-schoolboard-5-2027',
    //     office: 'School Board',
    //     area: 'Frederick County, District 5',
    //     scope: { type: 'district', fips: '069', district: 5 },
    //     candidates: [],
    // },
];

// ── Helpers ─────────────────────────────────────────────────

// Extract structured info from a precinct feature's GeoJSON properties.
export function precinctInfo(props) {
    const fips = props.COUNTYFP;
    // Pct looks like "502 - Bass-Hoover"
    const number = parseInt(props.precinct, 10);
    const districtNumber = Number.isNaN(number) ? null : Math.floor(number / 100);

    const isCity = fips === '840';
    const confirmedName = DISTRICT_NAMES[fips]?.[districtNumber];

    return {
        id: props.UNIQUE_ID,
        fips,
        locality: props.locality,
        precinct: props.precinct,
        districtNumber,
        // "Ward 4" for Winchester, "District 5" for the counties,
        // with the real name appended once confirmed with registrars
        districtLabel: districtNumber
            ? `${isCity ? 'Ward' : 'District'} ${districtNumber}${confirmedName ? ` — ${confirmedName}` : ''}`
            : null,
    };
}

// All races that appear on a given precinct's ballot.
export function racesForPrecinct(info) {
    return RACES.filter((race) => {
        const s = race.scope;
        switch (s.type) {
            case 'statewide': return true;
            case 'coverage':  return true;   // every covered precinct is in CD-6
            case 'locality':  return s.fips === info.fips;
            case 'district':  return s.fips === info.fips && s.district === info.districtNumber;
            default:          return false;
        }
    });
}
