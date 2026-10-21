// Single source of truth for the donations Worker origin.
// Change POET_API_BASE here only; ung-ho/donate.js, ung-ho/result.js and
// admin/admin.js read it. This file must load before those scripts
// (defer scripts run in document order).
window.POET_API_BASE = 'https://poet-donations.lucasmai.workers.dev';
