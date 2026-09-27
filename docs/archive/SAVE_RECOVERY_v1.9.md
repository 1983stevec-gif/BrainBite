# Save Recovery v1.9
BrainBite now rotates the previous valid local save into a backup key before writing a new save.
If the primary JSON becomes unreadable, startup attempts the backup.
Recovery UI can create and restore a local backup manually.
Before cloud sync, add versioned server-side migrations and immutable audit-safe backup semantics.
