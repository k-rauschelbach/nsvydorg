// Elections.js -- interactive precinct map with address lookup and ballot panel
//
// Data flow:
//   public/data/precincts.geojson  — 67 precinct polygons (Warren, Shenandoah,
//                                    Clarke, Frederick, Winchester), produced
//                                    from Redistricting Data Hub / VA Dept of
//                                    Elections boundaries (see scripts/geodata/)
//   src/data/ballotData.js         — localities, races, candidates, helpers
//
// Address lookup: US Census Bureau geocoder (free, no key) with Nominatim as
// fallback, then a point-in-polygon test against the precinct layer — all
// client-side, no backend involved.

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, GeoJSON, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
    LOCALITIES,
    HD_COLORS,
    ELECTION,
    precinctInfo,
    racesForPrecinct,
} from '../../data/ballotData';
import styles from './Elections.module.css';

// Centered on the coverage area; corrected to actual bounds once the
// GeoJSON loads (see the fitBounds effect below)
const INITIAL_CENTER = [39.05, -78.35];
const INITIAL_ZOOM = 10;

// ── Point-in-polygon (ray casting) ──────────────────────────
// Small enough that pulling in turf.js isn't worth the dependency.
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

// A point is inside a polygon if it's in the outer ring (index 0)
// and not inside any hole ring (indexes 1+)
function pointInPolygonCoords(lng, lat, polygonCoords) {
    if (!pointInRing(lng, lat, polygonCoords[0])) return false;
    for (let i = 1; i < polygonCoords.length; i++) {
        if (pointInRing(lng, lat, polygonCoords[i])) return false;
    }
    return true;
}

function findFeatureAt(lng, lat, geoData) {
    for (const feature of geoData.features) {
        const { type, coordinates } = feature.geometry;
        if (type === 'Polygon') {
            if (pointInPolygonCoords(lng, lat, coordinates)) return feature;
        } else if (type === 'MultiPolygon') {
            for (const poly of coordinates) {
                if (pointInPolygonCoords(lng, lat, poly)) return feature;
            }
        }
    }
    return null;
}

// ── Geocoding ───────────────────────────────────────────────
// Returns { lat, lng, label } or null if no match.

// Same-origin proxy to the US Census geocoder (see api/geocode.js) —
// the Census service itself doesn't send CORS headers, so the browser
// can't call it directly.
async function geocodeCensus(address) {
    const res = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
    if (!res.ok) throw new Error(`Geocode proxy HTTP ${res.status}`);
    const data = await res.json();
    return data.match; // { lat, lng, label } or null
}

async function geocodeNominatim(address) {
    const url =
        'https://nominatim.openstreetmap.org/search' +
        `?format=json&countrycodes=us&limit=1&q=${encodeURIComponent(address)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    const data = await res.json();
    if (!data.length) return null;
    return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon),
        label: data[0].display_name,
    };
}

async function geocode(address) {
    // Census first (authoritative for US street addresses), Nominatim as
    // fallback for things Census can't parse (place names, partial addresses)
    try {
        const hit = await geocodeCensus(address);
        if (hit) return hit;
    } catch {
        // fall through to Nominatim
    }
    return geocodeNominatim(address);
}

// ── Precinct polygon styling ────────────────────────────────

const HOVER_STYLE = { fillOpacity: 0.7, weight: 2.5 };
const SELECTED_STYLE = { fillOpacity: 0.75, weight: 3, color: '#1f2937' };

// Delay before a hover tooltip appears — avoids a flurry of tooltips
// when sweeping the cursor across the map
const TOOLTIP_DELAY_MS = 200;

function Elections() {
    const [geoData, setGeoData] = useState(null);
    const [townsData, setTownsData] = useState(null); // town boundary polygons
    const [geoError, setGeoError] = useState(false);
    const [selected, setSelected] = useState(null);       // precinctInfo() of the clicked precinct
    const [addressPoint, setAddressPoint] = useState(null); // { lat, lng, label } from a search
    const [query, setQuery] = useState('');
    const [searching, setSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [map, setMap] = useState(null);

    // Leaflet layer per precinct, keyed by UNIQUE_ID — lets the address
    // search select/zoom a precinct exactly like a click would
    const layersRef = useRef(new Map());
    const selectedLayerRef = useRef(null);

    // Tooltip opening is managed manually (delayed open, suppressed while
    // dragging) instead of Leaflet's instant auto-open — see onEachFeature
    const hoverTimerRef = useRef(null);
    const isDraggingRef = useRef(false);

    const closeAllTooltips = useCallback(() => {
        clearTimeout(hoverTimerRef.current);
        layersRef.current.forEach((layer) => layer.closeTooltip());
    }, []);

    // Map color mode: 'locality' (default) or 'hd' (House of Delegates).
    // A ref mirrors the state so Leaflet event handlers — bound once at
    // layer creation — always style with the current mode.
    const [colorMode, setColorMode] = useState('locality');
    const colorModeRef = useRef('locality');

    const styleFor = useCallback((feature) => {
        const props = feature.properties;
        const fill = colorModeRef.current === 'hd'
            ? HD_COLORS[precinctInfo(props).hd] ?? '#888888'
            : LOCALITIES[props.COUNTYFP]?.color ?? '#888888';
        return { fillColor: fill, fillOpacity: 0.45, color: '#ffffff', weight: 1.5 };
    }, []);

    // Restyle every non-selected precinct when the color mode changes
    useEffect(() => {
        colorModeRef.current = colorMode;
        layersRef.current.forEach((layer) => {
            if (selectedLayerRef.current?.layer !== layer) {
                layer.setStyle(styleFor(layer.feature));
            }
        });
    }, [colorMode, styleFor]);

    // Fetch the precinct polygons once on mount. Town boundaries load
    // alongside; they refine address searches (exact in-town / out-of-town),
    // so a failed load just degrades to precinct-level town info.
    useEffect(() => {
        fetch(`${process.env.PUBLIC_URL}/data/precincts.geojson`)
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(setGeoData)
            .catch(() => setGeoError(true));

        fetch(`${process.env.PUBLIC_URL}/data/towns.geojson`)
            .then((res) => (res.ok ? res.json() : null))
            .then(setTownsData)
            .catch(() => {});
    }, []);

    // Fit the map to the full coverage area once both map and data exist,
    // then lock the view to it: no zooming out past the full-area view,
    // no panning away from the five localities
    useEffect(() => {
        if (map && geoData) {
            const bounds = L.geoJSON(geoData).getBounds();
            map.fitBounds(bounds, { padding: [12, 12] });
            map.setMinZoom(map.getBoundsZoom(bounds.pad(0.1)));
            map.setMaxBounds(bounds.pad(0.35));
        }
    }, [map, geoData]);

    // Dragging or zooming moves the map under the cursor, so polygons never
    // receive the mouseout that would normally close their tooltip — close
    // them all up front and suppress new ones until the drag ends
    useEffect(() => {
        if (!map) return;

        const onDragStart = () => {
            isDraggingRef.current = true;
            closeAllTooltips();
        };
        const onDragEnd = () => {
            isDraggingRef.current = false;
        };

        map.on('dragstart', onDragStart);
        map.on('dragend', onDragEnd);
        map.on('zoomstart', closeAllTooltips);

        return () => {
            map.off('dragstart', onDragStart);
            map.off('dragend', onDragEnd);
            map.off('zoomstart', closeAllTooltips);
        };
    }, [map, closeAllTooltips]);

    const selectFeature = useCallback((feature, layer) => {
        // The zoom-to-precinct animation would otherwise strand an open tooltip
        closeAllTooltips();
        // Restore the previously selected precinct's base style
        if (selectedLayerRef.current) {
            const prev = selectedLayerRef.current;
            prev.layer.setStyle(styleFor(prev.feature));
        }
        layer.setStyle(SELECTED_STYLE);
        layer.bringToFront();
        selectedLayerRef.current = { feature, layer };
        setSelected(precinctInfo(feature.properties));
        if (map) {
            map.fitBounds(layer.getBounds().pad(0.35));
        }
    }, [map, closeAllTooltips, styleFor]);

    const clearSelection = useCallback(() => {
        if (selectedLayerRef.current) {
            const prev = selectedLayerRef.current;
            prev.layer.setStyle(styleFor(prev.feature));
            selectedLayerRef.current = null;
        }
        setSelected(null);
        setAddressPoint(null);
        setSearchError('');
        if (map && geoData) {
            map.fitBounds(L.geoJSON(geoData).getBounds(), { padding: [12, 12] });
        }
    }, [map, geoData, styleFor]);

    // Wire hover + click handlers on every precinct polygon
    const onEachFeature = useCallback((feature, layer) => {
        layersRef.current.set(feature.properties.UNIQUE_ID, layer);

        layer.bindTooltip(
            `<strong>${feature.properties.precinct}</strong><br/>${feature.properties.locality}`,
            { sticky: true }
        );

        // Detach Leaflet's own tooltip-opening listeners: opening is managed
        // manually below (delayed, drag-aware). Leaflet's version also defers
        // mid-drag hovers to 'moveend', which made every precinct crossed
        // during a drag pop its tooltip on release. The 'move'/'mousemove'
        // listeners that position an open sticky tooltip stay attached.
        layer.off({
            mouseover: layer._openTooltip,
            mouseout: layer.closeTooltip,
            click: layer._openTooltip,
        });

        // Track the cursor so the delayed tooltip opens where the mouse
        // is now, not where it entered the polygon
        let cursorLatLng = null;

        layer.on({
            mouseover: (e) => {
                if (isDraggingRef.current) return;

                cursorLatLng = e.latlng;
                clearTimeout(hoverTimerRef.current);
                hoverTimerRef.current = setTimeout(() => {
                    if (!isDraggingRef.current) {
                        layer.openTooltip(cursorLatLng);
                    }
                }, TOOLTIP_DELAY_MS);

                if (selectedLayerRef.current?.layer !== layer) {
                    layer.setStyle(HOVER_STYLE);
                }
            },
            mousemove: (e) => {
                cursorLatLng = e.latlng;
            },
            mouseout: () => {
                clearTimeout(hoverTimerRef.current);
                layer.closeTooltip();
                if (selectedLayerRef.current?.layer !== layer) {
                    layer.setStyle(styleFor(feature));
                }
            },
            click: () => selectFeature(feature, layer),
        });
    }, [selectFeature, styleFor]);

    // Address search: geocode → point-in-polygon → select that precinct
    async function handleSearch(e) {
        e.preventDefault();
        if (!query.trim() || !geoData || searching) return;

        setSearching(true);
        setSearchError('');
        setAddressPoint(null);

        try {
            const hit = await geocode(query.trim());
            if (!hit) {
                setSearchError('Could not find that address. Try adding the town and "VA".');
                return;
            }

            const feature = findFeatureAt(hit.lng, hit.lat, geoData);
            if (!feature) {
                setSearchError(
                    'That address is outside our coverage area (Warren, Shenandoah, Clarke, and Frederick Counties, and Winchester City).'
                );
                return;
            }

            // Exact town-limits test for the address — name of the containing
            // town, null if outside every town, undefined if boundaries
            // didn't load (falls back to precinct-level town info)
            const town = townsData
                ? findFeatureAt(hit.lng, hit.lat, townsData)?.properties.NAME ?? null
                : undefined;

            setAddressPoint({ ...hit, town });
            const layer = layersRef.current.get(feature.properties.UNIQUE_ID);
            if (layer) selectFeature(feature, layer);
        } catch {
            setSearchError('Address lookup failed — please try again in a moment.');
        } finally {
            setSearching(false);
        }
    }

    // With a searched address, town races are filtered exactly by the
    // address's town; on a plain precinct click they're included for any
    // overlapping town (qualified in the UI when the overlap is partial)
    const races = selected
        ? racesForPrecinct(selected, addressPoint ? addressPoint.town : undefined)
        : [];

    return (
        <div>

            {/* Blue page header */}
            <section className={styles.pageHeader}>
                <div className={styles.headerInner}>
                    <h1>Elections</h1>
                    <p>
                        Find your precinct and see what's on your ballot across our five
                        covered localities.
                    </p>
                </div>
            </section>

            <section className={styles.mapSection}>
                <div className={styles.mapInner}>

                    {/* Address search bar */}
                    <form className={styles.searchBar} onSubmit={handleSearch}>
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Enter your address: e.g. 21 S Kent St, Winchester, VA"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Street address"
                        />
                        <button
                            type="submit"
                            className={styles.searchButton}
                            disabled={searching || !geoData}
                        >
                            {searching ? 'Searching…' : 'Find my precinct'}
                        </button>
                    </form>
                    {searchError && <p className={styles.searchError}>{searchError}</p>}

                    {/* Map color mode toggle */}
                    <div className={styles.mapControls}>
                        <span className={styles.toggleLabel}>Color by:</span>
                        <div role="group" aria-label="Color precincts by">
                            <button
                                type="button"
                                className={`${styles.toggleBtn} ${colorMode === 'locality' ? styles.toggleActive : ''}`}
                                onClick={() => setColorMode('locality')}
                            >
                                Locality
                            </button>
                            <button
                                type="button"
                                className={`${styles.toggleBtn} ${colorMode === 'hd' ? styles.toggleActive : ''}`}
                                onClick={() => setColorMode('hd')}
                            >
                                House of Delegates
                            </button>
                        </div>
                    </div>

                    <div className={styles.mapLayout}>

                        {/* Map */}
                        <div className={styles.mapWrap}>
                            {geoError ? (
                                <p className={styles.loadError}>
                                    Could not load the precinct map. Please refresh the page.
                                </p>
                            ) : (
                                <MapContainer
                                    center={INITIAL_CENTER}
                                    zoom={INITIAL_ZOOM}
                                    ref={setMap}
                                    className={styles.leafletMap}
                                    scrollWheelZoom
                                    // Solid edge at maxBounds instead of rubber-banding
                                    maxBoundsViscosity={1.0}
                                >
                                    {/* CARTO Positron — free, light basemap that keeps
                                        the focus on the precinct colors */}
                                    <TileLayer
                                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
                                    />
                                    {geoData && (
                                        <GeoJSON
                                            data={geoData}
                                            style={styleFor}
                                            onEachFeature={onEachFeature}
                                        />
                                    )}
                                    {/* Dot marking the searched address */}
                                    {addressPoint && (
                                        <CircleMarker
                                            center={[addressPoint.lat, addressPoint.lng]}
                                            radius={7}
                                            pathOptions={{
                                                color: '#ffffff',
                                                weight: 2,
                                                fillColor: '#e11d48',
                                                fillOpacity: 1,
                                            }}
                                        />
                                    )}
                                </MapContainer>
                            )}
                        </div>

                        {/* Info panel */}
                        <aside className={styles.panel}>
                            {!selected ? (
                                <>
                                    <h2 className={styles.panelTitle}>Our coverage area</h2>
                                    <p className={styles.panelHint}>
                                        Click a precinct on the map, or search your address above,
                                        to see what's on the ballot there.
                                    </p>
                                    <ul className={styles.legend}>
                                        {colorMode === 'hd'
                                            ? Object.entries(HD_COLORS).map(([hd, color]) => (
                                                <li key={hd}>
                                                    <span
                                                        className={styles.legendSwatch}
                                                        style={{ backgroundColor: color }}
                                                    />
                                                    House District {hd}
                                                </li>
                                            ))
                                            : Object.entries(LOCALITIES).map(([fips, loc]) => (
                                                <li key={fips}>
                                                    <span
                                                        className={styles.legendSwatch}
                                                        style={{ backgroundColor: loc.color }}
                                                    />
                                                    {loc.name}
                                                </li>
                                            ))}
                                    </ul>
                                </>
                            ) : (
                                <>
                                    <button
                                        className={styles.backButton}
                                        onClick={clearSelection}
                                    >
                                        &larr; All precincts
                                    </button>

                                    <h2 className={styles.panelTitle}>{selected.precinct}</h2>
                                    <p className={styles.panelMeta}>
                                        {selected.locality}
                                        {selected.districtLabel && ` · ${selected.districtLabel}`}
                                    </p>
                                    {addressPoint && (
                                        <p className={styles.panelAddress}>
                                            &#128205; {addressPoint.label}
                                        </p>
                                    )}

                                    {/* District assignments from precinctDistricts.json */}
                                    <ul className={styles.districtList}>
                                        {selected.cd && (
                                            <li>
                                                <span>U.S. House</span>
                                                <span>District {selected.cd}</span>
                                            </li>
                                        )}
                                        {selected.sd && (
                                            <li>
                                                <span>Va. Senate</span>
                                                <span>District {selected.sd}</span>
                                            </li>
                                        )}
                                        {selected.hd && (
                                            <li>
                                                <span>House of Delegates</span>
                                                <span>District {selected.hd}</span>
                                            </li>
                                        )}
                                        {/* Searched address: exact in/out of town limits.
                                            Plain click: towns overlapping the precinct. */}
                                        {addressPoint && addressPoint.town !== undefined ? (
                                            (addressPoint.town || Object.keys(selected.towns).length > 0) && (
                                                <li>
                                                    <span>Town limits</span>
                                                    <span>{addressPoint.town ?? 'Outside any town'}</span>
                                                </li>
                                            )
                                        ) : (
                                            Object.keys(selected.towns).length > 0 && (
                                                <li>
                                                    <span>Town</span>
                                                    <span>
                                                        {Object.entries(selected.towns)
                                                            .map(([name, coverage]) =>
                                                                coverage === 'partial' ? `${name} (partial)` : name
                                                            )
                                                            .join(', ')}
                                                    </span>
                                                </li>
                                            )
                                        )}
                                    </ul>

                                    <h3 className={styles.racesHeading}>
                                        On the ballot: {ELECTION.displayDate}
                                    </h3>

                                    <ul className={styles.raceList}>
                                        {races.map((race) => (
                                            <li key={race.id} className={styles.race}>
                                                <span className={styles.raceOffice}>{race.office}</span>
                                                <span className={styles.raceArea}>{race.area}</span>
                                                {/* Precinct partially overlaps this town and no exact
                                                    address is known — not everyone here gets this race */}
                                                {race.scope.type === 'town' &&
                                                    (!addressPoint || addressPoint.town === undefined) &&
                                                    selected.towns[race.scope.name] === 'partial' && (
                                                        <span className={styles.raceQualifier}>
                                                            Only for addresses inside {race.scope.name} town limits
                                                        </span>
                                                    )}
                                                {race.candidates.length > 0 ? (
                                                    <ul className={styles.candidateList}>
                                                        {race.candidates.map((c) => (
                                                            <li key={c.name}>
                                                                {c.website ? (
                                                                    <a href={c.website} target="_blank" rel="noreferrer">
                                                                        {c.name}
                                                                    </a>
                                                                ) : (
                                                                    c.name
                                                                )}
                                                                {c.party && ` (${c.party})`}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className={styles.raceTbd}>
                                                        Candidates will be listed once the lineup is final.
                                                    </span>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </>
                            )}
                        </aside>

                    </div>
                </div>
            </section>

        </div>
    );
}

export default Elections;
