---
tags: [halo-isle, process, timeline]
---
# Timeline — every version

Every version was pushed to GitHub with a message describing it, so the whole history is public: https://github.com/ryderm1515/Halo-Isle-/commits/main

## Tuesday Nov 10 — from nothing to a playable game (one evening)
| Time | Version | What happened |
|---|---|---|
| 7:19 pm | **v0.1** | Asset pipeline proven: hero, palm and path models made in Blender by script, exported, loaded in a browser test page |
| 7:33 pm | — | My brief and the nine reference sheets added to the repo as the blueprint |
| 7:56 pm | **v0.2** | Clean codebase (Vite + Three.js). Hero v2 rebuilt to match the character sheet. First island terrain, water, sky |
| 8:12 pm | **v0.3** | Real textures on the ground (Poly Haven sand, grass, cliff, paving). The plaza kit built in Blender: town hall, fountain, shops, lamps, benches, signs |
| 8:33 pm | **v0.4** | The **golden-hour look**: bloom, depth of field, a nostalgic colour grade. Meadow grass and wildflowers that bend around you |
| 8:38 pm | **v0.5** | Palms v2 (ringed trunks, broad fronds), foliage across the island, cliff waterfalls |
| 9:24 pm | **v0.6** | **It's a game now:** HUD and minimap, coins, 30 Sun Stars, 5 halo shards, islanders who talk, ring races, Bubble Pop |
| 11:20 pm | **v0.7** | Movement overhaul: sprint, slide, skid, triple jump, long jump |
| 11:28 pm | **v0.8** | UI overhaul (aqua-gel theme), **title screen**, wardrobe, settings, pause |
| 11:43 pm | **v0.8** | Hang glider, golf carts, diving for pearls, enterable buildings, real recorded ambience |
| 11:46 pm | — | One-file build (the whole game in a single HTML file) |

![[e01-viewer-01-hero-lineup.jpg]]
*v0.1: the first models out of the pipeline — hero variations in a test viewer.*

![[m2-plaza.jpg]]
*v0.2: first plaza. Plain, but every piece is a real Blender model.*

![[m4-golden.jpg]]
*v0.4: the golden-hour grade is the moment it started to look like the key art.*

![[m7-game.jpg]]
*v0.6: HUD, coins and the minimap — now it's a game.*

![[m10-title.jpg]]
*v0.8: title screen in the aqua-gel style.*

![[m12-night.jpg]]
*v0.8: day/night cycle — lamps come on at night.*

## Wednesday Nov 11 — making him feel alive, and more to do
| Time | Version | What happened |
|---|---|---|
| 2:03 pm | — | **My playtest recording**: animations broken, arms "like wings", map UI bad, interiors washed out, can't leave the golf cart, terrain glitches |
| 2:43 pm | **rig v3** | Hero rebuilt with a spine and two-bone arms; whole animation system rewritten with springs and a real step cycle |
| 2:51 pm | — | Vehicles rebuilt (you can leave the cart now), jet skis, glider that opens mid-air, new animals (cats, birds, gulls, crabs, fish) |
| 3:27 pm | **v0.9** | Inventory, pickups, shop stalls, fishing, **driving range**, wind with leaves and kites, a painted map with custom icons, pier rebuilt, Whisper Jungle |
| 4:25 pm | **v0.9.1** | Driving range made easy (aim line, hold-to-fill power), arms keep the body's shape, one-piece pier |
| 6:40 pm | — | Arms rebuilt as soft teardrops; feet stay planted |
| 6:42 pm | — | **My second recording**: "arms fixed, but he runs way too fast" |
| 6:44 pm | — | Step rate slowed |

![[rec-1111-2pm-05.jpg]]
*From my 2 pm recording: the old arms raised sideways like wings.*

![[m13-poses.jpg]]
*Pose sheet used to check the new rig: idle, walk, run, jump, every emote.*

![[m15-turn.jpg]]
*Turnaround after the fix: front, side, back.*

![[m14-golf.jpg]]
*v0.9: the driving range.*

## Thursday Nov 12 — v1.0, the big content pass (overnight)
| Time | Version | What happened |
|---|---|---|
| 12:50 am | — | GitHub Pages deploy set up (Vercel couldn't host an 80 MB single file); every push now goes live automatically |
| 2:14 am | **v1.0** | Hidden cave behind the falls + mine-cart ride to a new harbor town; glyph-block portal puzzle; **Driftwood Harbor, Cloudrest, Coconut Cay**; archery, bowling, hoops, jet-ski and cart races; **the arcade**; fishing rewritten; ocean swell |
| 2:27 am | **v1.0** | Arrival cutscenes, "unstuck" key, arcade fixes, fishing log in the journal |
| 12:46 pm | — | Wardrobe made free (my call: cosmetics shouldn't be grind) |

![[gh-deploy-success.jpg]]
*The deploy pipeline going green.*

![[v2-4.jpg]]
*v1.0: the hidden cave — campfire, sleeping bag, crystals, dripping stone, and the mine cart at the back.*

![[v4-3.jpg]]
*v1.0: the plaza arch and its three hollows (the glyph-block puzzle).*

![[v5-0.jpg]]
*v1.0: Halo Arcade — three cabinets you can actually play.*

![[v4-1.jpg]]
*v1.0: Coconut Cay.*

## Wednesday Nov 18 — v1.1, polish for this presentation
| Time | Version | What happened |
|---|---|---|
| 3:02 am | **v1.1** | The "moat" by the plaza rebuilt as a real creek; bridges that span it; sports props remodelled in Blender; bowling, archery and hoops reworked; glider physics; click-to-travel map; hats re-fitted; snow Easter egg |
| 3:05 am | — | First version of these notes |

![[w2-0.jpg]]
*v1.1: the creek now runs from the falls to the sea, with bridges where paths cross.*

![[w5-1.jpg]]
*v1.1: the new bowling lane (Blender model) on the Sports Deck.*

![[hats-before.jpg]]
![[hats-after.jpg]]
*v1.1: hats before (floating, too small, buried) and after (measured to the head).*
