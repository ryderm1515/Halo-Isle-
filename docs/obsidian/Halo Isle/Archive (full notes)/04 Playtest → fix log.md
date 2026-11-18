---
tags: [halo-isle, process, feedback]
---
# Playtest → fix log

The loop: **I play → screenshot or screen-record what's wrong → describe it → it gets fixed → I check again.** These are my real playtest captures and what changed because of each.

## 1. "The animations are broken" (Nov 11, 2 pm recording)
What I said: the articulation was broken, the arms looked like wings when raised, I wanted the animations "10× better" and the character to *feel alive*.
![[rec-1111-2pm-02.jpg]]
![[rec-1111-2pm-05.jpg]]
**Fix:** new skeleton (spine, two-bone arms), and the whole animation system rewritten with springs. Arms rebuilt as separate soft shapes and stopped from raising sideways. See [[05 The character]].
![[m14-arms.jpg]]

## 2. "He's running way too fast" (Nov 11, 6:42 pm recording)
What I said: the wings are fixed, but the run looks way too fast.
![[rec-1111-642pm-2.jpg]]
![[rec-1111-642pm-4.jpg]]
**Fix:** the legs were cycling ~5 steps a second because steps were tied exactly to distance. Capped to ~2.3–3.2 a second. Trade-off: feet can slide a little at full sprint.

## 3. Map UI (Nov 11)
What I said: the map needed custom icons and to feel like a game, not a web page.
![[pt-1111-old-map.jpg]]
**Fix:** a painted island map with custom icons, places hidden under cloud until discovered, a to-do list. Later (Nov 18): click anywhere to **travel there**.
![[p1-map.jpg]]

## 4. Golf cart you couldn't leave, rough cart model (Nov 11)
![[pt-1111-old-cart.jpg]]
**Fix:** E to hop out (a bug was eating the key press), cart remodelled with a canopy, bench, bag well and lights, plus a boost.
![[v2-0.jpg]]

## 5. "The dock looks bad" (Nov 11)
![[pt-1111-old-dock.jpg]]
**Fix:** rebuilt as one model (deck, posts, rope rails, gazebo at the end).
![[m14-pier-jungle.jpg]]

## 6. Early playtest shots (Nov 10)
My first play sessions, used to judge the look against the key art.
![[pt-1110-beach.jpg]]
![[pt-1110-meadow.jpg]]
![[pt-1110-shop.jpg]]

## 7. The floating lake above the waterfall (Nov 12)
![[pt-1112-waterfall-bug.jpg]]
**Fix (v1.0):** the lake was sitting higher than the land around it. Rebuilt smaller, held in by a bank, with one notch where it spills over the falls.

## 8. Wardrobe cost coins (Nov 12)
![[pt-1112-wardrobe-prices.jpg]]
**My call:** cosmetics should be free — the point is to play, not grind. Made every hat, tint and leaf free.

## 9. Getting it online (Nov 12)
Vercel couldn't host the 80 MB single file, so we moved to GitHub Pages. First deploy failed because the repo was private; I made it public and switched Pages on.
![[gh-deploy-failed.jpg]]
![[gh-deploy-success.jpg]]

## 10. "Fix the moat, the bridges, the floating water; the games need to feel finished" (Nov 18)
**Fixes (v1.1):** the trench became a shallow creek that starts level with the pool (no floating water), avoids the driving range and runs to the sea; bridges are placed automatically wherever a path crosses and land on both banks; bowling, archery and hoops reworked with Blender models and big "STRIKE!" / "BULLSEYE!" moments; the hoop actually works now; glider rewritten; hats re-fitted.
![[w2-0.jpg]]
![[w2-1.jpg]]
![[w2-3.jpg]]
*Bridge beside the driving-range tee.*
