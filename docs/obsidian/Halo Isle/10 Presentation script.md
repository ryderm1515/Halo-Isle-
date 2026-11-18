---
tags: [halo-isle, presentation]
---
# Presentation script (~6 minutes) + live demo

## Setup (10 minutes before)
- [ ] Open **https://ryderm1515.github.io/Halo-Isle-/?v=2** and let it fully load (~81 MB). Click **Start** once so sound unlocks.
- [ ] Keyboard and mouse. Full screen the browser.
- [ ] Keep [[00 Start here]] open on a second screen or phone.
- [ ] Safety nets: **Backspace twice** → back to the plaza. **M** → click a place → **Travel here**.

## 1. Hook (20 s)
"This is Halo Isle — a 3D island you can explore right in the browser. I wanted the feeling of Wuhu Island from Wii Sports Resort, where you see something in the distance and just go, but pushed into Frutiger Aero: turquoise water, glossy materials, that optimistic early-2000s look."
*(Start the game, pan the camera around the plaza.)*

## 2. Where it started (45 s)
"I started with a written brief and reference sheets: the character, the island, the areas, key art. Those were the blueprint." *(Show [[01 The brief and references]].)*
"The first evening went from a pipeline test to a playable game. Here's how it looked at each step." *(Scroll [[03 Early iterations]] — the hero lineup → first plaza → golden hour → HUD.)*

## 3. The character (60 s, live)
Walk, run, jump, then press **1–9** for emotes.
"He has no animation files. His pose is worked out every frame from what he's doing, smoothed with springs — that's why he squashes when he lands and his leaf lags behind. This took the most rounds: the arms looked like wings, then he ran way too fast. I'd record my screen, point out what was wrong, and we'd fix it." *(Show the before/after in [[05 The character]].)*

## 4. Things to do (2 min, live)
1. **M** → click the **Sports Deck** (east of the plaza) → Travel here.
2. **Bowling** → try for a STRIKE (confetti + camera swing).
3. *(optional)* **Hoops** — "a 60-second 3-point contest, money balls are gold."
4. **M** → **Cloudrest** → **shake the snow globe** → "an Easter egg: the island turns to winter."
5. Jump off Cloudrest, press **Space** again mid-air → glider. "Dive to build speed, pull up to climb — you can stay up a long time."

## 5. How it's built (45 s)
"It's Three.js in the browser. Every model is made in Blender — but by Python script, so changing a model means editing numbers and re-running it. Textures are free CC0 ones from Poly Haven, sounds are real recordings. The ground is one formula, so the terrain, grass, trees and collision always agree. Every time I push to GitHub, it rebuilds and goes live automatically."

## 6. How I used AI (45 s)
"I used Claude as a coding agent. It wrote the code and the Blender scripts. My role was creative director: the brief, the references, taste calls, playtesting and feedback. It's all in my AI use log — including where it fell short, like when it said the hoops worked and they didn't. That's why the playtest loop mattered." *(Show [[09 AI use log]].)*

## 7. Close (15 s)
"27 versions in nine days. Next I'd build out the story at the summit and get other people playtesting. It's live at this link if you want to try it."

## If something breaks live
- Stuck → Backspace twice.
- Activity won't start → walk away and back, or press E again.
- Slow → "it's running a full 3D world in a browser tab; it's smoother on a desktop GPU."
