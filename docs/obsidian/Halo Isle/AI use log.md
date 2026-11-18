---
tags: [halo-isle, ai-use-log]
---
# AI use log

## Tools and models
| Tool | What it did |
|---|---|
| **Claude** (Anthropic), as a coding agent in the Claude app | Planned the build from my brief, wrote all the game code and the Blender scripts, ran them, took its own screenshots to check against my references, ran tests, pushed every version to GitHub. Models used over the project: **Claude Fable 5.2**, **Claude Sonnet 4.6**, **Claude Opus 5.5** (switched depending on the task and my usage limits). |
| **Blender** (run as a Python module) | Built and exported every 3D model, driven by scripts. |
| **Three.js, Vite** | The game engine layer and the build. |
| **GitHub / GitHub Actions / GitHub Pages** | Version history; automatic deploy so the game is always playable from a link. |
| **Poly Haven, CC0 sound recordings** | Licensed textures and audio. Logged in `LICENSES.md`. |
| **Obsidian** | Where I keep these notes and my AI use log. |

## Who did what
| Me (creative director) | AI (builder) |
|---|---|
| Wrote the brief and the addendum | Turned it into a plan and code |
| Provided all the reference sheets, including a second character sheet when the animation wasn't right | Measured and modelled against them, by script |
| Made the taste calls: Frutiger Aero but tasteful, free cosmetics, no first-person camera when talking, easy driving range | Implemented them |
| Playtested, screen-recorded, screenshotted bugs | Diagnosed from my recordings and fixed |
| Set priorities: what to fix first, what to cut, when to push | Reported what it couldn't verify |
| Decided where it's hosted (Vercel → GitHub Pages), made the repo public | Set up the automatic deploy |

## The prompt → result log (main rounds)
| When | What I asked | What changed |
|---|---|---|
| Nov 10 | The brief + references: "one polished area first, then outward" | v0.1 → v0.8 in one evening: pipeline, hero, plaza, look, game loop, UI |
| Nov 11 | "Animations broken, I want them 10× better, map UI with custom icons, interiors washed out, can't leave the cart, more wind, fix terrain" | Rig v3 + spring animation, new map, interiors relit, cart fix, wind system |
| Nov 11 | "Revamp rough models, stall shorter, inventory, golf range, jet skis, match the key art" | v0.9: inventory, stalls, fishing, range, pier, jungle |
| Nov 11 | "Driving range super easy with an aim line; arms still wonky; more places like a jungle; dock looks bad; no first-person when talking" | v0.9.1 |
| Nov 11 | Character deep pass from the sheet: no wing arms, squash and stretch, planted feet, leaf lag | Arms rebuilt, distance-driven steps |
| Nov 11 | "Running looks way too fast" | Step rate capped |
| Nov 12 | "Push to Vercel too" | Too big for Vercel → GitHub Pages instead |
| Nov 12 | "More mini-games, fix portal and plaza collision, portal animation, block puzzle, fishing, arcade, more settlements, swimming, hidden cave with a campsite and a mine, waves, beach balls… take it 10× further. Research Wuhu and Wii Sports" | v1.0 |
| Nov 12 | "Make customization free" | Free wardrobe |
| Nov 18 | "Fix the moat, bridges, floating water; polish golf, bowling, archery, hoops; remodel them in Blender; smoother infinite glider; map teleport; fix cosmetics; maybe snow; better jet ski; playtest and debug" | v1.1 |

## Where AI fell short (say this — it shows you were in control)
- **It can't feel the game.** It checks with screenshots and automated tests in a software renderer, so feel problems (speed, choppiness, the hoops not working) were caught by **my** playtests.
- **First attempts were often too basic** ("made with code" shapes) until I pushed for real Blender remodels.
- **It said things were done that weren't quite working** (e.g., the hoops), which is why the playtest → fix loop mattered.
- **Hosting:** its first plan (Vercel) didn't work with an 80 MB file; we switched.
- **It couldn't reach my laptop** at some points, so some files had to be handed over manually.

## Reflection
Directing an AI agent felt like being a creative director with a very fast team. The quality of the result tracked the quality of my inputs: the reference sheets did more than any paragraph, and specific feedback ("the arms look like wings", with a recording) got fixed in one round, while vague feedback took several. My main job was taste, priorities and testing.
