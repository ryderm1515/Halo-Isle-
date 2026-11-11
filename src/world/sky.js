import * as T from 'three';
import { rng } from '../util/noise.js';
export const SUN_DIR = new T.Vector3(0.62, 0.5, 0.42).normalize();   // lowish late-afternoon sun
export function buildSky(scene, renderer) {
  const mat = new T.ShaderMaterial({ side: T.BackSide, depthWrite: false, fog: false, uniforms: { sun: { value: SUN_DIR }, night: { value: 0 }, dusk: { value: 0 }, t: { value: 0 }, moon: { value: new T.Vector3(-0.4, 0.6, -0.5).normalize() }, shA: { value: new T.Vector3(0, 1, 0) }, shB: { value: new T.Vector3(0, 1, 0) }, shP: { value: -1 } },
    vertexShader: 'varying vec3 d;void main(){d=normalize(position);vec4 p=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*p;gl_Position.z=gl_Position.w;}',
    fragmentShader: `varying vec3 d;uniform vec3 sun,moon,shA,shB;uniform float night,dusk,t,shP;
      float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
      float n2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);float a=fract(sin(dot(i,vec2(127.1,311.7)))*43758.5),b=fract(sin(dot(i+vec2(1,0),vec2(127.1,311.7)))*43758.5),c=fract(sin(dot(i+vec2(0,1),vec2(127.1,311.7)))*43758.5),e=fract(sin(dot(i+vec2(1,1),vec2(127.1,311.7)))*43758.5);return mix(mix(a,b,f.x),mix(c,e,f.x),f.y);}
      void main(){vec3 n=normalize(d);float h=clamp(n.y,-.2,1.);
      vec3 zen=vec3(.08,.40,.92),mid=vec3(.30,.66,1.),hor=vec3(1.,.90,.72);
      vec3 c=mix(hor,mid,smoothstep(0.,.28,h));c=mix(c,zen,smoothstep(.2,.85,h));c=mix(c,vec3(1.,.92,.78),smoothstep(0.,-.12,h)*.7); c=mix(c,vec3(1.,.86,.60),pow(max(dot(normalize(vec3(n.x,0.,n.z)),normalize(vec3(sun.x,0.,sun.z))),0.),3.)*smoothstep(.45,0.,h)*.55);
      float s=max(dot(n,sun),0.);c+=vec3(1.,.88,.6)*(pow(s,700.)*5.+pow(s,24.)*.35+pow(s,4.)*.16);
      // dusk: the horizon burns orange-pink
      c=mix(c,mix(vec3(1.,.55,.30),vec3(.55,.35,.62),smoothstep(0.,.5,h)),dusk*smoothstep(.75,0.,h)*.85);
      // night: deep blue dome, stars, moon, aurora curtains, the odd shooting star
      vec3 nc=mix(vec3(.05,.10,.24),vec3(.012,.02,.075),smoothstep(0.,.7,h));
      vec3 g=floor(n*190.); float st=step(.9972,h3(g))*smoothstep(.0,.15,n.y); st*=.55+.45*sin(t*2.5+h3(g+7.)*40.); nc+=vec3(.9,.95,1.)*st*(.5+h3(g+3.));
      vec3 g2=floor(n*70.); nc+=vec3(1.,.9,.8)*step(.9988,h3(g2))*smoothstep(0.,.2,n.y)*1.4;
      float md=max(dot(n,moon),0.); nc+=vec3(.95,.97,1.)*(smoothstep(.9992,.9996,md)*1.6+pow(md,60.)*.25+pow(md,6.)*.06);
      { float ang=atan(n.z,n.x); float band=n2(vec2(ang*3.2+t*.03,t*.05))*1.4+n2(vec2(ang*9.-t*.06,3.))*0.6; float curt=pow(sin(ang*14.+band*5.+t*.25)*.5+.5,2.2);
        float hh=clamp((n.y-.08)/.62,0.,1.); float env=smoothstep(0.,.18,hh)*smoothstep(1.,.35,hh)*smoothstep(.55,1.35,band+n2(vec2(ang*1.5,t*.02)));
        vec3 ac=mix(vec3(.15,1.,.55),vec3(.25,.6,1.),hh*1.3); ac=mix(ac,vec3(.75,.35,1.),smoothstep(.55,1.,hh)); nc+=ac*env*(.35+.65*curt)*.85; }
      if(shP>=0.){ vec3 hp=normalize(mix(shA,shB,shP)), tp=normalize(mix(shA,shB,max(shP-.16,0.))); vec3 ab=hp-tp; float tt=clamp(dot(n-tp,ab)/dot(ab,ab),0.,1.); float dd=length(n-(tp+ab*tt)); nc+=vec3(1.,.97,.9)*smoothstep(.006,.0,dd)*tt*2.5*sin(shP*3.14159); }
      c=mix(c,nc,night);
      gl_FragColor=vec4(c,1.);
      #include <colorspace_fragment>
    }` });
  const sky = new T.Mesh(new T.SphereGeometry(3000, 32, 16), mat); sky.renderOrder = -10; scene.add(sky);
  // environment map from the sky itself (plus a soft white floor bounce) so glossy things have something to reflect
  const envScene = new T.Scene(); envScene.add(new T.Mesh(sky.geometry, mat));
  for (const [x, y, z, sz, i] of [[900, 1500, 900, 900, 9], [-1400, 900, 300, 700, 3.5], [200, 700, -1500, 800, 2.5]]) { const b = new T.Mesh(new T.SphereGeometry(sz, 16, 12), new T.MeshBasicMaterial({ color: new T.Color(i, i, i) })); b.position.set(x, y, z); envScene.add(b); }
  for (const a of [0.5, 2.3, 4.2]) { const b = new T.Mesh(new T.BoxGeometry(170, 1700, 170), new T.MeshBasicMaterial({ color: new T.Color(7, 7, 7) })); b.position.set(Math.cos(a) * 2200, 900, Math.sin(a) * 2200); envScene.add(b); }
  { const fl = new T.Mesh(new T.CircleGeometry(2900, 24).rotateX(-Math.PI / 2), new T.MeshBasicMaterial({ color: '#bfe0f2' })); fl.position.y = -60; envScene.add(fl); }
  const pm = new T.PMREMGenerator(renderer); const env = pm.fromScene(envScene, 0.02, 1, 5000).texture; scene.environment = env; scene.environmentIntensity = 0.24; pm.dispose();
  // puffy clouds: clusters of soft spheres, lit from above
  const cmat = new T.MeshLambertMaterial({ color: '#f4f8ff', emissive: '#f3f6ff', emissiveIntensity: 0.6, fog: false });
  const r = rng(77), geo = new T.IcosahedronGeometry(1, 3), clouds = new T.Group(), dummy = new T.Object3D(), N = 46, per = 9, inst = new T.InstancedMesh(geo, cmat, N * per); let k = 0;
  const groups = [];
  for (let i = 0; i < N; i++) {
    const a = r() * Math.PI * 2, d = 420 + r() * 1500, y = 150 + r() * 190 + d * 0.06, s = 22 + r() * 46, cx = Math.cos(a) * d, cz = Math.sin(a) * d;
    for (let j = 0; j < per; j++) { const t = j / (per - 1) - 0.5, rs = s * (0.55 + r() * 0.6) * (1 - Math.abs(t) * 0.9); dummy.position.set(cx + t * s * 3.4 + (r() - 0.5) * s * 0.5, y + rs * 0.28 + (r() - 0.5) * s * 0.2, cz + (r() - 0.5) * s * 1.1); dummy.scale.set(rs * 1.25, rs * 0.82, rs); dummy.updateMatrix(); inst.setMatrixAt(k++, dummy.matrix); }
  }
  inst.frustumCulled = false; clouds.add(inst); scene.add(clouds);
  return { sky, clouds, env, uniforms: mat.uniforms, cloudMat: cmat, update(dt, camPos) { mat.uniforms.t.value += dt; clouds.rotation.y += dt * 0.0035; sky.position.copy(camPos); } };
}
