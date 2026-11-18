---
tags: [halo-isle, brief]
---
# The brief and references

## My original brief (Nov 10)
This is what I wrote before any code existed. Every decision after this was measured against it.

> Okay, so basically what I'm wanting to do with Halo Isle is create this really beautiful, fully explorable island that's heavily inspired by Wuhu Island from Wii Sports Resort. I really love how that island feels, how everything is connected, how there are all these different places to explore, and how you can see landmarks in the distance and actually go visit them. But I want to take that idea and push it more in a Frutiger Aero direction. And I don't mean just throwing a bunch of glass buildings, bubbles, and futuristic stuff everywhere. I want it to be tasteful and actually beautiful. Like really nice turquoise water, bright blue skies, soft clouds, lush green hills, clean architecture, glossy materials, and that nostalgic, optimistic feeling that Frutiger Aero has. I still want it to feel natural, almost like this perfect little island resort that you wish you could actually visit.
>
> And I want the island itself to be really thoughtfully designed. I don't want just a bunch of random buildings and objects scattered around. I want different areas that actually feel unique, like a main town with a town hall and little shops, beaches, forests, mountains, waterfalls, an observatory, ancient ruins, and smaller hidden areas that you can discover. I really like the idea of having this huge mountain in the middle of the island with a mysterious halo above it that you can see from pretty much anywhere. Everything should connect naturally through paths, bridges, roads, and different ways of getting around. I want that same feeling you get in Nintendo games where you see something interesting off in the distance and immediately want to go check it out.
>
> Gameplay-wise, I don't want this to just be a walking simulator. I want there to be a ton of little things to do around the island, almost like Wii Sports Resort, where you can stumble across different mini-games and activities. Maybe you're at the beach and there's volleyball or surfing, or you're up in the mountains and there's some kind of gliding challenge, or you find a little racing activity somewhere. But I also want actual puzzles built into the environment, like ancient mechanisms, hidden doors, water puzzles, and things you have to figure out by exploring. And all of this should tie into a bigger story about the island and the mysterious halo above the mountain. I don't want the story to be super serious or take away from the relaxing atmosphere, but I do want there to be an actual reason to explore and discover things.
>
> And then there's the main character, which is honestly one of the most important parts of the entire game. I've provided the character reference sheets, and I want to get him looking as close to those as possible. He's this really cute, simple, glossy blue little creature with a rounded head, a soft squishy body, tiny arms and feet, and this little green leaf coming out of the top of his head. I want him to have that almost translucent jelly or soft plastic look, but still be really clean and visually appealing. His feet should always be visible when he's standing, and I don't want his arms or body looking like a bunch of separate shapes stuck together.
>
> But more importantly, I want him to have an insane amount of personality. Like genuinely Nintendo levels of personality. Even though his design is super simple, he should be incredibly expressive through his movement and animations. When he's standing still, maybe he's breathing a little, looking around, blinking, or tilting his head. When he runs, his little body should bounce and squash, his arms should move, and his leaf should react to the movement. When he jumps, I want that satisfying squash-and-stretch feeling, and when he lands, he should compress a little. I want him to be able to wave, celebrate, get confused, look surprised, sit down, fall asleep, and have all these cute little reactions. Basically, I want him to feel alive, not like some stiff 3D model being moved around the map.
>
> I also really want the environments to be interactive. Like when you walk through flowers, they react to you, or when you run into water, it splashes around your feet. Maybe you can bump into certain objects and they wobble, or find little hidden interactions that don't necessarily have anything to do with the main story but are just fun. That's the kind of attention to detail I'm looking for. I want the game to feel playful and reactive, where even just running around and exploring is enjoyable.
>
> Visually, I want to push the quality pretty far. I've provided asset sheets, texture references, character sheets, and environment concepts, and I want those to actually guide how the game is built. I don't want the environments to just be made out of basic shapes with bright colors thrown on them. I want Blender to be used to create and refine actual 3D models, especially for the character, buildings, foliage, and environmental props. And I want you to figure out a working pipeline for pulling properly licensed textures and assets from libraries like Poly Haven, ambientCG, Kenney, or Quaternius, then bringing those into Blender, adjusting them to fit the art style, and exporting them into the game. I want this to actually work, not just be something we talk about implementing. If we're using Three.js, the Blender models should be exported as GLB files and actually tested in the game. The materials, lighting, water, textures, and models should all feel consistent with the references.
>
> And I really want you to pay attention to the camera, controls, and overall game feel too. I want movement to feel smooth and responsive, with a really nice third-person camera, satisfying jumping, and natural transitions between animations. The UI should also have that clean, soft Frutiger Aero look, but I don't want it to look like a generic website dashboard. It should feel like an actual game interface and not constantly cover up the environment.
>
> I guess the biggest thing I'm trying to communicate is that I want this to feel like a real game that has been carefully art-directed, not just a bunch of features thrown together. I want the island to be memorable, the character to be genuinely lovable, and the gameplay to be fun even when you're not actively doing a quest or mini-game. I want that same feeling of charm and discovery that Nintendo games have, but with its own identity and this really beautiful Frutiger Aero atmosphere.
>
> And before you start completely rebuilding things, I want you to actually look through what we already have, figure out what's working, what's not, and how we can improve it. I don't necessarily want you to generate the entire island all at once if that means everything ends up looking unfinished. I'd rather have one really polished area with a beautiful environment, a fully expressive character, and some working gameplay that we can build outward from. Just make sure you're actually using the references I've provided and making thoughtful design decisions instead of taking shortcuts or filling the world with generic placeholder assets. I really want to push this project as far as we realistically can.

### Addendum (same night)
The point of the game is to **explore and have fun**. Progression comes through activities, secrets and cosmetics, with a mystery underneath (the halo). The story should never get in the way.

## The brief in five lines (say this out loud)
1. **Wuhu feeling, not Wuhu copy** — everything connected, landmarks you can see and go to.
2. **Tasteful Frutiger Aero** — not "glass and bubbles everywhere", but beautiful and natural.
3. **Not a walking simulator** — mini-games, environmental puzzles, a light story.
4. **A character with Nintendo-level personality** — simple design, all the life is in the motion.
5. **Real assets, real pipeline** — Blender models, properly licensed textures, actually tested in the game.

## The reference sheets I provided
These were the blueprint. Screenshots were compared back against them all the way through.

**Character sheet** — proportions, turnaround, materials, colour palette, animation keyframes, emotes.
![[ref-01-character-sheet.jpg]]

**Character sheet v2 (Nov 11)** — sent when the animation was broken: core animations, emotes, expression library, action poses.
![[ref-10-character-sheet-v2.jpg]]

**Island concept and areas**
![[ref-02-island-concept.jpg]]
![[ref-03-areas.jpg]]

**Key art** — the look I was chasing: the path, the plaza, the beach.
![[ref-04-key-art-path.jpg]]
![[ref-05-key-art-plaza.jpg]]
![[ref-06-key-art-beach.jpg]]

**Asset and activity sheets** — props, textures, UI, activity ideas.
![[ref-07-asset-texture-sheet.jpg]]
![[ref-08-activity-minigame-sheet.jpg]]
![[ref-09-game-asset-texture-sheet.jpg]]

## How each part of the brief was met
| Brief | Result |
|---|---|
| Fully explorable, connected island | 15 named places joined by paths, bridges, a pier, lifts, a mine line, a portal arch and click-to-travel on the map. Places start hidden under cloud on the map and reveal as you find them. |
| Tasteful Frutiger Aero | Turquoise water shader, glossy jelly hero, aqua-gel UI, golden-hour colour grade, soft bloom and depth of field. |
| Town hall, shops, beaches, forest, mountain, waterfalls, observatory, ruins, hidden spots | All in. Plus a jungle, tide pools, a harbor town, a terrace above town, an islet, a hidden cave. |
| Mountain with a halo visible from anywhere | Halo Peak, with the ring of light. Restoring it (5 shards) is the story. |
| Mini-games like Wii Sports Resort | 17+: races, archery, bowling, a 3-point contest, golf range, jet-ski slalom, cart rally, mine-cart dash, fishing, arcade, Bubble Pop, Keepy-Up, Slide Rush, glide rings. |
| Environmental puzzles | Ruins gate puzzle, glyph-block arch puzzle, buried chest, diving for pearls. |
| Lovable character matching the sheets | Modelled from the sheet in Blender, rigged, animated in code: breathing, blinking, squash and stretch, planted feet, leaf lag, 9 emotes. |
| Interactive world | Grass and flowers bend around you, splashes, wobbling objects, beach balls with physics, cats, birds, gulls, crabs, kites in the wind. |
| Real Blender pipeline, licensed assets, GLB tested in game | Every model is a Blender Python script → GLB. Poly Haven CC0 textures. CC0 / public-domain sound recordings. Licences logged in `LICENSES.md`. |
| Smooth camera and controls | Spring third-person camera, sprint, slide, triple jump, long jump, glide, swim and dive. |
| One polished area first, then outward | Exactly how it went: hero + plaza first, then outward. See [[02 Timeline — every version]]. |
