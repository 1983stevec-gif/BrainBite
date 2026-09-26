# BrainBite Cloud-Sync-Ready Data Model

Local prototype data now mirrors a future cloud shape:

- account
- profiles[]
- profile.skills{}
- profile.mistakes[]
- profile.completed[]
- profile.snapMissions[]
- profile.customMissions[]
- settings
- sync

`sync` currently remains `local-only`. A future backend can map profile IDs to authenticated family accounts without changing core gameplay state.

No child public profile is required.
