# BrainBite Asset Intake

The intake CLI keeps untrusted candidate GLBs outside runtime/public manifests.
It validates provenance and a self-contained GLB, retains all submissions in
quarantine, requires a separate local approval, and promotes approved bytes into
an isolated staging area. It never calls a vendor, uses credentials, or changes
the shipping asset list.

Promotion in Phase 2.1 is an approval boundary, not artistic cleanup. The promoted
GLB is byte-identical to the quarantined input. Blender cleanup, pivot/scale review,
retopology, material unification, LODs and runtime art acceptance occur in the
three-prop pilot before any file may replace a shipping asset.

## Request Record

Create a JSON file beside the candidate outside the repository. Required shape:

```json
{
  "schema": "brainbite.asset-intake.request.v1",
  "assetId": "jungle_fern",
  "displayName": "Jungle Fern",
  "expectedSha256": "64-lowercase-hex-characters",
  "source": {
    "vendor": "vendor-or-authored-source",
    "engine": "exact-engine-and-version",
    "taskId": "vendor-task-id-or-local-build-id",
    "acquiredAt": "2026-09-12T12:00:00Z",
    "prompt": "Exact generation prompt or authored-source description.",
    "inputRights": "Why BrainBite may use every source input.",
    "containsChildData": false
  },
  "license": {
    "commercialUseConfirmed": true,
    "redistributionAllowed": true,
    "termsUrl": "https://vendor.example/terms",
    "termsCapturedAt": "2026-09-12T12:00:00Z",
    "attribution": ""
  },
  "budgets": {
    "maxBytes": 2097152,
    "maxTriangles": 20000,
    "maxMaterials": 4,
    "maxTextures": 4,
    "maxDimension": 10
  }
}
```

Do not include API keys, tokens, credentials, passwords, secrets or child data.
The CLI rejects credential-like fields and requires `containsChildData` to be false.

## Commands

From `D:\Codex\Brainbite`:

```powershell
npm run asset:intake -- validate --input D:\candidate\fern.glb --request D:\candidate\fern.request.json
npm run asset:intake -- intake --input D:\candidate\fern.glb --request D:\candidate\fern.request.json
npm run asset:intake -- approve --asset-id jungle_fern --sha256 <validated-sha256> --approved-by "BrainBite art reviewer"
npm run asset:intake -- promote --asset-id jungle_fern --sha256 <validated-sha256>
npm run asset:intake -- normalize --asset-id jungle_fern --sha256 <validated-sha256> --blender D:\Codex\tools\blender-5.2.1-windows-x64\blender.exe
```

Use `--root <isolated-path>` only for tests or a deliberately separate intake
workspace. The default is `assets/intake/`, which is ignored by Git and absent
from the service-worker cache. Approval identifies the human/operator; it is a
local audit boundary, not a cryptographic signature or substitute for legal review.

## Validation

The current validator checks the GLB 2.0 container/chunks, embedded-only buffers
and images, a small runtime extension allowlist, hash, provenance, license
assertions, child-data flag and bytes/triangle/material/texture budgets. It also
validates accessor component/type/count/range/alignment/stride, triangle indices,
material references, nested scene structure, finite positions, non-degenerate
triangles and decoded scene-space bounds. Geometry reads are lazy and bounded by
the declared and hard triangle ceilings, including repeated mesh instances.
Malformed nested structures return rejection records instead of escaping
quarantine as exceptions.

Focused automated coverage:

```powershell
node --test tests/glb-intake.test.mjs
$env:BRAINBITE_BLENDER='D:\Codex\tools\blender-5.2.1-windows-x64\blender.exe'
npm run test:blender-normalize
```

Phase 2.2 normalization runs Blender with factory settings and auto-execution
disabled. It accepts static props only, establishes meter units and a bottom-center
root, standardizes material names, writes an inspectable `.blend`, exports GLB,
and re-imports it to compare geometry/material/bounds metrics. The Node boundary
independently decodes the resulting GLB, verifies its single reachable canonical
root and metadata, converts Blender Z-up bounds to GLB Y-up for comparison, and
rejects incomplete or fabricated reports. Actual retopology, UV repair and art
acceptance remain human/visual work. Do not copy normalized outputs into shipping
paths by hand.
