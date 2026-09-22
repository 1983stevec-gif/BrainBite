# Gate 8.6 Production Readiness — Operator Checklist

Date: 2026-09-02  
Status: Operator execution (domain/HTTPS require production host)

Record evidence in `docs/BATCH_8_STATUS_TRACKER.md` Gate 8.6.

## 1) Production domain + HTTPS

- [ ] Canonical domain chosen (write URL): _________________
- [ ] HTTPS certificate valid (no browser warning)
- [ ] `http://` redirects to `https://` (if applicable)
- [ ] App loads: `https://<domain>/?match=0&webgl=0`

Local note: `http://127.0.0.1:4317` is for development only.

## 2) Support contact + launch URLs

- [ ] `support.html` shows the real support channel (email or form)
  - Interim: GitHub Issues link is present; replace with production contact before PASS
- [ ] Footer links work on production: Privacy · Support · Terms
- [ ] Launch URL list published (home, privacy, terms, support)

## 3) Account deletion (production)

1. Sign in parent on `brainbite-prod`
2. Account & Sync → **Delete Cloud Data & Account**
3. Confirm Auth user + Firestore `families/{uid}` data are gone

- [ ] UI delete completes
- [ ] Firestore docs removed
- [ ] Auth user removed

## 4) Export (production)

1. Profiles → **Export Active Profile** and/or Recovery → **Export Versioned Progress**
2. Account & Sync → **Export Account Data**
3. Confirm JSON downloads and re-import / restore works on a clean profile if claimed

- [ ] Export file downloads
- [ ] Contents include expected progress fields
- [ ] Import/restore verified (if in launch scope)

## 5) Final launch checklist

Close `docs/FINAL_LAUNCH_CHECKLIST.md` items that Batch 8 owns.

- [ ] Release notes match verified evidence
- [ ] No open P0/P1 launch blockers
- [ ] Handoff doc points at real URLs + Firebase project `brainbite-prod`

## Agent-prepared local evidence (2026-09-02)

- Public pages present in repo and SW precache: `privacy.html`, `terms.html`, `support.html`
- In-app controls exist: export/delete on Profiles, Recovery, Account & Sync
- Shipping smoke PASS: `node scripts/smoke-completion-pusher.mjs`
- Still **required on production host**: domain, HTTPS, live delete/export against `brainbite-prod`
