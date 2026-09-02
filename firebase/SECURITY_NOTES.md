# Security Notes
- The browser may contain only Firebase web configuration.
- Never bundle Admin SDK/service-account credentials.
- Firestore rules bind each family document path to `request.auth.uid`.
- Child profiles are not public.
- Re-test rules after any schema change.
