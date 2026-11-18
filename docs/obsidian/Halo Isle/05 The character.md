---
tags: [halo-isle, character, animation]
---
# The character — the hardest part

The brief: *"Genuinely Nintendo levels of personality… even though his design is super simple, he should be incredibly expressive through his movement."*

A simple design means there's nowhere to hide: no clothes, no face rig, no hair. All the personality has to come from **how he moves**.

## How he's built
- **Model:** one soft body + head (a single smooth shape, so it never looks like "separate shapes stuck together"), separate teardrop arms tucked into the sides, feet that always show, a leaf on a stem.
- **Skeleton (rig v3):** root, hips, chest, head, two-bone arms with hands, feet, and three leaf bones. Weights smoothed so the jelly bends instead of creasing.
- **Material:** glossy, slightly translucent "soft plastic / jelly" with a clearcoat highlight.

![[m1-hero-vs-sheet.jpg]]
![[m15-turn.jpg]]

## How he's animated (no animation files at all)
Every frame, code works out his pose from what he's doing, then **springs** smooth it so nothing snaps:
- **Idle:** breathing, blinking, looking around, small weight shifts. Leave him long enough and he sits, then falls asleep.
- **Walk / run:** the step cycle is driven by distance travelled, so the feet plant instead of skating. The body bobs and waddles; arms swing opposite to the feet.
- **Jump:** squash down on take-off, stretch in the air, squash again on landing, then wobble back.
- **Leaf:** has its own springs, so it lags behind turns and flops when he lands.
- **Emotes (keys 1–9):** wave, celebrate, surprised, confused, sad, happy, stretch, sit, sleep. Activities also set poses (drawing a bow, carrying a block, shooting a hoop, bowling swing, fishing).
- **Expressions:** the eyes change shape (happy arcs, surprised circles, sleepy lines).

![[m13-poses.jpg]]
![[m13-poses-b.jpg]]

## The iterations (be ready to talk about these)
1. **v2 (Nov 10):** looked right in screenshots, but the animation was stiff and the arms broke when raised.
2. **My recording (Nov 11, 2 pm):** "the articulation is broken… I want them 10× better… I want him to *feel* alive." I also sent a second character sheet with the animations and emotes I wanted.
3. **Rig v3:** spine and two-bone arms, smoothed skin weights, spring-based animation, distance-driven steps.
4. **"The arms look like wings":** the arms were wide, flat paddles that swung out sideways. Rebuilt as round teardrops tucked into the body; stopped raising them sideways.
5. **"He's running way too fast":** steps capped at a natural rate.
6. **Nov 18:** hats re-measured to his head so every cosmetic sits properly.

![[rec-1111-2pm-05.jpg]]
*Before: arms out like wings.*
![[m14-arms.jpg]]
*After: arms keep the body's shape.*
![[hats-after.jpg]]
*Every hat measured to the head.*

## What to say
"He has no animation files. His pose is calculated every frame from what he's doing and smoothed with springs, which is why he squashes and settles instead of snapping between poses. This is where I gave the most feedback: the arms looked like wings, then he ran too fast, and each time I'd record my screen and we'd fix it."
