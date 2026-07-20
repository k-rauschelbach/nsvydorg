// api/_lib/validate.js — Shared request-body length limits.
//
// Without these, any field can carry megabytes. A form post is not bounded
// by what the HTML input allows: anyone can POST directly to the endpoint.
// The result would be multi-megabyte emails to officers and oversized rows
// written to the membership sheet.
//
// Not deployed as a function — see the note in turnstile.js about '_' paths.

// Short, structured fields: names, emails, localities, dates.
const MAX_FIELD_LENGTH = 240;

// Free-text areas. 240 would truncate an ordinary paragraph, so these get
// their own ceiling — still far below anything that could bloat an email.
const MAX_TEXT_LENGTH = 5000;

// How many availability checkboxes a submission may carry. The form offers
// seven; the cap stops a direct POST from sending thousands.
const MAX_LIST_ITEMS = 20;

// Returns a user-facing error string for the first field that fails, or
// null when everything is within limits. Absent/empty fields are skipped —
// required-field checks are the caller's job.
function checkLengths(fields) {
    for (const { label, value, max } of fields) {
        if (value === undefined || value === null || value === '') continue;
        if (typeof value !== 'string') {
            return `${label} is invalid.`;
        }
        if (value.length > max) {
            return `${label} must be ${max} characters or fewer.`;
        }
    }
    return null;
}

// Same idea for an array of strings: bounds both the item count and each
// item's length.
function checkList(label, value, maxItems = MAX_LIST_ITEMS, maxLength = MAX_FIELD_LENGTH) {
    if (value === undefined || value === null) return null;
    if (!Array.isArray(value)) return `${label} is invalid.`;
    if (value.length > maxItems) return `Too many ${label.toLowerCase()} selections.`;
    for (const item of value) {
        if (typeof item !== 'string' || item.length > maxLength) {
            return `${label} is invalid.`;
        }
    }
    return null;
}

module.exports = {
    MAX_FIELD_LENGTH,
    MAX_TEXT_LENGTH,
    MAX_LIST_ITEMS,
    checkLengths,
    checkList,
};
