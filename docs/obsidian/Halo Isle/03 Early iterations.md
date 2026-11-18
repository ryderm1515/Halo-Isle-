---
tags: [halo-isle, process, early]
---
# Early iterations — how it started

The brief said: *"I'd rather have one really polished area… that we can build outward from."* So the first evening was about proving the pipeline and nailing one place (the plaza) and one character before anything else.

## Step 0 — the starting point
Before the rebuild there was an early prototype: the hero on a flat test island. My brief asked to look at what existed first, keep what worked, and rebuild the rest properly.
![[e00-first-hero-lineup.jpg]]

## Step 1 — prove the pipeline (v0.1)
The question: can Blender models be made, exported as GLB and loaded in the browser without hand-modelling every one? Answer: yes, by writing each model as a **Python script that drives Blender**. Run the script → Blender builds the model → exports a `.glb` → the game loads it.
![[e01-viewer-01-hero-lineup.jpg]]
*Hero variations straight out of the scripts.*
![[e01-viewer-02-palm-path-hero.jpg]]
*Palm, stone path and hero together — the first "scene".*
![[e01-ingame-grid.jpg]]
*The pipeline test page: the models loaded in the browser and checked from several angles.*

**Why scripts instead of hand-modelling?** Every change is repeatable and reviewable. If the hero's arms are wrong, you change two numbers and re-run, instead of re-sculpting.

## Step 2 — match the character sheet (v0.2)
The hero was rebuilt by measuring the sheet: head-to-body ratio, how far the feet stick out, leaf angle, the glossy jelly material. Then compared side by side.
![[m1-hero-vs-sheet.jpg]]
*Top: the sheet. Bottom: the model. Same proportions, feet always visible.*
![[m1-hero-turn.jpg]]
![[m1-hero.jpg]]
*First time in the world: flat green ground, cliff placeholder.*

## Step 3 — the ground, water and sky (v0.2)
The island's shape is a formula (see [[08 How it's built]]). First pass: sand, water, sky.
![[m2-terrain.jpg]]
![[m2-plaza.jpg]]

## Step 4 — real textures and the plaza kit (v0.3)
Poly Haven textures blended on the ground (sand near water, grass on flats, rock on steep slopes, paving in the plaza). Town hall with a glass dome, fountain, shops, lamps and benches modelled in Blender to match the plaza key art.
![[m3-plaza-hall.jpg]]
![[m3-meadow.jpg]]
*Grass that actually reads as grass, and a tree line.*

## Step 5 — the look (v0.4–v0.5)
This is where it started to look like the key art: a golden-hour colour grade, soft bloom, depth of field, grass and wildflowers that bend as you walk through, palms with proper fronds, waterfalls on the cliffs.
![[m4-golden.jpg]]
![[m5-plaza.jpg]]
![[m5-beach.jpg]]
*Compare with the beach key art in [[01 The brief and references]].*
![[m6-view.jpg]]

## Step 6 — make it a game (v0.6–v0.8)
A pretty island isn't a game. Added: coins and Sun Stars to find, halo shards for the story, islanders to talk to, ring races, the HUD and minimap, then the title screen, wardrobe and menus in the aqua-gel style, then vehicles and interiors.
![[m7-game.jpg]]
![[m8-town.jpg]]
![[m9-night.jpg]]
![[m10-title.jpg]]
![[m11-plaza.jpg]]
![[m11-shop.jpg]]
![[m12-shop.jpg]]
![[m12-lighthouse-in.jpg]]
*Inside the lighthouse — interiors you can walk into.*
![[m12-obs-in.jpg]]
*Inside the observatory (this is the "washed-out interior" I flagged later — fixed on Nov 11).*

## What I learned from the early phase
- **References beat descriptions.** The sheets did more work than any paragraph I wrote.
- **One polished area first** made every later area faster, because the kit (textures, lamps, benches, materials, the grade) was already solved.
- **Looking good ≠ feeling good.** By the end of day one it *looked* right, but the character didn't *feel* right, which became day two.
