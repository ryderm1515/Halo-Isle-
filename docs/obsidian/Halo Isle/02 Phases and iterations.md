---
tags: [halo-isle, process]
---
# Phases and iterations

24+ versions pushed to GitHub between Nov 10 and Nov 18. Every version was checked with screenshots before moving on.

## Phase 0: Brief and references (Nov 10)
I wrote the brief and gathered nine reference sheets: character sheet, island concept, area breakdown, three pieces of key art (path, plaza, beach), two asset/texture sheets and an activity sheet. These were the blueprint for everything after.

![[01-character-sheet.png]]
![[05-key-art-plaza.png]]

## Phase 1: Prove the pipeline (Nov 10, v0.1–v0.2)
Goal: show that Blender models could be generated, exported and loaded in the browser before building anything big. First hero model built from measurements of the character sheet, first terrain, water and sky.

![[m1-hero-vs-sheet.png]]
![[m2-terrain.png]]

## Phase 2: The look (Nov 10, v0.3–v0.5)
Poly Haven textures on the terrain, the plaza kit in Blender (town hall, fountain, shops, lamps, benches), the golden-hour look (bloom, depth of field, a nostalgic colour grade), grass that bends around you, palms, cliffs and waterfalls.

![[m3-plaza-hall.png]]
![[m4-golden.png]]
![[m5-beach.png]]

## Phase 3: Make it a game (Nov 10, v0.6–v0.8)
HUD and minimap, coins, 30 Sun Stars, 5 halo shards, islanders with dialogue, ring races, Bubble Pop, the ruins puzzle. Movement overhaul (sprint, slide, triple jump). The aqua-gel UI, title screen, wardrobe, island map. Hang glider, golf carts, diving for pearls, enterable buildings, real recorded ambience.

![[m7-game.png]]
![[m10-title.png]]
![[m12-night.png]]

## Phase 4: Make him feel alive (Nov 11)
Biggest rework. New rig (spine, two-bone arms), and an animation system built on springs: steps driven by distance so feet don't slide, squash on take-off and landing, leaf that lags. Feedback rounds:
- "The articulation is broken" → full animation rewrite
- "Arms look like wings" → arms rebuilt as separate soft teardrops, no sideways raise
- "He's running way too fast" → step rate capped

![[m13-poses.png]]
![[m14-arms.png]]
![[m15-turn.png]]

## Phase 5: More to do (Nov 11, v0.9)
Inventory and stalls, fishing, the driving range (made easier with an aim line after feedback), wind with leaves and kites, a painted map with custom icons, a rebuilt pier, Whisper Jungle.

![[m14-golf.png]]
![[m14-pier-jungle.png]]

## Phase 6: v1.0, the big content pass (Nov 12)
Hidden cave behind the falls with a mine-cart ride through the mountain, the glyph-block portal puzzle, three new places (Driftwood Harbor, Cloudrest, Coconut Cay), archery, bowling, hoops, jet-ski and cart races, an arcade, fishing rewritten, an ocean swell. Deployed to GitHub Pages so anyone can play from a link. Wardrobe made free.

![[v2-4.png]]
![[v4-3.png]]
![[v5-0.png]]

## Phase 7: Polish for the presentation (Nov 18, v1.1)
- The creek by the plaza was a deep trench with short bridges and a floating step of water where it left the pool. Rebuilt as a shallow creek that runs naturally to the sea, with bridges that land on both banks.
- Sports props remodelled in Blender (bowling lane, pins, hoop and net, archery targets, bow, arrows) and a new jet ski.
- Bowling got strike/spare moments, a swing animation, a pinsetter sweep and frame marks. Archery became three rounds (balloons, a moving target) with an arrow-cam. Hoops became a 60-second 3-point contest.
- Hang glider rewritten so diving builds speed and pulling up trades it for height.
- Click anywhere on the map to travel there.
- Hats fixed so they sit on the head properly.
- Easter egg: a snow globe on Cloudrest turns the island to winter.

Before → after (hats):
![[hats-before.png]]
![[hats-after.png]]

The creek, the new sports deck, the archery range and the new jet ski:
![[w2-0.png]]
![[w2-1.png]]
![[w5-1.png]]
![[w3-1.png]]
![[w4-0.png]]
