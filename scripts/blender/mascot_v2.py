"""Original Bite explorer geometry and rigid-part animation rig, authored in Blender."""
import math
import bpy


def build_explorer(kit, collection, root):
    asset = "mascot"
    palette = {
        "blue": ((0.018, 0.36, 0.88, 1), .56),
        "crest": ((0.025, 0.20, 0.62, 1), .56),
        "cyan": ((0.10, 0.62, 0.92, 1), .5),
        "white": ((0.98, 0.96, 0.84, 1), .3),
        "iris": ((0.015, 0.39, 0.54, 1), .25),
        "ink": ((0.008, 0.018, 0.025, 1), .25),
        "tongue": ((0.8, 0.08, 0.19, 1), .5),
        "pack": ((0.18, 0.32, 0.045, 1), .78),
        "leather": ((0.12, 0.065, 0.025, 1), .7),
        "gold": ((0.97, 0.59, 0.085, 1), .35),
    }
    materials = {key: kit.make_material("BB_Bite_V2_" + key, color, roughness=rough)
                 for key, (color, rough) in palette.items()}
    bindings = []

    def orb(name, loc, scale, color, bone="body", kind="body"):
        obj = kit.add_uv_sphere(collection, asset, root, name, loc, scale,
                                materials[color], segments=24, rings=16, kind=kind)
        bindings.append((obj, bone))
        return obj

    def box(name, loc, size, color, bone="body", kind="costume"):
        obj = kit.add_cube(collection, asset, root, name, loc, size,
                           materials[color], bevel=.06, kind=kind)
        bindings.append((obj, bone))
        return obj

    orb("Bite_Torso", (0, 0, 1.03), (.56, .42, .69), "blue")
    orb("Bite_Chest", (0, -.38, 1.12), (.32, .055, .4), "crest")
    orb("Bite_Head", (0, -.015, 2.24), (.98, .67, .88), "blue", "head", "head")
    orb("Bite_Muzzle", (0, -.59, 1.99), (.63, .21, .38), "cyan", "head", "muzzle")
    orb("Bite_Smile", (0, -.793, 1.88), (.36, .035, .12), "ink", "head", "mouth")
    orb("Bite_Tongue", (0, -.83, 1.825), (.14, .017, .04), "tongue", "head", "tongue")
    orb("Bite_Nose", (0, -.847, 2.09), (.165, .095, .10), "ink", "head", "nose")
    box("Bite_Tooth", (0, -.826, 1.975), (.20, .035, .055), "white", "head")

    for side, suffix in [(-1, "L"), (1, "R")]:
        eye = "eye_" + suffix
        orb("Bite_EyeRim_" + suffix, (side * .405, -.575, 2.42), (.39, .15, .49), "crest", "head")
        orb("Bite_Eye_" + suffix, (side * .405, -.646, 2.42), (.35, .14, .445), "white", eye, "eye")
        orb("Bite_Iris_" + suffix, (side * .38, -.775, 2.39), (.205, .052, .287), "iris", eye, "iris")
        orb("Bite_Pupil_" + suffix, (side * .37, -.816, 2.4), (.132, .035, .222), "ink", eye, "pupil")
        orb("Bite_Glint_" + suffix, (side * .37 - .046, -.847, 2.51), (.052, .02, .07), "white", eye)
        orb("Bite_GlintSmall_" + suffix, (side * .37 + .05, -.847, 2.33), (.024, .012, .032), "white", eye)
        brow = orb("Bite_Brow_" + suffix, (side * .42, -.575, 2.91), (.24, .10, .072), "crest", "head")
        brow.rotation_euler.y = side * .18
        orb("Bite_Ear_" + suffix, (side * .91, -.02, 2.39), (.24, .22, .29), "blue", "head")
        orb("Bite_EarInset_" + suffix, (side * 1.02, -.18, 2.4), (.10, .075, .17), "cyan", "head")
        orb("Bite_Leg_" + suffix, (side * .3, -.015, .4), (.22, .23, .35), "blue")
        box("Bite_Sole_" + suffix, (side * .31, -.15, .105), (.55, .74, .16), "white")
        orb("Bite_Shoe_" + suffix, (side * .31, -.14, .22), (.27, .36, .18), "crest")
        box("Bite_ShoeStripe_" + suffix, (side * .31, -.456, .22), (.41, .055, .085), "gold")
        arm = "arm_" + suffix
        limb = orb("Bite_Arm_" + suffix, (side * .68, -.005, 1.11), (.18, .18, .4), "blue", arm, "arm")
        limb.rotation_euler.y = side * .52
        orb("Bite_Palm_" + suffix, (side * .87, -.06, .85), (.19, .14, .19), "blue", arm, "hand")
        for index in range(3):
            orb(f"Bite_Finger_{suffix}_{index}", (side * (.78 + index * .09), -.095, .69),
                (.067, .078, .12), "blue", arm, "finger")
        orb("Bite_Thumb_" + suffix, (side * 1.03, -.06, .85), (.09, .09, .13), "blue", arm, "finger")
        box("Bite_Strap_" + suffix, (side * .36, -.35, 1.28), (.105, .12, .61), "pack")

    for index, (x, height, tilt) in enumerate([(-.43, 3.04, -.48), (0, 3.18, -.12), (.39, 3.08, .38)]):
        crest = orb(f"Bite_Crest_{index}", (x, .045, height), (.23, .24, .32), "crest", "head", "crest")
        crest.rotation_euler.y = tilt
    box("Bite_Belt", (0, -.385, .72), (.91, .13, .13), "leather")
    box("Bite_Buckle", (0, -.48, .72), (.2, .06, .18), "gold")
    box("Bite_Backpack", (0, .44, 1.13), (.76, .35, .77), "pack", kind="backpack")
    box("Bite_PackFlap", (0, .64, 1.35), (.7, .10, .24), "pack")
    box("Bite_PackClasp", (0, .707, 1.24), (.13, .04, .15), "gold")

    data = bpy.data.armatures.new("Bite_Explorer_Rig")
    rig = bpy.data.objects.new("Bite_Rig", data)
    collection.objects.link(rig)
    kit.parent_keep_world(rig, root)
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode="EDIT")
    definitions = [
        ("body", (0, 0, .65), (0, 0, 1.45), None),
        ("head", (0, 0, 1.65), (0, 0, 2.5), "body"),
        ("arm_L", (-.54, 0, 1.4), (-.87, 0, .85), "body"),
        ("arm_R", (.54, 0, 1.4), (.87, 0, .85), "body"),
        ("eye_L", (-.405, -.646, 2.42), (-.405, -.646, 2.65), "head"),
        ("eye_R", (.405, -.646, 2.42), (.405, -.646, 2.65), "head"),
    ]
    for name, head, tail, parent in definitions:
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        if parent:
            bone.parent = data.edit_bones[parent]
    bpy.ops.object.mode_set(mode="OBJECT")
    for obj, bone in bindings:
        kit.parent_keep_world(obj, rig)
        group = obj.vertex_groups.new(name=bone)
        group.add(list(range(len(obj.data.vertices))), 1, "REPLACE")
        modifier = obj.modifiers.new("Bite articulated rig", "ARMATURE")
        modifier.object = rig
    # A restrained looping idle, not a substitute for locomotion animation.
    for frame, lean in [(1, 0), (31, .045), (61, 0), (91, -.035), (121, 0)]:
        head = rig.pose.bones["head"]
        head.rotation_mode = "XYZ"
        head.rotation_euler.y = lean
        head.keyframe_insert("rotation_euler", frame=frame)
        for name, sign in [("arm_L", -1), ("arm_R", 1)]:
            bone = rig.pose.bones[name]
            bone.rotation_mode = "XYZ"
            bone.rotation_euler.z = lean * sign * 1.8
            bone.keyframe_insert("rotation_euler", frame=frame)
    for frame, scale in [(1, 1), (70, 1), (73, .06), (76, 1), (121, 1)]:
        for name in ["eye_L", "eye_R"]:
            bone = rig.pose.bones[name]
            bone.scale.y = scale
            bone.keyframe_insert("scale", frame=frame)
    rig.animation_data.action.name = "Bite_Idle"
    bpy.context.scene.render.fps = 30
    bpy.context.scene.frame_end = 121
    bpy.context.scene.frame_set(1)
    for name, loc in [("Head", (0, 0, 3.2)), ("Backpack", (0, .7, 1.3))]:
        socket = kit.add_empty(collection, root, asset, "Bite_Socket_" + name, "socket", socket=name.lower())
        socket.location = loc
