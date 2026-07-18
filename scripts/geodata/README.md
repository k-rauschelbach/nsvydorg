# Precinct boundary data

The Elections page map (`/elections`) renders precinct polygons from
`public/data/precincts.geojson` — the 67 precincts of Warren, Shenandoah,
Clarke, and Frederick Counties and Winchester City.

`public/data/precincts.geojson` is a byte-for-byte copy of
`nsv_precincts_full.geojson` in this folder — full boundary detail,
**no simplification**.

> **Do not simplify these boundaries.** An earlier version shipped a
> mapshaper `-simplify 10%` copy; simplification shifts edges by tens of
> meters, which misassigned addresses near urban precinct lines (e.g.
> 1106 Valley Ave, Winchester landed in Ward 1 instead of Ward 3 — the
> ward boundary runs along Valley Ave itself). Full resolution is 608KB
> raw / ~158KB gzipped, which is acceptable, and address→precinct
> assignment must be exact.

## Source

Redistricting Data Hub, "Virginia 2024 General Election Precinct-Level
Results and Boundaries" (`va_2024_gen_prec.zip`):
https://redistrictingdatahub.org/

RDH sources the boundaries from the VA Department of Elections redistricting
map and verifies them against the L2 voter file (Feb 2025 vintage). The
attributes include 2024 presidential results (`dem24` / `rep24` = Harris /
Trump votes), kept for a possible margin-shading layer.

## Properties

| Field       | Meaning                                        |
|-------------|------------------------------------------------|
| `UNIQUE_ID` | RDH id, e.g. `Warren County-:-201 - Happy Creek` |
| `COUNTYFP`  | County FIPS: Clarke 043, Frederick 069, Shenandoah 171, Warren 187, Winchester 840 |
| `locality`  | County/city name                               |
| `precinct`  | Precinct number + name, e.g. `502 - Bass-Hoover`. First digit = local election district/ward. |
| `dem24` / `rep24` | 2024 presidential votes                  |

## Regenerating

With the RDH statewide shapefile extracted:

```
npx mapshaper -i va_2024_gen_all_prec/va_2024_gen_all_prec.shp \
  -filter "['043','069','171','187','840'].indexOf(COUNTYFP) > -1" \
  -each "locality=this.properties['Cnty/City']; precinct=Pct; dem24=G24PREDHAR; rep24=G24PRERTRU" \
  -filter-fields "UNIQUE_ID,COUNTYFP,locality,precinct,dem24,rep24" \
  -o nsv_precincts_full.geojson format=geojson precision=0.000001
```

Then copy `nsv_precincts_full.geojson` to `public/data/precincts.geojson`
unmodified (see the no-simplification warning above).

## Maintenance

Precinct boundaries change occasionally (consolidations, town annexations,
and decennial redistricting). Before each November election, check the five
registrars' public notices for boundary/precinct changes and re-pull from
RDH if needed.
