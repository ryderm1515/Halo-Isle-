---
tags: [halo-isle, presentation, project-4]
---
# Halo Isle

AI 101, Project 4: Vibe Coding. A 3D island you explore in the browser: Wuhu Island from Wii Sports Resort, pushed into Frutiger Aero.

**Play it:** https://ryderm1515.github.io/Halo-Isle-/?v=2
**Code:** https://github.com/ryderm1515/Halo-Isle-

---

## 1. Build sentence
- "I'm building a 3D island in the browser that you explore freely, finding Wii Sports-style activities and collecting Sun Stars along the way."

## 2. How I picked the idea
- I wrote three ideas: **MuziBaby** (my Spotify CD site), **Squishy RNG** (a collecting game) and an **AI Workflow Checklist** (that one came from ChatGPT, and I disclosed it).
- I ran them through the **ESF Companion**, which challenges my ideas while I make the decisions. It asked whether I was picking Squishy RNG just because I'd already started it, and whether a 3D world was too big for the brief.
- I picked **Squishy RNG** and rejected the Checklist because it didn't give me room to be creative.
- **Record of Resistance:** the challenge warned me it could get too complicated. I kept the 3D world anyway, but said I'd cut movement and environment first if it broke.

## 3. The plan, PRD and ADRs
- **plan.md:** HTML game; for people who like Roblox simulators and satisfying collecting; no multiplayer, trading or real money.
- **PRD:** three features (roll and reveal, collect and display, earn and upgrade) with "done when" checks.
- **ADR-001:** third-person movement is a supporting system, not a fourth feature. **ADR-002:** scope stays at three features.

## 4. Where it went from there
- Squishy RNG pivoted to an island-restoration game. On **Nov 6** I added Halo Isle as one of its islands, with a ferry, a cave and a ring course.
- Halo Isle was the part I cared about, so on **Nov 10** I wrote a new brief and nine reference sheets and rebuilt it as its own game in Three.js.
- To be honest: my plan, PRD and ADRs still describe the original Squishy RNG idea and need updating to match.

![[origin-halo-isle-aerial.png]]
*Nov 6: the first Halo Isle, still part of Squishy RNG.*

![[ref-02-island-concept.jpg]]
*The island concept sheet from my brief.*

![[m4-golden.jpg]]
*Nov 10: first evening of the rebuild.*

## 5. Playable in one evening
- Nov 10, 7 pm to midnight: from a model test to a real game with a HUD, coins, 30 Sun Stars, islanders, a title screen and a glider.

![[m7-game.jpg]]

## 6. One failure and its fix
- **Failure:** in my playtest recording the character's arms stuck out like wings, and after the first fix he ran way too fast.
- **Fix:** the rig was rebuilt with a spine and soft arms, and the step rate was slowed.
- **Same test after:** I recorded again and checked the turnaround.

![[rec-1111-2pm-05.jpg]]
*Before: arms like wings (my recording).*

![[m15-turn.jpg]]
*After: the rebuilt rig.*

## 7. The world and things to do
- The plaza, a creek from the waterfall to the sea, three towns and a hidden cave behind the falls.
- Wii Sports-style activities: bowling, archery, a 3-point contest, a driving range, races, fishing, an arcade, and a glider. Easter egg: shake the snow globe and the island turns to winter.

![[bowling-live.jpg]]

## 8. How it's built
- Three.js in the browser. Every model is made in Blender **by Python script**, so changing a model means editing numbers and re-running it.
- Every push to GitHub rebuilds the site and puts it live on GitHub Pages (that was one of the optional stretch goals).

![[e01-viewer-01-hero-lineup.jpg]]

## 9. How I used AI, and which decisions were mine
- Claude wrote the code and the Blender scripts. I worked the ESF way: the AI suggests and challenges, and I decide.
- **My decisions:** the idea, the rejected idea, the brief and references, the Frutiger Aero direction, rebuilding Halo Isle on its own, free cosmetics, and every playtest call (arms, speed, the moat, bridges, hats, glider feel).
- It wasn't always right. Once it said the hoops worked when they didn't, so I kept testing everything myself. Full record: [[AI use log]]

## 10. What still fails, and what's next
- **Still fails:** the first load is slow (one ~81 MB file), it's only tested on my Mac, the story is light, and some key-art pieces (cable car, wind turbines) aren't built yet.
- **Next:** an ending at Halo Peak, classmate playtests, and a faster first load.

---
Screenshots by day: [[Screenshots/2026-11-06|Nov 6]] · [[Screenshots/2026-11-10|Nov 10]] · [[Screenshots/2026-11-11|Nov 11]] · [[Screenshots/2026-11-12|Nov 12]] · [[Screenshots/2026-11-18|Nov 18 (today)]]
Assignment files: [[ESF Companion Challenge]] · [[vibe-coding/plan|plan]] · [[vibe-coding/prd|PRD]] · [[ADR-001]] · [[ADR-002]]
