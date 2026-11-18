---
tags: [halo-isle, tech]
---
# How it's built (explained simply)

## The stack
- **Three.js** — a JavaScript library for 3D in the browser. Draws everything.
- **Vite** — the dev server and bundler. Packs the game into one ~81 MB HTML file.
- **Blender** — every 3D model, made by Python scripts (`pipeline/blender/`), exported as **GLB** (the standard 3D file for the web).
- **Poly Haven** — free CC0 textures (sand, grass, cliff rock, paving).
- **CC0 / public-domain sound recordings** — waves, wind, birds, etc. Sources in `LICENSES.md`.
- **GitHub** — version history. **GitHub Actions + GitHub Pages** — every push builds the game and publishes it to the link automatically.

## The pipeline, start to finish
1. A **reference sheet** says what something should look like.
2. A **Blender Python script** builds it: shapes, bevels, materials by name (e.g. `M_White`, `M_Wood`).
3. Blender **exports a GLB**.
4. The game **loads the GLB** and swaps in its own materials so everything matches.
5. A **headless browser** takes screenshots from set camera spots to check it against the reference.
6. Push to GitHub → it's **live** about a minute later.

## The island is one formula
Ground height at any point = a calculation (coastline, hills, plateau, mountain, the lake, the creek, flat spots for towns). The same formula drives:
- the terrain mesh
- which texture shows where (sand by the water, rock on steep slopes, grass on flats, paving on paths)
- where grass grows and trees go
- collision (what you stand on)
So they always agree. Moving the creek is changing a list of points.

## Shaders (small programs on the graphics card)
- **Water:** depth colour (turquoise shallows, deep blue), an ocean swell, foam where it meets the sand, and a waterline that breathes up and down the beach.
- **Grass:** thousands of blades that sway in the wind and bend away from the hero.
- **Snow:** one number (0 to 1) whitens the ground, grass and trees together.

## The look
Golden-hour lighting, **bloom** (soft glow on bright things), **depth of field** (background slightly soft), a warm nostalgic **colour grade**, a day/night cycle with lamps that turn on.

## The character
See [[05 The character]]: rigged in Blender, animated in code with springs.

## Each feature is its own module
`hero/` (character, controls) · `world/` (terrain, water, towns, landmarks) · `game/` (each activity: sports, fishing, portal, cave, arcade, golf, travel…) · `ui/` (HUD, map, menus) · `fx/` (wind, snow). They all plug into one game loop and one save file.

## Testing
- **Screenshots** from fixed camera spots after every change.
- **Smoke tests:** a script plays each activity at high speed without drawing (bowling all 5 frames, the 3-point contest, archery, fishing, the portal, the mine cart, the arcade, map travel, the glider) and checks it finishes and gives a medal with no errors.
- **My playtests** for the feel (see [[04 Playtest → fix log]]).
