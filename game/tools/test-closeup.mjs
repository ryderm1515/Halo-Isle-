const D = process.env.OUT;
export default [
 () => { AquaX.isle.teleport(-33, -64, 0); sim(0.5); const g = __restore.game; return { cam: Object.keys(g.cam).slice(0, 30), camObj: !!g.camera, cc: !!g.cam.camera, player: g.player && g.player.constructor && Object.keys(g.player).slice(0, 12), pl: !!g.scene.getObjectByName('Player') }; },
 'wait:5000',
 () => { sim(0.2); const r = window.__pipeReport; window.SX = r.start[0]; window.SZ = r.start[1];
   const g = __restore.game, C = AquaX.isle.C, cam = g.camera || g.cam.camera; const V = AquaX.T.Vector3;
   window.fix = (ex, ey, ez, tx, ty, tz, hidePlayer) => { const pl = g.scene.getObjectByName('Player'); if (pl) pl.visible = !hidePlayer;
     g.cam._place = () => { cam.position.set(C.x + ex, ey, C.z + ez); cam.lookAt(C.x + tx, ty, C.z + tz); }; g.cam._place(); };
   return r.errors; },
 () => { const I = AquaX.isle, h = I.pipeHero.obj, y = h.position.y; I.pipeHero.auto = false; I.teleport(SX + 6, SZ - 6, 0); I.pipeHero.play('Idle'); I.pipeHero.t = 0.4;
   fix(SX + 0.35, y + 0.75, SZ + 2.2 + 2.1, SX, y + 0.55, SZ + 2.2, true); }, D + '/ingame-05-hero-front.png',
 () => { const I = AquaX.isle, y = I.pipeHero.obj.position.y; I.pipeHero.play('Wave'); I.pipeHero.t = 0.72; fix(SX - 1.1, y + 0.8, SZ + 2.2 + 1.9, SX, y + 0.6, SZ + 2.2, true); }, D + '/ingame-06-hero-wave.png',
 () => { const I = AquaX.isle, y = I.pipeHero.obj.position.y; I.pipeHero.play('Run'); I.pipeHero.t = 0.12; fix(SX - 2.2, y + 0.6, SZ + 2.2, SX, y + 0.55, SZ + 2.2, true); }, D + '/ingame-07-hero-run-side.png',
 () => { const I = AquaX.isle, y = I.pipeHero.obj.position.y; I.pipeHero.play('Celebrate'); I.pipeHero.t = 0.35; fix(SX - 1.5, y + 2.6, SZ - 5.5, SX + 0.3, y + 0.6, SZ + 4, true); }, D + '/ingame-08-path-overview.png',
];
