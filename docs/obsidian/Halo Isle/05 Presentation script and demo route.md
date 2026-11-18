---
tags: [halo-isle, presentation]
---
# Presentation: script and demo route (~5 minutes)

## Before you start
- Open **https://ryderm1515.github.io/Halo-Isle-/?v=2** ten minutes early and let it fully load (it's ~79 MB). Click **Play** once so the sound unlocks.
- Keep this note open. If anything goes wrong, **Backspace twice** returns you to the plaza; **M** opens the map and you can click anywhere to travel.

## 1. What it is (30 s)
"Halo Isle is a 3D island you explore in the browser. I wanted the feeling of Wuhu Island from Wii Sports Resort, where you see something in the distance and just go, but with a Frutiger Aero look: turquoise water, glossy materials, that optimistic early-2000s vibe."

## 2. The brief and references (45 s)
"I started by writing a brief and making reference sheets: the character, the island, the areas, key art. Those were the blueprint. Every screenshot got compared back to them." *(show* [[01 Brief and how it was met]] *or the reference images)*

## 3. The character (45 s, live)
Walk around the plaza, jump, press **1–9** for emotes.
"He has no animation files. His pose is calculated every frame from what he's doing, with springs, so he squashes, settles and his leaf lags behind. This took the most iterations: the arms looked like wings, then he ran too fast. I'd record my screen and give feedback, and we'd fix it."

## 4. Show off the activities (2 min, live)
1. **M** → click the **Sports Deck** (east of the plaza) → **Travel here**.
2. **Bowling:** A/D to line up, hold Space, let go in the green. Try for the STRIKE animation.
3. **Hoops:** 60-second 3-point contest; money balls are gold.
4. **M** → **Cloudrest** (the terrace above town) → shake the **snow globe**: the island turns to winter. *(Easter egg, always gets a reaction.)*
5. Jump off Cloudrest, press Space again in the air to open the **hang glider**. W dives for speed, S pulls up.

*(If short on time, skip Hoops.)*

## 5. How it's built (45 s)
"It's Three.js in the browser. Every model is made in Blender, but by Python script, so changing a model means editing the script and re-running it. Textures are free CC0 ones from Poly Haven and the sounds are real recordings. The ground is one formula, so the terrain, grass, trees and collision all agree."

## 6. How I used AI (45 s)
"I used Claude as a coding agent: it wrote the code and the Blender scripts. My role was the creative director: the brief, the references, the taste calls, playtesting and feedback. It's logged in my AI use log, including where it fell short, like when it said something worked and it didn't, which is why the playtest loop mattered." *(see* [[04 AI use log]]*)*

## 7. Close (15 s)
"Next I'd build out the story at the summit and test it on more machines. You can play it from the link."

## Likely questions
- **"Did you write the code?"** No. I directed it; Claude wrote it. I made the design decisions, wrote the brief, provided the references, playtested and gave feedback every round.
- **"How long did it take?"** About a week of iterations, Nov 10 to Nov 18, 24+ versions on GitHub.
- **"What was hardest?"** Making the character feel alive. Simple design, so all the personality is in motion.
- **"What would you change?"** More story at the summit, and test on more computers; it's only been checked on mine and in a software renderer.
- **"Is anything copied from Wii Sports Resort?"** No. Same feeling, original layout, names and assets.
