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
