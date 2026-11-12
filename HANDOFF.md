# Halo Isle: handoff (updated 2026-11-10)

Ryder's goal: Halo Isle, an exploration-and-activity game first (Wii Sports Resort charm + Frutiger Aero), puzzles and story woven in, never forced.
The reference sheets in `references/` are the art blueprint: compare screenshots against them and keep refining. Brief: `references/BRIEF.md`.

## Standing rules
- Push every version/update to GitHub: `ryderm1515/Halo-Isle-` (decided 2026-11-10; replaces the old squishy-rng question).
- Use Blender for real models; record source/author/license for every downloaded asset before use.
- Originality: Wuhu Island's feel, never its layout, names or assets.
- Ryder wants process screenshots as work lands, a warm early-2000s golden-hour look, and the world to feel alive.

## State
- Clean Vite + Three.js codebase (old compiled build retired). See README for the module map.
- Hero v2 from sheet measurements; world has the plaza, beach, ruins, lighthouse, wind ridge, observatory, lake + falls, Halo Peak with halo.
- Game loop: coins, 30 Sun Stars, 5 halo shards, islanders, races, Bubble Pop, ruins puzzle, breeze lifts, Leaf Glide unlock, jelly tints, journal, minimap, save data.

## Known gaps (honest list)
- Hero: leaf and head still not one-to-one with the sheet; material highlights softer than the sheet's.
- Plaza is sparser than the key art; shops are simple; no cable car, bridge or ferry yet.
- Cliffs/mountain read more barren than the art; no vines on ruins; no interior spaces.
- Activities so far: 4 ring courses + Bubble Pop. Volleyball, surfing, boat race, target and arcade games from the sheets are not built.
- Performance has only been checked in a software renderer, not on Ryder's Mac GPU.

## v1.0 (Nov 12)
New modules: `src/game/kit.js` (shared helpers, camera override, meter), `toys.js` (beach balls, swim wake), `fishing.js`, `portal.js` (glyph blocks + arches),
`cave.js` (hidden cave, mine cart), `sports.js` (archery, bowling, hoops, Power Cruise, Cart Rally), `arcade.js`, `src/world/towns.js` (Driftwood Harbor, Cloudrest, Coconut Cay, stream, signs).
Terrain: `layout.js` now holds PONDS (with rim + outlet), STREAM, CAY, HARBOR, TERRACE. Sea swell lives in `water.js` (`waveAt`).
Vehicles: `pipeline/blender/make_v10.py` (it imports make_v9, which re-exports the v9 assets as a side effect; `git checkout` those afterwards).
Tests without drawing: `node tools/smoke2.mjs [names]` uses `game.sim(n)` and `input.test`. `node tools/ev.mjs "<expr>"` evaluates in the running game.
Deploy: every push to main builds the single file and publishes to GitHub Pages (`.github/workflows/deploy.yml`).
Not verified by a human play-through: feel and difficulty of the new activities, the portal and mine-cart cameras in motion.
