# Halo Isle: handoff for the local Claude Code session (2026-11-10)

Ryder's goal: build Halo Isle, a polished third-person 3D island game (Wii Sports Resort charm + Frutiger Aero),
with Blender as the asset tool. He wants to watch the work live on this Mac.

## Status
Phase 1 (inspection + pipeline test) is done. Plan doc: https://claude.ai/artifact/VMRZL7SU9sRqzKd2kWC8sv
- assets/: hero (Blender model, 11-bone rig, 9 clips), palm_a/b, stone path straight + 30deg curve, CC0 Poly Haven texture (license in LICENSES.md, assets/metadata/ASSETS.json)
- pipeline/blender/*.py: regenerate assets (bpy 5.x). make_path.py downloads from the Poly Haven API.
- pipeline/validate_glb.py assets  -> static GLB checks (5/5 pass)
- pipeline/viewer/: three.js viewer (index.html?glb=/assets/...); pipeline/shoot.mjs screenshots it
- game/halo-pipeline-test.html: old phase6 game + the three assets on Halo Isle (just open it)

## Open decisions (ask Ryder, don't assume)
1. New clean Vite + Three.js codebase for Halo Isle (recommended) vs keep patching the old compiled build.
2. Push to GitHub repo ryderm1515/squishy-rng? Never push, open a PR or deploy without his OK.
3. Hero name.

## Rules
- Originality: keep the vibe, but no Nintendo assets, names or Wuhu layout copies.
- Record source/author/license/date for every downloaded asset before use.
- Blender MCP: Ryder's Blender 5.2.2 (add-on protocol 13, server expects 15: `uvx mcp-for-blender install-addon`).
  Work in a temporary scene and switch back; save with bpy.data.libraries.write, never save_as over his open file.
- Vertex colours in bmesh byte layers take raw sRGB.
- Phase 2 next (after decision 1): hero v2 (wave arm, ~10k tris, texture eyes + face library, full emote set),
  controller + camera + gamepad, small test garden. Gate: Ryder plays it and it feels good; 60 fps on this Mac.
- Ryder likes short progress reports, speed, low token use, polished visuals; stop for review after each milestone.
