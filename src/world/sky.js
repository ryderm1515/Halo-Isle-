import * as T from 'three';
import { rng } from '../util/noise.js';
export const SUN_DIR = new T.Vector3(0.48, 0.74, 0.47).normalize();
export function buildSky(scene, renderer) {
  const mat = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false, uniforms: { sun: { value: SUN_DIR } },
    vertexShader: 'varying vec3 d;void main(){d=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_Position.z=gl_Position.w;}',
    fragmentShader: `varying vec3 d;uniform vec3 sun;void main(){vec3 n=normalize(d);float h=clamp(n.y,-.2,1.);
      vec3 zen=vec3(.07,.40,.93),mid=vec3(.25,.64,1.),hor=vec3(.72,.90,1.);
      vec3 c=mix(hor,mid,smoothstep(0.,.28,h));c=mix(c,zen,smoothstep(.2,.85,h));c=mix(c,vec3(.80,.94,1.),smoothstep(0.,-.12,h)*.7);
      float s=max(dot(n,sun),0.);c+=vec3(1.,.95,.8)*(pow(s,900.)*4.+pow(s,24.)*.22+pow(s,4.)*.10);
      gl_FragColor=vec4(c,1.);
      #include <colorspace_fragment>
    }` });
  const sky = new T.Mesh(new T.SphereGeometry(3000, 32, 16), mat); sky.renderOrder = -10; scene.add(sky);
  // environment map from the sky itself (plus a soft white floor bounce) so glossy things have something to reflect
  const envScene = new T.Scene(); envScene.add(new T.Mesh(sky.geometry, mat));
  for (const [x, y, z, sz, i] of [[900, 1500, 900, 900, 9], [-1400, 900, 300, 700, 3.5], [200, 700, -1500, 800, 2.5]]) { const b = new T.Mesh(new T.SphereGeometry(sz, 16, 12), new T.MeshBasicMaterial({ color: new T.Color(i, i, i) })); b.position.set(x, y, z); envScene.add(b); }
  for (const a of [0.5, 2.3, 4.2]) { const b = new T.Mesh(new T.BoxGeometry(170, 1700, 170), new T.MeshBasicMaterial({ color: new T.Color(7, 7, 7) })); b.position.set(Math.cos(a) * 2200, 900, Math.sin(a) * 2200); envScene.add(b); }
  { const fl = new T.Mesh(new T.CircleGeometry(2900, 24).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: '#bfe0f2' })); fl.position.y = -60; envScene.add(fl); }
  const pm = new T.PMREMGenerator(renderer); const env = pm.fromScene(envScene, 0.02, 1, 5000).texture; scene.environment = env; scene.environmentIntensity = 0.3; pm.dispose();
  // puffy clouds: clusters of soft spheres, lit from above
  const cmat = new T.MeshLambertMaterial({ color: '#ffffff', emissive: '#bcd9f7', emissiveIntensity: 0.62, fog: false });
  const r = rng(77), geo = new T.IcosahedronGeometry(1, 3), clouds = new T.Group(), dummy = new T.Object3D(), N = 46, per = 9, inst = new T.InstancedMesh(geo, cmat, N * per); let k = 0;
  const groups = [];
  for (let i = 0; i < N; i++) {
    const a = r() * Math.PI * 2, d = 420 + r() * 1500, y = 150 + r() * 190 + d * 0.06, s = 22 + r() * 46, cx = Math.cos(a) * d, cz = Math.sin(a) * d;
    for (let j = 0; j < per; j++) { const t = j / (per - 1) - 0.5, rs = s * (0.55 + r() * 0.6) * (1 - Math.abs(t) * 0.9); dummy.position.set(cx + t * s * 3.4 + (r() - 0.5) * s * 0.5, y + rs * 0.28 + (r() - 0.5) * s * 0.2, cz + (r() - 0.5) * s * 1.1); dummy.scale.set(rs * 1.25, rs * 0.82, rs); dummy.updateMatrix(); inst.setMatrixAt(k++, dummy.matrix); }
  }
  inst.frustumCulled = false; clouds.add(inst); scene.add(clouds);
  return { sky, clouds, env, update(dt, camPos) { clouds.rotation.y += dt * 0.0035; sky.position.copy(camPos); } };
}
