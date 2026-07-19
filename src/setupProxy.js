// setupProxy.js — CRA dev-server hook (loaded automatically by react-scripts)
//
// The production site serves /api/* as Vercel serverless functions, which
// the CRA dev server knows nothing about — under `npm start` a request to
// /api/geocode would fall through to index.html and the client would
// silently drop to its Nominatim fallback. Mounting the same handler
// module here gives local dev the identical Census-geocoder path as
// production, with one source of truth for the logic.
//
// Runs in Node (dev-server config), not through webpack, so requiring
// from outside src/ is fine. The handler is Express-compatible:
// it only touches req.method, req.query, and res.status().json().

const geocode = require('../api/geocode');

module.exports = function (app) {
    app.get('/api/geocode', geocode);
};
