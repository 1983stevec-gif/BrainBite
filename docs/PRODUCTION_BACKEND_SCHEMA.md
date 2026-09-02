# Suggested Backend Schema

families
- id
- parent_user_id
- created_at
- updated_at

profiles
- id
- family_id
- display_name
- progress_json
- updated_at

sync_events
- id
- family_id
- profile_id
- client_event_id
- payload_json
- created_at

Rules:
- parent may access only their family
- child profile is never public
- service/admin credentials stay server-side
