// Halo Isle master layout. Three.js coords: +X east, +Z south, Y up, metres. Original layout (not a copy of any existing island).
export const PEAK = { x: -20, z: -95 };          // Halo Peak
export const HIGH = { x: -10, z: -60 };          // centre of the highland plateaus
export const SPOTS = {
  plaza: { x: 78, z: 158, h: 6.5, r: 44 },       // Town plaza (hub)
  beach: { x: 20, z: 232 },                      // Resort beach in the south cove
  pier: { x: 58, z: 246 },
  lighthouse: { x: -292, z: 38, h: 24 },         // west cape
  windRidge: { x: -150, z: -30 },
  observatory: { x: 128, z: -128, r: 12, h: 25 },
  ruins: { x: 176, z: 20, r: 10, h: 7.8 },
  falls: { x: 37.5, z: 52.5 },                      // waterfall off the first plateau, behind the plaza
  lake: { x: 34, z: 35, h: 0 },
};

// Footpaths (x, z). Heights are taken from the land at each node, so paths roll with the terrain but stay smooth.
export const PATHS = [
  { w: 2.6, pts: [[78, 118], [66, 96], [52, 78], [45, 68]] },                                   // plaza -> waterfall pool
  { w: 2.6, pts: [[62, 196], [48, 208], [34, 214]] },                                   // plaza -> beach
  { w: 2.4, pts: [[120, 150], [150, 128], [172, 92], [180, 56], [176, 24]] },           // plaza -> ruins (east)
  { w: 2.4, pts: [[36, 160], [-10, 172], [-70, 170], [-130, 142], [-190, 104], [-236, 66], [-270, 46]] },   // plaza -> lighthouse (west coast)
];

// Fresh-water bodies: the highland lake that feeds the falls, and the plunge pool below them.
export const PONDS = [ { x: 34, z: 35, r: 14, depth: 4.5, level: 34.4, sx: 1.3, rim: 0.7, out: [0.2516, 0.9678] }, { x: 40.5, z: 60, r: 8.5, depth: 2.6, level: 5.9, sx: 1, rim: 0.35, out: [-0.31, 0.95] } ];
// A stream runs from the plunge pool down to the west end of the beach.
export const STREAM = [[40.5, 60], [37, 72], [28, 94], [15, 122], [7, 150], [4, 176], [9, 204]];
export const CAY = { x: 176, z: 346, r: 24 };          // Coconut Cay, the islet off the south-east shore
export const HARBOR = { x: -122, z: -168, h: 3.6, r: 24 };   // Driftwood Harbor on the north-west shore
export const TERRACE = { x: 10, z: 0, h: 70.5, r: 15 };      // Cloudrest, the high terrace above town
