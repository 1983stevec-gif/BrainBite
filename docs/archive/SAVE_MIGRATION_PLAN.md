# Save Migration Plan
Current schema migrates older local profiles forward and preserves profile progress.

Before cloud sync:
1. add explicit schema migrations per version
2. create export/backup format
3. test v0.9 → current migration
4. test malformed/partial saves
5. never overwrite a newer unknown schema
6. keep child identity separate from gameplay records where possible
