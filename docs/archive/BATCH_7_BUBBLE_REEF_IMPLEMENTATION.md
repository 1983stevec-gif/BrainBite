# Batch 7 Bubble Reef Implementation

Updated: 2026-09-14

## Scope completed

- Added a versioned, validated world-profile contract for Jungle Circuit and Bubble Reef.
- Added deterministic Bubble Reef 3D preview decor using Three.js primitives only.
- Integrated the profile into the existing WebGL home scene through an opt-in `worldProfile` option.
- Preserved the canonical mission registry, numeric progression IDs, LearningCore, save system, and DOM fallback.
- Added focused unit coverage for profile isolation, validation, deterministic profile listing, decor composition, and disposal.
- Added a fail-closed Bubble Reef route contract with the Bubble Current interaction.
- Added a profile-scoped, idempotent base-contribution/reward contract.
- Added a deterministic Bubble Reef route presentation kit with entry, interaction,
  and Pearl Arch landmarks.
- Integrated the contribution/reward grant into the existing app completion path for
  the internal Bubble Reef preview, including profile-scoped replay-safe merge.

## Runtime contract

The default remains Jungle Circuit. Internal preview callers can select Bubble Reef with `window.BrainBiteWorldPreview.setProfile('bubble-reef')`; the adapter remounts only the active home scene. Unknown profile IDs safely fall back to Jungle Circuit.

This is implementation evidence, not a certification claim. Bubble Reef remains an
internal preview route: it reuses canonical mission 8 / Knowledge Platforms and does
not yet add a separate canonical mission, boss, or production world unlock.

## Verification

- `node --test tests/world-profiles.test.mjs tests/bubble-reef-kit.test.mjs tests/bubble-reef-content.test.mjs tests/bubble-reef-rewards.test.mjs tests/experience-registry.test.mjs`
- Result: focused profile, route, presentation, content, and reward tests passed.
- `npm run test:unit`
- Result: 163 passed, 0 failed.
- `npx playwright test tests/bubble-reef-preview.spec.js`
- Result: 1 passed, 0 failed.

## Next implementation slice

Add the visible in-game Bubble Reef world-selection route and BrainBase contribution
presentation. Then add an app-boundary replay/isolation regression test. Keep the
internal preview gate and canonical mission registry unchanged.
