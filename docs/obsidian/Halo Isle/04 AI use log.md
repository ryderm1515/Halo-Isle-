---
tags: [halo-isle, ai-use-log]
---
# AI use log

## Tools
- **Claude** (Anthropic), working as a coding agent: wrote the game code and the Blender scripts, ran them, took its own screenshots to check its work, and pushed every version to GitHub. Models used across the project: Claude Opus, Claude Sonnet and Claude Fable.
- **Blender** (as a Python module), driven by scripts Claude wrote, to build and export every 3D model.
- **Three.js + Vite** for the game itself; **GitHub** for version history; **GitHub Pages** to host it.
- Free asset libraries: **Poly Haven** (CC0 textures), CC0/public-domain sound recordings. Sources and licences are logged in `LICENSES.md`.

## Who did what
| Me | AI |
|---|---|
| Wrote the brief and set the vision (Wuhu feel + tasteful Frutiger Aero) | Turned the brief into a build plan and the code |
| Provided the reference sheets (character, island, areas, key art, assets, activities) | Measured and modelled against them in Blender, by script |
| Art direction and taste calls | Implemented, rendered screenshots, compared against the references |
| Playtested, recorded my screen, and gave feedback in rounds | Diagnosed and fixed from the recordings and screenshots |
| Decided scope and priorities (what to cut, what to push) | Flagged what wasn't done and what it couldn't verify |

## Feedback rounds that changed the game (my notes → what changed)
1. **"The animations are broken, I want them 10× better"** → new rig and a spring-based animation system.
2. **"The arms look like wings when raised"** → arms rebuilt and stopped raising sideways.
3. **"He's running way too fast"** → step rate capped.
4. **"Driving range is too hard"** → aim line and hold-to-fill power.
5. **"Scratch the first-person camera when talking"** → removed.
6. **"The dock looks bad"** → rebuilt as one model with a gazebo.
7. **"I want more to do, like Wuhu Island and Wii Sports"** → v1.0: sports, arcade, cave, settlements.
8. **"Make customization free"** → wardrobe is free.
9. **"Fix the moat, the bridges and the floating water; the games need to feel finished"** → v1.1 polish (creek, bridges, remodelled props, strike/bullseye moments, glider, map travel).

## Where AI fell short (honest)
- It checks its work in a software renderer and with screenshots; it can't *feel* the game, so feel issues (speed, choppiness) came from my playtests.
- Some first attempts looked rough or "made of basic shapes" until I pushed for Blender remodels.
- Hosting on Vercel failed (the single-file build is too big), so we switched to GitHub Pages.
- It sometimes reported things as done that I then found weren't quite working (e.g., the hoops), which is why the playtest → fix loop mattered.

## What I learned
Directing an AI agent is like being a creative director: the clearer the brief, references and feedback, the better the result. The references did more work than any written instruction.
