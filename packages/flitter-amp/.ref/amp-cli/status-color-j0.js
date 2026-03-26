// Amp CLI - Status Color Function (j0)
// Extracted from minified bundle
// Maps tool execution status to theme colors

function j0(H,L){switch(H){case"done":return L.app.toolSuccess;case"error":return L.app.toolError;case"cancellation-requested":case"cancelled":case"rejected-by-user":return L.app.toolCancelled;case"in-progress":return L.app.toolRunning;case"queued":return L.app.waiting;case"blocked-on-user":return L.app.waiting}}

// Color mapping (from x1.default):
// toolSuccess   = gH.green
// toolError     = gH.red
// toolCancelled = gH.yellow
// toolRunning   = gH.blue
// waiting       = gH.yellow
