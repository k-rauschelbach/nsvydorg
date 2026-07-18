// build-towns.mjs — generate src/data/precinctTowns.json
//
// Overlays incorporated town boundaries (nsv_towns.geojson, from Census
// TIGER places clipped to the coverage area) against the precinct polygons
// and records, per precinct, which towns it overlaps and whether the
// overlap is 'full' (entire precinct inside the town) or 'partial'.
//
// Town limits do not follow precinct lines: a precinct can contain both
// in-town and out-of-town voters, who get different ballots. This file
// answers "could a voter in this precinct have town races?" — the exact
// per-address answer comes from a point-in-polygon test against
// public/data/towns.geojson at search time.
//
// Usage (from scripts/geodata/):  node build-towns.mjs
// Regenerate after precinct boundary changes or town annexations
// (TIGER places update annually).

import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = (f) => fileURLToPath(new URL(f, import.meta.url));
const sh = (cmd) => execSync(cmd, { stdio: ['ignore', 'pipe', 'inherit'], shell: true });

// Overlap smaller than BOTH thresholds is treated as a boundary-alignment
// sliver (TIGER town edges and precinct edges are digitized independently
// and rarely coincide exactly), not a real overlap
const MIN_RATIO = 0.005;   // 0.5% of the precinct's area
const MIN_AREA_M2 = 50000; // 0.05 km²
// Above this ratio the precinct is considered entirely inside the town
const FULL_RATIO = 0.99;

const towns = JSON.parse(readFileSync(here('./nsv_towns.geojson'), 'utf8'));
const work = mkdtempSync(join(tmpdir(), 'nsv-towns-'));

try {
    // Full area of every precinct, via mapshaper so piece areas and full
    // areas come from the same area calculation
    const fullOut = join(work, 'full.json');
    sh(`npx -y mapshaper "${here('./nsv_precincts_full.geojson')}" -each "fullArea=this.area" -filter-fields "UNIQUE_ID,fullArea" -o "${fullOut}" format=json`);
    const fullArea = Object.fromEntries(
        JSON.parse(readFileSync(fullOut, 'utf8')).map((r) => [r.UNIQUE_ID, r.fullArea])
    );

    // precinct id -> { townName: 'full' | 'partial' }
    const result = {};

    for (const town of towns.features) {
        const name = town.properties.NAME;
        const townFile = join(work, 'town.geojson');
        const clipOut = join(work, 'clip.json');
        writeFileSync(townFile, JSON.stringify({ type: 'FeatureCollection', features: [town] }));

        // Clip all precincts to this town; output the surviving pieces' areas
        sh(`npx -y mapshaper "${here('./nsv_precincts_full.geojson')}" -clip "${townFile}" remove-slivers -each "pieceArea=this.area" -filter-fields "UNIQUE_ID,pieceArea" -o "${clipOut}" format=json`);

        for (const piece of JSON.parse(readFileSync(clipOut, 'utf8'))) {
            const ratio = piece.pieceArea / fullArea[piece.UNIQUE_ID];
            if (ratio < MIN_RATIO && piece.pieceArea < MIN_AREA_M2) continue;
            result[piece.UNIQUE_ID] ??= {};
            result[piece.UNIQUE_ID][name] = ratio > FULL_RATIO ? 'full' : 'partial';
        }
        console.log(`${name}: ${JSON.parse(readFileSync(clipOut, 'utf8')).length} overlapping precinct piece(s)`);
    }

    const out = {
        _meta: {
            generated: new Date().toISOString().slice(0, 10),
            source: 'Census TIGER 2024 places (LSAD 43) overlaid on RDH precinct boundaries via mapshaper clip',
            fields: "precincts[UNIQUE_ID][townName] = 'full' | 'partial' precinct coverage by that town",
        },
        precincts: result,
    };
    writeFileSync(here('../../src/data/precinctTowns.json'), JSON.stringify(out, null, 2) + '\n');

    console.log(`\nPrecinct → town coverage:`);
    for (const [id, t] of Object.entries(result)) {
        console.log(`  ${id.padEnd(55)} ${Object.entries(t).map(([n, c]) => `${n} (${c})`).join(', ')}`);
    }
    console.log(`\nWrote ${Object.keys(result).length} precincts to src/data/precinctTowns.json`);
} finally {
    rmSync(work, { recursive: true, force: true });
}
