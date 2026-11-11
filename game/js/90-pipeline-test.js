/* Halo Isle pipeline test (Phase 1): loads three Blender-exported GLBs into the running game on
   Halo Isle's south beach. The stone path conforms to the terrain and is walkable (ground hook);
   palms get trunk colliders; the new hero stands on the path and cycles its Blender clips.
   Assets arrive as data URIs in window.__PIPE (written by tools/build_p1.py). */
AquaX.mod('pipeline', (X, g) => {
  const T = X.T, I = X.isle, P = window.__PIPE, load = window.__loadGLB;
  if (!I || !P || !load) { console.error('[pipe] missing', !!I, !!P, !!load); return; }
  const C = I.C, root = new T.Group(); root.name = 'PipelineTest'; g.scene.add(root);
  const Lp = (window.__PIPE_LAYOUT = { start: [-33, -59], heading: 0 });   // local isle coords; path runs +Z inland
  const report = (window.__pipeReport = { loaded: {}, errors: [] });
  const gy = (lx, lz) => I.gy(C.x + lx, C.z + lz);
  // Box3 isn't in window.__T; borrow the bundle's class from a computed bounding box
  const Box3 = (() => { const b = new T.BufferGeometry(); b.setAttribute('position', new T.BufferAttribute(new Float32Array(3), 3)); b.computeBoundingBox(); return b.boundingBox.constructor; })();
  // --- simple clip sampler (the game bundle tree-shook AnimationMixer)
  function sampler(clip, rootObj) {
    const tr = clip.tracks.map((t) => { const [node, prop] = t.name.split('.'); return { t, o: rootObj.getObjectByName(node), prop, n: t.values.length / t.times.length }; }).filter((x) => x.o);
    const q1 = new T.Quaternion(), q2 = new T.Quaternion();
    return (time) => {
      for (const { t, o, prop, n } of tr) {
        const ts = t.times, v = t.values, tt = time % clip.duration; let i = 0;
        while (i < ts.length - 2 && ts[i + 1] < tt) i++;
        const a = ts[i], b = ts[i + 1] ?? a, k = b > a ? X.clamp((tt - a) / (b - a), 0, 1) : 0;
        if (prop === 'quaternion') { q1.fromArray(v, i * 4); q2.fromArray(v, Math.min(i + 1, ts.length - 1) * 4); o.quaternion.slerpQuaternions(q1, q2, k); }
        else { const tgt = o[prop]; const j = Math.min(i + 1, ts.length - 1) * n; tgt.set(X.lerp(v[i * n], v[j], k), X.lerp(v[i * n + 1], v[j + 1], k), X.lerp(v[i * n + 2], v[j + 2], k)); }
      }
    };
  }
  // --- hero jelly material (no transmission: fresnel rim + core tint; see pipeline/viewer/jelly.js)
  function jelly() {
    const m = new T.MeshPhysicalMaterial({ color: new T.Color('#63c6f4'), roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, sheen: 0.25, sheenColor: new T.Color('#bfeeff'), sheenRoughness: 0.4, specularIntensity: 0.7, iridescence: 0.1, iridescenceIOR: 1.25 });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.rimColor = { value: new T.Color('#e8fbff') }; sh.uniforms.coreColor = { value: new T.Color('#2aa8ee') };
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 rimColor; uniform vec3 coreColor;')
        .replace('#include <opaque_fragment>', 'float fres = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 2.6);\noutgoingLight = mix(outgoingLight, outgoingLight * coreColor * 1.6, 0.16 * (1.0 - fres));\noutgoingLight += rimColor * fres * 0.22;\n#include <opaque_fragment>');
    };
    return m;
  }
  const shadows = (o) => o.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  // --- path pieces: conform vertices to terrain, register as walkable ground (+7 cm)
  const pathZones = [];
  function placePath(gltf, lx, lz, ry) {
    const o = gltf.scene; o.rotation.y = ry; o.position.set(C.x + lx, 0, C.z + lz); o.updateMatrixWorld(true);
    o.traverse((m) => {
      if (!m.isMesh) return;
      m.geometry = m.geometry.clone(); const p = m.geometry.attributes.position, w = new T.Vector3();
      for (let i = 0; i < p.count; i++) { w.fromBufferAttribute(p, i).applyMatrix4(m.matrixWorld); const h = I.gy(w.x, w.z); p.setY(i, p.getY(i) + h); }
      p.needsUpdate = true; m.geometry.computeVertexNormals(); m.geometry.computeBoundingSphere(); m.geometry.computeBoundingBox();
      m.receiveShadow = true;
    });
    root.add(o);
    const inv = new T.Matrix4().copy(o.matrixWorld).invert();
    pathZones.push({ inv, box: new Box3().setFromObject(o) });
    return o;
  }
  const og = I.ground;
  I.ground = (x, z, y) => {
    let h = og(x, z, y);
    for (const zn of pathZones) {
      if (x < zn.box.min.x || x > zn.box.max.x || z < zn.box.min.z || z > zn.box.max.z) continue;
      const l = new T.Vector3(x, 0, z).applyMatrix4(zn.inv);           // path-local: x across, -z along (curves: box test only)
      if (Math.abs(l.x) <= 1.2 || zn.curve) { const hp = I.gy(x, z) + 0.072; if (hp > h && hp <= y + 0.8) h = hp; }
    }
    return h;
  };
  const place = (o, lx, lz, ry = 0) => { o.position.set(C.x + lx, gy(lx, lz), C.z + lz); o.rotation.y = ry; shadows(o); root.add(o); return o; };
  (async () => {
    try {
      const [st, cu, pa, pb, hero] = await Promise.all([P.pathStraight, P.pathCurve, P.palmA, P.palmB, P.hero].map((u) => load(u)));
      let [sx, sz] = Lp.start;
      while (gy(sx, sz) - I.Y0 < 0.5 && sz < 0) sz += 0.5;              // walk inland until the sand is dry
      Lp.start = [sx, sz]; report.start = Lp.start;
      placePath(st, sx, sz, Math.PI); placePath(await load(P.pathStraight), sx, sz + 4, Math.PI);
      const cz = placePath(cu, sx, sz + 8, Math.PI); pathZones[pathZones.length - 1].curve = true;
      place(pa.scene, sx + 3.2, sz + 3, 0.6); I.colliders.push([C.x + sx + 3.2, C.z + sz + 3, 0.32]);
      place(pb.scene, sx - 2.4, sz - 2.2, 2.4); I.colliders.push([C.x + sx - 2.4, C.z + sz - 2.2, 0.32]);
      const h = hero.scene; h.traverse((m) => { if (m.isMesh && /Jelly/.test(m.material.name)) m.material = jelly(); else if (m.isMesh && /Leaf/.test(m.material.name)) { m.material.side = T.DoubleSide; } });
      place(h, sx, sz + 2.2, 0); h.position.y += 0.072;
      const clips = Object.fromEntries(hero.animations.map((c) => [c.name, sampler(c, h)]));
      const order = ['Idle', 'Wave', 'IdleLook', 'Celebrate', 'Walk', 'Run'];
      I.pipeHero = { obj: h, clips, play: (n) => { I.pipeHero.cur = n; I.pipeHero.t = 0; }, cur: 'Idle', t: 0, auto: true };
      X.updaters.push((time, dt) => {
        const ph = I.pipeHero; ph.t += dt;
        if (ph.auto) { const dur = hero.animations.find((c) => c.name === ph.cur).duration; if (ph.t > Math.max(dur, 2.5)) { ph.cur = order[(order.indexOf(ph.cur) + 1) % order.length]; ph.t = 0; } }
        ph.clips[ph.cur](ph.t);
      });
      report.loaded = { pathStraight: true, pathCurve: true, palmA: true, palmB: true, hero: hero.animations.map((c) => c.name) };
      const bb = new Box3().setFromObject(h); report.heroSize = bb.getSize(new T.Vector3()).toArray().map((v) => +v.toFixed(3));
    } catch (e) { report.errors.push(String(e && e.stack || e)); console.error('[pipe]', e); }
  })();
});
