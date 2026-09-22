"""Normalize one approved static prop into a reviewed BrainBite source package.

Run with Blender factory settings and auto-execution disabled. This script does
not download assets, execute imported scripts, publish output, or alter runtime
manifests. It is intentionally limited to static props; rigs and animation need
their own production pipeline.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import math
import re
import sys
from pathlib import Path

import bpy
from mathutils import Matrix, Vector


SCHEMA = "brainbite.blender.normalization-report.v1"
PIPELINE_VERSION = "1.0.0"
SAFE_ID = re.compile(r"^[a-z0-9][a-z0-9_-]{1,63}$")


def parse_cli() -> argparse.Namespace:
    argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--blend", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    parser.add_argument("--asset-id", required=True)
    parser.add_argument("--max-triangles", type=int, required=True)
    parser.add_argument("--max-materials", type=int, required=True)
    parser.add_argument("--max-textures", type=int, required=True)
    parser.add_argument("--max-dimension", type=float, required=True)
    return parser.parse_args(argv)


def call_supported(operator, kwargs):
    properties = operator.get_rna_type().properties.keys()
    return operator(**{key: value for key, value in kwargs.items() if key in properties})


def reset_scene() -> None:
    bpy.ops.wm.read_factory_settings(use_empty=True)


def finite_matrix(obj: bpy.types.Object) -> bool:
    return all(math.isfinite(value) for row in obj.matrix_world for value in row)


def transform_issues(obj: bpy.types.Object) -> tuple[bool, bool, bool, bool]:
    basis = obj.matrix_world.to_3x3()
    columns = [Vector((basis[0][index], basis[1][index], basis[2][index])) for index in range(3)]
    lengths = [column.length for column in columns]
    singular = any(length <= 1e-9 for length in lengths) or abs(basis.determinant()) <= 1e-12
    sheared = False
    if not singular:
        normalized = [column / length for column, length in zip(columns, lengths)]
        sheared = any(abs(normalized[left].dot(normalized[right])) > 1e-5 for left, right in ((0, 1), (0, 2), (1, 2)))
    negative = basis.determinant() < 0
    non_unit = any(abs(length - 1.0) > 1e-5 for length in lengths)
    return singular, sheared, negative, non_unit


def mesh_integrity(mesh_objects: list[bpy.types.Object]) -> dict:
    degenerate = 0
    non_finite_vertices = 0
    missing_material_slots = 0
    for obj in mesh_objects:
        missing_material_slots += sum(material is None for material in obj.data.materials)
        if len(obj.data.materials) == 0:
            missing_material_slots += 1
        non_finite_vertices += sum(
            not all(math.isfinite(value) for value in (obj.matrix_world @ vertex.co))
            for vertex in obj.data.vertices
        )
        obj.data.calc_loop_triangles()
        for triangle in obj.data.loop_triangles:
            first, second, third = [obj.matrix_world @ obj.data.vertices[index].co for index in triangle.vertices]
            if (second - first).cross(third - first).length * 0.5 <= 1e-12:
                degenerate += 1
    return {
        "degenerate_triangle_count": degenerate,
        "non_finite_vertex_count": non_finite_vertices,
        "missing_material_slot_count": missing_material_slots,
    }


def non_finite_material_values(materials: list[bpy.types.Material]) -> int:
    count = 0
    for material in materials:
        if not material.use_nodes or material.node_tree is None:
            continue
        for node in material.node_tree.nodes:
            for socket in node.inputs:
                value = getattr(socket, "default_value", None)
                values = [value] if isinstance(value, (int, float)) else value if hasattr(value, "__iter__") else []
                numeric = [item for item in values if isinstance(item, (int, float))]
                if any(not math.isfinite(item) for item in numeric):
                    count += 1
    return count


def mesh_bounds(objects: list[bpy.types.Object]) -> tuple[Vector, Vector]:
    points = [obj.matrix_world @ Vector(corner) for obj in objects if obj.type == "MESH" for corner in obj.bound_box]
    if not points:
        raise RuntimeError("Imported asset contains no mesh bounds")
    if any(not all(math.isfinite(value) for value in point) for point in points):
        raise RuntimeError("Imported asset contains non-finite mesh bounds")
    minimum = Vector((min(point.x for point in points), min(point.y for point in points), min(point.z for point in points)))
    maximum = Vector((max(point.x for point in points), max(point.y for point in points), max(point.z for point in points)))
    return minimum, maximum


def collect_metrics(objects: list[bpy.types.Object]) -> dict:
    meshes = [obj for obj in objects if obj.type == "MESH"]
    material_objects = sorted({material for obj in meshes for material in obj.data.materials if material is not None}, key=lambda item: item.name)
    materials = [material.name for material in material_objects]
    images = sorted(image.name for image in bpy.data.images if image.name != "Render Result")
    minimum, maximum = mesh_bounds(objects)
    dimensions = maximum - minimum
    transform_counts = [transform_issues(obj) for obj in objects]
    integrity = mesh_integrity(meshes)
    return {
        "object_count": len(objects),
        "mesh_count": len(meshes),
        "triangle_count": sum(max(0, len(polygon.vertices) - 2) for obj in meshes for polygon in obj.data.polygons),
        "material_count": len(materials),
        "material_names": materials,
        "texture_count": len(images),
        "texture_names": images,
        "bounds_min": [round(value, 6) for value in minimum],
        "bounds_max": [round(value, 6) for value in maximum],
        "dimensions": [round(value, 6) for value in dimensions],
        "max_dimension": round(max(dimensions), 6),
        "armature_count": sum(obj.type == "ARMATURE" for obj in objects),
        "animation_count": len(bpy.data.actions),
        "root_names": sorted(obj.name for obj in objects if obj.parent is None),
        "singular_transform_count": sum(issue[0] for issue in transform_counts),
        "sheared_transform_count": sum(issue[1] for issue in transform_counts),
        "negative_determinant_count": sum(issue[2] for issue in transform_counts),
        "non_unit_scale_count": sum(issue[3] for issue in transform_counts),
        "non_finite_material_value_count": non_finite_material_values(material_objects),
        **integrity,
    }


def validate_static_asset(objects: list[bpy.types.Object], metrics: dict, args: argparse.Namespace, *, normalized: bool = False) -> list[str]:
    failures = []
    if metrics["mesh_count"] < 1:
        failures.append("asset contains no mesh objects")
    if metrics["armature_count"]:
        failures.append("static-prop normalization does not accept armatures")
    if metrics["animation_count"]:
        failures.append("static-prop normalization does not accept animations")
    if any(not finite_matrix(obj) for obj in objects):
        failures.append("asset contains non-finite transforms")
    if metrics["non_finite_vertex_count"]:
        failures.append("asset contains non-finite vertices")
    if metrics["degenerate_triangle_count"]:
        failures.append(f"asset contains {metrics['degenerate_triangle_count']} degenerate triangles")
    if metrics["missing_material_slot_count"]:
        failures.append(f"asset contains {metrics['missing_material_slot_count']} missing material assignments")
    if metrics["non_finite_material_value_count"]:
        failures.append("asset contains non-finite material values")
    if metrics["singular_transform_count"]:
        failures.append("asset contains singular transforms")
    if metrics["sheared_transform_count"]:
        failures.append("asset contains sheared transforms")
    if normalized and metrics["negative_determinant_count"]:
        failures.append("normalized asset contains negative-determinant transforms")
    if normalized and metrics["non_unit_scale_count"]:
        failures.append("normalized asset contains non-unit transforms")
    if metrics["triangle_count"] > args.max_triangles:
        failures.append(f"triangles exceed budget ({metrics['triangle_count']} > {args.max_triangles})")
    if metrics["material_count"] > args.max_materials:
        failures.append(f"materials exceed budget ({metrics['material_count']} > {args.max_materials})")
    if metrics["texture_count"] > args.max_textures:
        failures.append(f"textures exceed budget ({metrics['texture_count']} > {args.max_textures})")
    if metrics["max_dimension"] <= 0 or metrics["max_dimension"] > args.max_dimension:
        failures.append(f"maximum dimension outside budget (0 < {metrics['max_dimension']} <= {args.max_dimension})")
    return failures


def normalized_material_name(asset_id: str, material: bpy.types.Material, index: int) -> str:
    prefix = f"BB_{asset_id}_"
    indexed_prefix = f"{prefix}{index:03d}_"
    if material.name.startswith(indexed_prefix):
        return material.name[:63]
    source = material.name[len(prefix) :] if material.name.startswith(prefix) else material.name
    if source.startswith("BB_"):
        source = source[3:]
    source = re.sub(r"[^A-Za-z0-9_]+", "_", source).strip("_") or "Material"
    return f"{indexed_prefix}{source}"[:63]


def normalize_scene(objects: list[bpy.types.Object], asset_id: str) -> tuple[bpy.types.Object, bool]:
    bpy.context.scene.unit_settings.system = "METRIC"
    bpy.context.scene.unit_settings.scale_length = 1.0
    materials = sorted({material for obj in objects if obj.type == "MESH" for material in obj.data.materials if material}, key=lambda item: item.name)
    material_names = [normalized_material_name(asset_id, material, index) for index, material in enumerate(materials)]
    for index, material in enumerate(materials):
        material.name = f"__BB_NORMALIZE_TMP_{index:03d}"
    for material, material_name in zip(materials, material_names):
        material.name = material_name
        material["brainbite_asset_id"] = asset_id
        material["brainbite_normalization_version"] = PIPELINE_VERSION

    for obj in (item for item in objects if item.type == "MESH"):
        if obj.data.users > 1:
            obj.data = obj.data.copy()
        bpy.ops.object.select_all(action="DESELECT")
        obj.select_set(True)
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    minimum, maximum = mesh_bounds(objects)
    offset = Vector((-(minimum.x + maximum.x) * 0.5, -(minimum.y + maximum.y) * 0.5, -minimum.z))
    roots = [obj for obj in objects if obj.parent is None]
    root_name = f"BrainBite_{asset_id}_ROOT"
    existing = [obj for obj in roots if obj.name == root_name]
    if len(existing) > 1:
        raise RuntimeError("asset contains more than one canonical BrainBite root")
    if existing:
        root = existing[0]
        direct_child_matrices = {child: child.matrix_world.copy() for child in root.children}
        root.matrix_world = Matrix.Identity(4)
        for child, matrix in direct_child_matrices.items():
            child.matrix_world = matrix
    else:
        root = bpy.data.objects.new(root_name, None)
        bpy.context.scene.collection.objects.link(root)

    movable = [*root.children, *(obj for obj in roots if obj is not root)]
    for obj in movable:
        matrix = obj.matrix_world.copy()
        matrix.translation += offset
        obj.matrix_world = matrix
    for obj in roots:
        if obj is root:
            continue
        matrix = obj.matrix_world.copy()
        obj.parent = root
        obj.matrix_world = matrix

    root["brainbite_asset_id"] = asset_id
    root["brainbite_pipeline"] = "static-prop-normalization"
    root["brainbite_normalization_version"] = PIPELINE_VERSION
    root["brainbite_units"] = "meters"
    root["brainbite_pivot"] = "bottom-center"
    bpy.context.view_layer.update()
    return root, not bool(existing)


def validate_source_preservation(before: dict, after: dict, created_root: bool) -> list[str]:
    failures = []
    for field in ("mesh_count", "triangle_count", "material_count", "texture_count"):
        if before[field] != after[field]:
            failures.append(f"normalization changed source {field} ({before[field]} != {after[field]})")
    expected_objects = before["object_count"] + (1 if created_root else 0)
    if after["object_count"] != expected_objects:
        failures.append(f"normalization lost or added source objects ({after['object_count']} != {expected_objects})")
    return failures


def validate_normalized_pivot(metrics: dict) -> list[str]:
    failures = []
    minimum = metrics["bounds_min"]
    maximum = metrics["bounds_max"]
    if abs((minimum[0] + maximum[0]) * 0.5) > 1e-5 or abs((minimum[1] + maximum[1]) * 0.5) > 1e-5:
        failures.append("normalized bounds are not centered on X/Y")
    if abs(minimum[2]) > 1e-5:
        failures.append("normalized bounds do not rest on Z=0")
    return failures


def validate_normalized_root(objects: list[bpy.types.Object], asset_id: str) -> list[str]:
    failures = []
    root_name = f"BrainBite_{asset_id}_ROOT"
    roots = [obj for obj in objects if obj.parent is None]
    matches = [obj for obj in roots if obj.name == root_name]
    if len(roots) != 1 or len(matches) != 1:
        return [f"normalized asset must contain exactly one root named {root_name}"]
    root = matches[0]
    if root.type != "EMPTY":
        failures.append("canonical root must be an empty transform")
    if any(abs(value) > 1e-6 for value in root.location):
        failures.append("canonical root location must be zero")
    if any(abs(value - 1.0) > 1e-6 for value in root.scale):
        failures.append("canonical root scale must be one")
    if root.get("brainbite_asset_id") != asset_id:
        failures.append("canonical root asset metadata is missing")
    if root.get("brainbite_units") != "meters" or root.get("brainbite_pivot") != "bottom-center":
        failures.append("canonical root unit/pivot metadata is missing")
    return failures


def metrics_match(normalized: dict, reimported: dict) -> bool:
    for field in (
        "object_count", "mesh_count", "triangle_count", "material_count", "texture_count",
        "material_names", "texture_names", "root_names", "armature_count", "animation_count",
        "singular_transform_count", "sheared_transform_count", "negative_determinant_count",
        "non_unit_scale_count", "non_finite_material_value_count", "degenerate_triangle_count",
        "non_finite_vertex_count", "missing_material_slot_count",
    ):
        if normalized[field] != reimported[field]:
            return False
    for field in ("bounds_min", "bounds_max", "dimensions", "max_dimension"):
        if field == "max_dimension":
            if abs(normalized[field] - reimported[field]) > 1e-4:
                return False
            continue
        if any(abs(left - right) > 1e-4 for left, right in zip(normalized[field], reimported[field])):
            return False
    return True


def select_hierarchy(root: bpy.types.Object) -> None:
    bpy.ops.object.select_all(action="DESELECT")
    root.select_set(True)
    for obj in root.children_recursive:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = root


def export_glb(root: bpy.types.Object, output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    select_hierarchy(root)
    call_supported(
        bpy.ops.export_scene.gltf,
        {
            "filepath": str(output),
            "export_format": "GLB",
            "use_selection": True,
            "export_apply": True,
            "export_materials": "EXPORT",
            "export_animations": False,
            "export_cameras": False,
            "export_lights": False,
            "export_extras": True,
        },
    )
    if not output.is_file() or output.stat().st_size < 32:
        raise RuntimeError("Blender did not produce a usable GLB")


def import_asset(source: Path) -> list[bpy.types.Object]:
    if not source.is_file():
        raise RuntimeError(f"Missing input GLB: {source}")
    before = set(bpy.data.objects)
    call_supported(bpy.ops.import_scene.gltf, {"filepath": str(source)})
    return sorted((obj for obj in bpy.data.objects if obj not in before), key=lambda obj: obj.name)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def run(args: argparse.Namespace) -> dict:
    if not SAFE_ID.fullmatch(args.asset_id):
        raise RuntimeError("asset-id must use 2-64 lowercase letters, numbers, underscores, or hyphens")
    if any(value < 0 for value in (args.max_triangles, args.max_materials, args.max_textures)) or args.max_dimension <= 0:
        raise RuntimeError("normalization budgets must be non-negative and max-dimension must be positive")

    source = args.input.resolve()
    source_hash = digest(source)
    reset_scene()
    imported = import_asset(source)
    before = collect_metrics(imported)
    failures = validate_static_asset(imported, before, args)
    if failures:
        raise RuntimeError("; ".join(failures))

    root, created_root = normalize_scene(imported, args.asset_id)
    normalized_objects = [root, *root.children_recursive]
    after = collect_metrics(normalized_objects)
    failures = (
        validate_static_asset(normalized_objects, after, args, normalized=True)
        + validate_normalized_pivot(after)
        + validate_normalized_root(normalized_objects, args.asset_id)
        + validate_source_preservation(before, after, created_root)
    )
    if failures:
        raise RuntimeError("; ".join(failures))

    args.blend.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(args.blend.resolve()), compress=True)
    export_glb(root, args.output.resolve())
    output_hash = digest(args.output.resolve())

    reset_scene()
    verified_objects = import_asset(args.output.resolve())
    verified = collect_metrics(verified_objects)
    failures = validate_static_asset(verified_objects, verified, args, normalized=True) + validate_normalized_pivot(verified) + validate_normalized_root(verified_objects, args.asset_id)
    if failures:
        raise RuntimeError("re-import failed validation: " + "; ".join(failures))
    if not metrics_match(after, verified):
        raise RuntimeError("re-imported geometry, material, or bounds metrics differ from normalized source")

    report = {
        "schema": SCHEMA,
        "pipeline_version": PIPELINE_VERSION,
        "asset_id": args.asset_id,
        "mode": "static-prop",
        "blender_version": bpy.app.version_string,
        "source_sha256": source_hash,
        "output_sha256": output_hash,
        "source_metrics": before,
        "normalized_metrics": after,
        "reimport_metrics": verified,
        "units": "meters",
        "pivot": "bottom-center",
        "status": "passed",
    }
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return report


def main() -> None:
    args = parse_cli()
    try:
        report = run(args)
        print(f"NORMALIZE PASS {report['asset_id']} output_sha256={report['output_sha256']}")
        print(f"REPORT {args.report.resolve()}")
    except Exception as exc:
        print(f"NORMALIZE FAIL {type(exc).__name__}: {exc}", file=sys.stderr)
        raise


if __name__ == "__main__":
    main()
