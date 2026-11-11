// Halo Isle master layout. Three.js coords: +X east, +Z south, Y up, metres. Original layout (not a copy of any existing island).
export const PEAK = { x: -20, z: -95 };          // Halo Peak
export const HIGH = { x: -10, z: -60 };          // centre of the highland plateaus
export const SPOTS = {
  plaza: { x: 78, z: 158, h: 6.5, r: 44 },       // Town plaza (hub)
  beach: { x: 20, z: 232 },                      // Resort beach in the south cove
  pier: { x: 58, z: 246 },
  lighthouse: { x: -292, z: 38, h: 24 },         // west cape
  windRidge: { x: -150, z: -30 },
  observatory: { x: 128, z: -128 },
  ruins: { x: 176, z: 20 },
  falls: { x: 52, z: 104 },                      // waterfall off the first plateau, behind the plaza
  lake: { x: 44, z: 58, h: 36.6 },
};

// Footpaths (x, z). Heights are taken from the land at each node, so paths roll with the terrain but stay smooth.
export const PATHS = [
  { w: 2.6, pts: [[78, 118], [70, 104], [58, 100]] },                                   // plaza -> waterfall pool
  { w: 2.6, pts: [[62, 196], [48, 208], [34, 214]] },                                   // plaza -> beach
  { w: 2.4, pts: [[120, 150], [150, 128], [172, 92], [180, 56], [176, 24]] },           // plaza -> ruins (east)
  { w: 2.4, pts: [[36, 160], [-10, 172], [-70, 170], [-130, 142], [-190, 104], [-236, 66], [-270, 46]] },   // plaza -> lighthouse (west coast)
];
