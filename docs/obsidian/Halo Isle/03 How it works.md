---
tags: [halo-isle, tech]
---
# How it works (plain version)

**It's a web page.** The game is JavaScript using **Three.js** (a 3D library for the browser), built with **Vite**. The finished game is bundled into one HTML file (~79 MB, mostly models, textures and sound) and published to **GitHub Pages**, so a link is all anyone needs.

**Every model comes from Blender, but by script.** Instead of modelling by hand, each asset (hero, buildings, palms, vehicles, props) is a Python script that drives Blender (`pipeline/blender/`). Run the script and Blender builds the model and exports a `.glb` file the game loads. Changing a model means changing the script and re-running it. Textures are free CC0 ones from Poly Haven; sounds are real CC0 or public-domain recordings.

**The island is a formula.** The ground height at any point is calculated (shoreline, hills, the plateau, the mountain, flat spots for towns, the lake, the creek). The same formula drives the terrain mesh, where grass grows, where trees go, and collision, so they always agree.

**The character is animated in code.** There are no animation clips. Each frame, the hero's pose is computed from what he's doing (speed, in the air or not, swimming, gliding) and smoothed with springs, which is why he squashes, settles and wobbles instead of snapping between poses.

**Water and grass are custom shaders.** Small GPU programs: the sea has a swell and a moving foamy waterline; the grass bends away from the hero and in the wind.

**Each activity is its own module.** Archery, bowling, hoops, fishing, the arcade, the portal puzzle, the cave and so on each live in their own file and plug into the same game loop, HUD and save system.

**Testing.** Screenshots are taken automatically by a headless browser to check how things look, and smoke tests run the activities without drawing to check they finish and award medals.

Numbers if asked: about 45 source modules, ~60 Blender-made models, 12 Blender scripts, 9 recorded sounds, 24+ versions on GitHub.
