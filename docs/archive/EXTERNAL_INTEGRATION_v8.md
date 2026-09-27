# External Integration v8

## Cloud
Supported configuration paths:
- Supabase
- Firebase

The app stores only public client configuration locally. Never place privileged server credentials in the browser bundle.

## OCR
Supported architecture:
- custom HTTPS OCR endpoint
- image upload via multipart/form-data
- response contract `{ "text": "..." }`

All extracted content must remain reviewable before becoming practice content.
