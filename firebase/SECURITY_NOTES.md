# Firebase Security Notes

## Enforced by `firestore.rules`

- Every family path is bound to `request.auth.uid`; stored `ownerId` is checked on reads and is immutable on updates.
- Profile documents have an exact five-field envelope. `clientProfileId`, nested `progress.id`, and the path `profileId` must match.
- `clientUpdatedAt` is a Firestore timestamp. Tombstone `deletedAt` is an integer millisecond value and must match that timestamp.
- Live progress uses an allowlist, numeric/type checks, key-count limits, and collection limits. Progression, mastery, settings, controls, and Learning Core have nested schema and size checks.
- Production cloud progress requires `snap` to be an empty list. Legacy local Snap records may remain available for parent export, but must be removed by the cloud projection before upload.
- Live cloud progress rejects `parentPin`, `parentAuth`, `pinHash`, `pinSalt`, `password`, `idToken`, and `refreshToken`. Never add a credential field to the gameplay allowlist.
- A profile deletion is an exact `{ id, deleted: true, deletedAt }` tombstone. Once stored, only an identical retry is allowed. Client physical deletes are denied, so a stale client cannot erase a tombstone and recreate the profile ID.
- Family document deletes are denied because deleting a Firestore parent does not cascade its profile subcollection. Full account erasure requires a privileged, audited backend cleanup after authentication.
- All other paths are default-denied.

Firestore's platform document limit remains the final serialized-size ceiling. Rules cannot recursively inspect values under dynamic-key maps, so the client must still structurally minimize each payload and enforce its own preflight byte limit.

## Required Client Follow-up

The current client snapshot still includes the legacy plaintext `parentPin` and may include local Snap records. The hardened rules intentionally reject either payload. Cloud serialization must omit all PIN/auth material and force `snap: []` before these rules are deployed; do not weaken the rule to preserve legacy sync compatibility. Tombstone writes already contain neither category.

Cloud serialization must also emit the canonical compact Learning Core shape with exactly `version`, `stage`, `completedStages`, `skills`, `mastery`, `rewards`, `rewardLedger`, and `hub`. Identity, practice/session history, settings, current activity, recovery, telemetry, offline queues, sent-event IDs, and quarantine records stay outside that nested cloud map. The root progress document remains authoritative for identity, practice, sessions, and settings.

The cloud projection must always emit `codeBridgeLessons`, `programmableBitLessons`, and `bubbleReefRewards` as maps, using `{}` when empty. It must emit `equippedCosmetic` and `activeProgrammableBitId` as strings, using `''` for local null, and emit `updatedAt` as a non-negative number. Cloud ingress must reverse only the documented empty-string sentinel mapping. These requirements are a coordinated client migration; deploying the rules before that projection is live will intentionally reject legacy payloads.

The four-field `controls` map remains the cloud contract. Time-usage ledgers are device-local and profile-keyed; they do not belong in cloud progress or this allowlist.

The browser may contain Firebase web configuration, but never an Admin SDK credential, service-account key, refresh token, or other secret.

## Closed-beta Console Policy

- Require App Check for Firestore before closed-beta traffic. The current REST client does not yet send an App Check token, so enforcement is a deployment gate that requires client integration and emulator/staging verification first.
- Use separate development and production web API keys. Restrict the production key to the approved HTTPS closed-beta origins in Google Cloud API Credentials; keep localhost on the development key only.
- Keep public self-sign-up closed. Pre-provision invited parent accounts or use an invitation service that controls account creation. Firestore rules do not close Firebase Authentication sign-up endpoints.
- Keep Email/Password as the only enabled provider unless another provider receives a separate review. Require verified parent email before admitting an account to the beta.

These console controls are external configuration and are not proven by repository validators.

## Verification

- `node scripts/validate-firebase.mjs` validates the complete structural contract.
- `node scripts/validate-firebase-security.mjs` validates ownership, bounds, secret rejection, immutable identifiers, default deny, and tombstone semantics.
- `node --test tests/firebase-security-rules.test.mjs` mutation-tests every material invariant. With `FIRESTORE_EMULATOR_HOST` set, it also executes real owner, cross-family, type, size, identifier, tombstone, un-delete, and physical-delete requests.
- A normal Firebase emulator run requires the repository's Firebase configuration, a compatible Java runtime, and Firebase CLI tooling. Production deployment and console-policy verification remain separate external gates.

Re-run all three checks after any cloud schema change. Do not treat token-presence checks or a successful deploy alone as security evidence.
