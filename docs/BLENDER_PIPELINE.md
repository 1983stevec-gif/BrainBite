# BrainBite Blender Asset Pipeline

This pipeline generates an original, stylized BrainBite starter asset kit for
the Batch 9 presentation layer. It is intentionally isolated from the
presentation runtime: source code is in
`scripts/blender/build_brainbite_kit.py` and `scripts/blender/mascot_v2.py`, and generated files live under
`assets/generated/blender/`.

## Requirements

For the planned optional vendor intake and production cleanup workflow, see
`HYBRID_ASSET_PRODUCTION_PLAN.md`. The builder below generates our own kit;
it does not yet normalize or approve arbitrary AI/vendor models. Current runtime
export is GLB for Three.js/WebGL, not a Unity import pipeline.

The implemented quarantine and approval boundary is documented in
`ASSET_INTAKE.md`. Its Phase 2.1 promotion preserves candidate bytes; actual Blender
cleanup and re-export remain Phase 2.2 work.

- Blender `5.2.1` at `D:\Codex\tools\blender-5.2.1-windows-x64\blender.exe`
- A checkout rooted at `D:\Codex\Brainbite`
- Windows PowerShell

## Build and verify

From `D:\Codex\Brainbite`:

```powershell
& 'D:\Codex\tools\blender-5.2.1-windows-x64\blender.exe' --background --python 'D:\Codex\Brainbite\scripts\blender\build_brainbite_kit.py' -- --output 'D:\Codex\Brainbite\assets\generated\blender'
```

The command starts from an empty Blender scene, recreates every generated
collection, overwrites only the pipeline's named outputs, exports five GLB
files, writes a source `.blend`, and imports each GLB again in headless Blender
for validation. It is safe to rerun; no runtime file is edited and unknown
files in the generated directory are preserved.

To verify existing outputs without rebuilding:

```powershell
& 'D:\Codex\tools\blender-5.2.1-windows-x64\blender.exe' --background --python 'D:\Codex\Brainbite\scripts\blender\build_brainbite_kit.py' -- --output 'D:\Codex\Brainbite\assets\generated\blender' --verify-only
```

## Generated outputs

- `assets/generated/blender/glb/brainbite_mascot.glb`: crested blue Bite explorer, six-bone rigid-part skin, `Bite_Idle` clip with blink, and head/backpack reference sockets. Full locomotion, expression clips, and animated cosmetic attachments remain future work.
- `assets/generated/blender/glb/brainbite_jungle_props.glb`: reusable trees, rocks, fern, stump, reward chest, and Bite Village sign.
- `assets/generated/blender/glb/brainbite_portal.glb`: stone Play Portal with emissive energy rings and entry/exit sockets.
- `assets/generated/blender/glb/brainbite_answer_pillars.glb`: four answer pillars with stable slots `A` through `D`.
- `assets/generated/blender/glb/brainbite_kraken.glb`: Fraction Kraken boss with eight readable tentacles and arena socket.
- `assets/generated/blender/source/brainbite_starter_kit.blend`: inspectable source scene containing all asset collections and a preview-only camera/light rig.
- `assets/generated/blender/manifest.json`: deterministic build ID, source provenance, asset inventory, sizes, SHA-256 hashes, and Blender import results.

## Determinism and provenance

The builder uses seed `9021`, fixed geometry/material parameters, stable object
names, and a fixed pipeline build ID. Each asset root, generated object, and
material receives custom Blender properties for the asset ID, pipeline version,
source script, build ID, style, and license note. The manifest is sorted and
does not contain wall-clock timestamps. Geometry parameters are reproducible,
but Blender exports have shown byte-level differences across fresh processes;
do not assert byte-identical GLBs. Hashes identify each actual output build.

The GLBs are original BrainBite production assets. They are not copies of
MECC/Munchers characters, branding, or visual presentation. Runtime consumers
load the GLBs in the home/battle scenes, with procedural fallback and optional
service-worker caching. Pipeline v1.2.0 is integrated into those runtime scenes.
This version refines Bite's crest, smile, shoes, chest color, and material roughness
without changing the six-bone rig, idle/blink clip, or attachment socket contract.
The manifest also names `scripts/blender/mascot_v2.py` as a supporting source.

## Troubleshooting

If Blender is unavailable, the script cannot be validated with another Python
interpreter because it depends on `bpy`. Run the same command after restoring
the exact Blender 5.2.1 executable. A successful run prints `BUILD PASS`, one
`GLB` line per asset, and `VERIFY passed`; the verify-only command prints one
`IMPORT PASS` line per GLB.
