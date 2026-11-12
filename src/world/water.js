import * as T from 'three';
import { heightAt } from './terrain.js';
// Open-sea swell, shared by the shader and by anything that floats. Fades out in the shallows so the beach stays calm.
const WT = { value: 0 };
const swell = (x, z, t) => 0.2 * Math.sin(x * 0.085 + z * 0.05 + t * 0.9) + 0.13 * Math.sin(z * 0.12 - x * 0.04 + t * 1.25);
export const waveAt = (x, z) => { const d = -heightAt(x, z); return d < 0.3 ? 0 : swell(x, z, WT.value) * Math.min(1, (d - 0.3) / 4.5); };
function seaGrid(N = 240, S = 3000) { const g = new T.BufferGeometry(), n = N + 1, pos = new Float32Array(n * n * 3), idx = new Uint32Array(N * N * 6), f = (u) => S * (0.2 * u + 0.8 * u * u * u); let q = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const k = (j * n + i) * 3; pos[k] = f(i / N * 2 - 1); pos[k + 2] = f(j / N * 2 - 1); }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * n + i, b = a + 1, c = a + n, d = c + 1; idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
  g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setIndex(new T.BufferAttribute(idx, 1)); g.boundingSphere = new T.Sphere(new T.Vector3(), S * 1.5); return g; }
export const NIGHT = { value: 0 }, WSUN = new T.Vector3(0.62, 0.5, 0.42).normalize();
export function buildWater(depthTex, depthSize, geo = null, level = 0) {
  const sea = geo ? 0 : 1; const u = { sea: { value: sea }, level: { value: level }, night: NIGHT, t: { value: 0 }, depth: { value: depthTex }, dsize: { value: depthSize }, sun: { value: WSUN }, cam: { value: new T.Vector3() } };
  const mat = new T.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false,
    vertexShader: `uniform float t,sea,dsize;uniform sampler2D depth;varying vec3 wp;varying float vsw;void main(){vec4 w=modelMatrix*vec4(position,1.);float d=-texture2D(depth,w.xz/dsize+.5).r;float k=sea*clamp((d-.3)/4.5,0.,1.);if(abs(w.x)>dsize*.49||abs(w.z)>dsize*.49)k=sea;vsw=(.2*sin(w.x*.085+w.z*.05+t*.9)+.13*sin(w.z*.12-w.x*.04+t*1.25))*k;w.y+=vsw+(1.-sea)*(sin(w.x*.21+t*1.1)*.03+sin(w.z*.17+t*.9)*.03);wp=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform float t,dsize,level,night,sea;uniform sampler2D depth;uniform vec3 sun,cam;varying vec3 wp;varying float vsw;
      vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
      float vor(vec2 p){vec2 i=floor(p),f=fract(p);float d=1.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y),o=hash(i+g);o=.5+.5*sin(t*.9+6.28*o);d=min(d,length(g+o-f));}return d;}
      float net(vec2 p){float a=vor(p),b=vor(p*1.7+3.1);return pow(1.-a,5.)*.9+pow(1.-b,6.)*.5;}
      void main(){
        float h=texture2D(depth,wp.xz/dsize+.5).r; float sw=sea*(.075+.075*sin(t*.75+wp.x*.045+wp.z*.03+sin(wp.x*.11)*.8)); float dep=max(level+sw-h,0.); if(level>.5&&dep>7.5) discard; if(sea>.5&&h>level+sw+.01) discard;
        vec2 q=wp.xz+vec2(sin(wp.z*.3+t*.7),cos(wp.x*.3+t*.6))*.35;
        vec3 shallow=vec3(.30,.93,.86),mid=vec3(.04,.70,.90),deepc=vec3(.02,.36,.80);
        vec3 c=mix(shallow,mid,smoothstep(.2,3.2,dep));c=mix(c,deepc,smoothstep(3.,13.,dep));
        float ca=net(q*.42);c+=vec3(.75,1.,.95)*ca*mix(.34,.07,smoothstep(.5,9.,dep));      // dancing light net
        vec3 V=normalize(cam-wp);vec3 N=normalize(vec3(sin(q.x*1.3+t*1.4)*.06+sin(q.y*.7-t)*.05,1.,cos(q.y*1.1+t*1.2)*.06+sin(q.x*.6+t*.8)*.05));
        N=normalize(N+vec3(-.017*cos(wp.x*.085+wp.z*.05+t*.9)+.0052*cos(wp.z*.12-wp.x*.04+t*1.25),0.,-.01*cos(wp.x*.085+wp.z*.05+t*.9)-.0156*cos(wp.z*.12-wp.x*.04+t*1.25))*sea*2.5);c+=vec3(.05,.09,.08)*vsw*2.;float fr=pow(1.-max(dot(N,V),0.),4.);c=mix(c,vec3(.80,.86,.92),fr*.45);
        float sp=pow(max(dot(reflect(-sun,N),V),0.),220.);c+=vec3(1.,.9,.7)*sp*2.2;
        float sparkle=step(.985,vor(q*2.3+t*.2))*smoothstep(.3,.9,fr+.25);c+=sparkle*.5;
        // shoreline foam: soft bands that roll in
        float band=sin(dep*5.5-t*1.6+sin(q.x*.5)*1.2+sin(q.y*.4)*1.2);
        float foam=smoothstep(.34,.0,dep)*.95+smoothstep(.23,.3,vsw)*.35*sea+smoothstep(.55,1.,band)*smoothstep(1.7,.25,dep)*.65;
        foam*=.75+.25*vor(q*1.6);c=mix(c,vec3(1.),clamp(foam,0.,1.));
        float a=mix(.55,.96,smoothstep(.0,2.2,dep));a=max(a,foam);a*=smoothstep(-.02,.06,dep+.03);
        float fogF=smoothstep(500.,2600.,length(cam-wp));c=mix(c,vec3(1.,.89,.72),fogF);
        c=mix(c,c*vec3(.16,.26,.5)+vec3(.0,.02,.05)+vec3(.6,.8,1.)*sp*.5+vec3(.2,.9,.6)*fr*.12,night);
        gl_FragColor=vec4(c,a);
        #include <colorspace_fragment>
      }` });
  const mesh = new T.Mesh(geo || seaGrid(), mat); mesh.position.y = level + sea * 0.15; mesh.frustumCulled = !sea; mesh.renderOrder = 1; mesh.name = 'Sea';
  return { mesh, uniforms: u, update(dt, camPos) { u.t.value += dt; if (sea) WT.value = u.t.value; u.cam.value.copy(camPos); } };
}
