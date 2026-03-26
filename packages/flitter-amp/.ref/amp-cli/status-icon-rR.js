// Amp CLI - Status Icon Function (rR)
// Extracted from minified bundle
// Maps tool execution status to Unicode icon characters

function rR(H){switch(H){case"done":return"\u2713";case"error":case"cancelled":case"rejected-by-user":case"cancellation-requested":return"\u2715";case"in-progress":case"queued":case"blocked-on-user":return"\u22EF"}}

// Unicode reference:
// \u2713 = ✓ (check mark)
// \u2715 = ✗ (multiplication X)
// \u22EF = ⋯ (midline horizontal ellipsis)
