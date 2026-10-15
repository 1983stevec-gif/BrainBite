# Generated 3D material assets — 2026-10-06

The user requested MCP and assets while explicitly retaining live 3D.
The Runway MCP connection was inspected and had zero available credits. No purchase,
plan change, or Runway generation was made. The built-in image-generation tool created
both materials. They are surface textures on live meshes, not replacement screenshots.

Runtime files (512 × 512 PNG; originals retained in the generated-images folder):
- `assets/art/jungle-stone-albedo-v1.png`
- `assets/art/jungle-ground-albedo-v1.png`

The existing `assets/art` stage allowlist includes both files. Both are listed in the
service worker's optional 3D install cache and the regenerated package manifest.
Materials retain procedural fallback pixels until the image decodes, guard disposed
textures, and coalesce a refresh event for reduced-motion scenes. No external image
service is required at runtime.

## Stone prompt (built-in tool)

Use case: stylized-concept. Asset type: seamless square diffuse/albedo texture for stone pillars and ruins in a cheerful live 3D children's jungle adventure game. Create one edge-to-edge orthographic material texture, exactly square, showing large irregular warm cream sandstone blocks in staggered rows with rounded chipped edges, shallow muted umber mortar, subtle painterly tonal variation, restrained sage moss in a few joints. Polished hand-painted game art, broad readable forms and gentle detail, bright warm limestone rather than dark dirty stone. Surface only: uniform ambient illumination, no directional shadows, no perspective, no vignette, no 3D objects, no scenery, no text, no border, no UI. Seamless tileable edges horizontally and vertically. This will wrap around real 3D geometry; do not depict a pillar or a scene. Desired texture resolution 1024x1024.

## Ground prompt (built-in tool)

Use case: stylized-concept. Asset type: one seamless square ground diffuse/albedo texture for a cheerful live 3D jungle adventure game. Create an edge-to-edge orthographic top-down surface of soft lush grass and moss, with broad painterly emerald, fresh green and warm sage patches, sparse small overlapping tropical leaf shapes and subtle exposed earth flecks. Stylized polished game material with rounded shapes, gentle readable texture, medium brightness and restrained contrast; no photorealistic noise. Flat uniform ambient lighting. Seamless tileable edges horizontally and vertically. No directional shadows, no perspective, no vignette, no scenery, no trees, no characters, no text, no border, no UI. This is a surface material to wrap onto real 3D terrain, not an illustration or a landscape. Square 1024x1024.
