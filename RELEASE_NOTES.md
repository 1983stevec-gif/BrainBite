# BrainBite v2.0 Release Notes

- Fixed the startup crash that disconnected most controls and the Wordwood mission list.
- Verified all 30 missions and all three bosses through the shared CHOMP engine.
- Added the missing Firebase parent-authentication UI and completed upload, download/merge, offline queue retry, export, sign-out, cloud deletion, and Authentication-account deletion paths.
- Removed Supabase adapters and historical contradictory test suites.
- Hardened profile migration, active-profile bounds, malformed fields, empty saves, backup recovery, imports, and export corruption detection.
- Added recovery-snapshot fallback in both the browser app and core foundation, plus manual restore fallback behavior.
- Hardened offline sync event metadata and duplicate-event rejection across separated queue entries.
- Extended conflict merges to retain Practice Lab and Snap-to-Game records.
- Hardened Firestore ownership rules with owner, document ID, field, type, and default-deny checks.
- Hardened the service worker to cache only same-origin successful resources and use an offline navigation fallback without intercepting Firebase traffic.
- Added accessible labels, visible focus, minimum targets, reduced-motion media handling, narrow-phone layout protection, and automated WCAG coverage.
- Added browser-verified low-end device detection and performance-tier rendering reductions.
- Replaced the Python-dependent test server and accumulated versioned smoke tests with a portable Node server and authoritative release suite.
