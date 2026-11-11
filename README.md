# Halo Isle

A third-person exploration and activity game on a resort island under a ring of light. Three.js + Vite, with every model built in Blender by script.

## Run it
```
npm install
npm run dev        # http://localhost:5173
```
Controls: WASD move · Space jump (again in the air to hop) · hold Space while falling to Leaf Glide (once earned) · Shift stroll · drag to look · wheel zoom · E interact · 1-9 emotes · Tab journal · M sound. Gamepad works too.

## What's where
- `src/hero/`: the hero (fused jelly mesh, eye-expression atlas, procedural animation), controller and camera
- `src/world/`: island heightfield, splat-textured terrain, water, sky, meadow grass, plaza layout, landmarks, materials
- `src/fx/`: look stack (bloom, depth of field, golden grade), wind, ambient life
- `src/game/`: save data, audio, collectibles, islanders, activities, the ruins puzzle, the halo-shard story
- `src/ui/`: HUD
- `pipeline/blender/`: asset scripts (`make_hero.py`, `make_palm.py`, `make_plaza.py`, `make_island.py`) → GLB in `public/assets`
- `references/`: Ryder's brief and the reference sheets everything is built against
- `shots/`: process screenshots; `tools/`: screenshot, layout-map and smoke-test scripts

## Rebuilding assets
`pip install bpy` (Blender as a Python module, 5.x), then e.g. `python pipeline/blender/make_plaza.py public/assets`.
Textures are Poly Haven CC0 (see `LICENSES.md` and each texture folder's `LICENSE.json`).
