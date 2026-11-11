import * as T from 'three';
export function buildWater(depthTex, depthSize, geo = null, level = 0) {
  const u = { level: { value: level }, t: { value: 0 }, depth: { value: depthTex }, dsize: { value: depthSize }, sun: { value: new T.Vector3(0.62, 0.5, 0.42).normalize() }, cam: { value: new T.Vector3() } };
  const mat = new T.ShaderMaterial({ uniforms: u, transparent: true, depthWrite: false,
    vertexShader: `uniform float t;varying vec3 wp;void main(){vec4 w=modelMatrix*vec4(position,1.);w.y+=sin(w.x*.21+t*1.1)*.05+sin(w.z*.17+t*.9)*.05;wp=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform float t,dsize,level;uniform sampler2D depth;uniform vec3 sun,cam;varying vec3 wp;
      vec2 hash(vec2 p){p=vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3)));return fract(sin(p)*43758.5453);}
      float vor(vec2 p){vec2 i=floor(p),f=fract(p);float d=1.;for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){vec2 g=vec2(x,y),o=hash(i+g);o=.5+.5*sin(t*.9+6.28*o);d=min(d,length(g+o-f));}return d;}
      float net(vec2 p){float a=vor(p),b=vor(p*1.7+3.1);return pow(1.-a,5.)*.9+pow(1.-b,6.)*.5;}
      void main(){
        float h=texture2D(depth,wp.xz/dsize+.5).r, dep=max(level-h,0.);
        vec2 q=wp.xz+vec2(sin(wp.z*.3+t*.7),cos(wp.x*.3+t*.6))*.35;
        vec3 shallow=vec3(.30,.93,.86),mid=vec3(.04,.70,.90),deepc=vec3(.02,.36,.80);
        vec3 c=mix(shallow,mid,smoothstep(.2,3.2,dep));c=mix(c,deepc,smoothstep(3.,13.,dep));
        float ca=net(q*.42);c+=vec3(.75,1.,.95)*ca*mix(.34,.07,smoothstep(.5,9.,dep));      // dancing light net
        vec3 V=normalize(cam-wp);vec3 N=normalize(vec3(sin(q.x*1.3+t*1.4)*.06+sin(q.y*.7-t)*.05,1.,cos(q.y*1.1+t*1.2)*.06+sin(q.x*.6+t*.8)*.05));
        float fr=pow(1.-max(dot(N,V),0.),4.);c=mix(c,vec3(.80,.86,.92),fr*.45);
        float sp=pow(max(dot(reflect(-sun,N),V),0.),220.);c+=vec3(1.,.9,.7)*sp*2.2;
        float sparkle=step(.985,vor(q*2.3+t*.2))*smoothstep(.3,.9,fr+.25);c+=sparkle*.5;
        // shoreline foam: soft bands that roll in
        float band=sin(dep*5.5-t*1.6+sin(q.x*.5)*1.2+sin(q.y*.4)*1.2);
        float foam=smoothstep(.55,.0,dep)*.9+smoothstep(.55,1.,band)*smoothstep(1.7,.25,dep)*.65;
        foam*=.75+.25*vor(q*1.6);c=mix(c,vec3(1.),clamp(foam,0.,1.));
        float a=mix(.55,.96,smoothstep(.0,2.2,dep));a=max(a,foam);a*=smoothstep(-.02,.06,dep+.03);
        float fogF=smoothstep(500.,2600.,length(cam-wp));c=mix(c,vec3(1.,.89,.72),fogF);
        gl_FragColor=vec4(c,a);
        #include <colorspace_fragment>
      }` });
  const mesh = new T.Mesh(geo || new T.PlaneGeometry(6000, 6000, 1, 1).rotateX(-Math.PI / 2), mat); mesh.position.y = level; mesh.renderOrder = 1; mesh.name = 'Sea';
  return { mesh, update(dt, camPos) { u.t.value += dt; u.cam.value.copy(camPos); } };
}
