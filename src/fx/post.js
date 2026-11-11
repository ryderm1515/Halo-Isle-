import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Pass, FullScreenQuad } from 'three/addons/postprocessing/Pass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
// Look stack: bloom -> depth of field (focus follows the hero) -> tone map -> nostalgic golden grade -> FXAA.
class DofPass extends Pass {
  constructor(camera) {
    super(); this.camera = camera;
    this.u = { tDiffuse: { value: null }, tDepth: { value: null }, near: { value: 0.1 }, far: { value: 6000 }, focus: { value: 6 }, px: { value: new T.Vector2() }, amount: { value: 1 } };
    this.quad = new FullScreenQuad(new T.ShaderMaterial({ uniforms: this.u, vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: `uniform sampler2D tDiffuse,tDepth;uniform float near,far,focus,amount;uniform vec2 px;varying vec2 vUv;
        float lin(float d){float z=d*2.-1.;return 2.*near*far/(far+near-z*(far-near));}
        float coc(vec2 uv){float z=lin(texture2D(tDepth,uv).x); float f=smoothstep(90.,500.,z)*.5; float n=smoothstep(focus*.36,focus*.1,z)*1.0; return max(f,n)*amount;}
        void main(){ float c=coc(vUv); vec3 col=texture2D(tDiffuse,vUv).rgb; if(c<.02){gl_FragColor=vec4(col,1.);return;}
          vec3 acc=col; float w=1.;
          for(int i=0;i<24;i++){ float a=float(i)*2.39996, r=sqrt(float(i)+.5)/sqrt(24.); vec2 o=vec2(cos(a),sin(a))*r*c*7.5*px; float cs=coc(vUv+o); float k=smoothstep(0.,.25,cs+.12); acc+=texture2D(tDiffuse,vUv+o).rgb*k; w+=k; }
          gl_FragColor=vec4(acc/w,1.); }` }));
  }
  setSize(w, h) { this.u.px.value.set(1 / w, 1 / h); }
  render(renderer, writeBuffer, readBuffer) { this.u.tDiffuse.value = readBuffer.texture; this.u.tDepth.value = readBuffer.depthTexture; this.u.near.value = this.camera.near; this.u.far.value = this.camera.far; renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer); this.quad.render(renderer); }
}
const Grade = {
  uniforms: { tDiffuse: { value: null }, warm: { value: 0.34 }, sat: { value: 1.22 }, contrast: { value: 1.08 }, vig: { value: 0.2 }, glow: { value: 0.1 }, px: { value: new T.Vector2(1 / 1280, 1 / 720) } },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform float warm,sat,contrast,vig,glow;uniform vec2 px;varying vec2 vUv;
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb;
      vec3 b=vec3(0.); for(int i=0;i<8;i++){ float a=float(i)*.7854; b+=texture2D(tDiffuse,vUv+vec2(cos(a),sin(a))*px*4.5).rgb; } b*=.125;
      c=mix(c,max(c,b),glow);                                             // dreamy soft-focus on bright edges
      float l=dot(c,vec3(.299,.587,.114));
      c=mix(vec3(l),c,sat);
      vec3 hi=vec3(1.07,1.0,.84), sh=vec3(.94,.97,1.10);                  // golden highlights, blue-violet shadows
      c*=mix(vec3(1.),mix(sh,hi,smoothstep(.18,.7,l)),warm);
      c+=vec3(.03,.018,.0)*warm*smoothstep(.35,.9,l);                    // honey lift in the lights only
      c=(c-.5)*contrast+.5;
      vec2 q=vUv-.5; c*=1.-vig*dot(q,q)*2.;
      gl_FragColor=vec4(c,1.); }` };
export function buildPost(renderer, scene, camera, cheap = false) {
  const size = renderer.getDrawingBufferSize(new T.Vector2());
  const mk = () => { const rt = new T.WebGLRenderTarget(size.x, size.y, { type: T.HalfFloatType }); rt.depthTexture = new T.DepthTexture(size.x, size.y); rt.depthTexture.type = T.UnsignedIntType; return rt; };
  const composer = new EffectComposer(renderer, mk()); composer.renderTarget2.dispose(); composer.renderTarget2 = mk(); composer.writeBuffer = composer.renderTarget1; composer.readBuffer = composer.renderTarget2;
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new T.Vector2(size.x / 2, size.y / 2), 0.26, 0.7, 0.9); composer.addPass(bloom);
  const dof = new DofPass(camera); composer.addPass(dof);
  composer.addPass(new OutputPass());
  const grade = new ShaderPass(Grade); composer.addPass(grade);
  const fxaa = new ShaderPass(FXAAShader); composer.addPass(fxaa);
  const setSize = (w, h) => { const pr = renderer.getPixelRatio(); composer.setSize(w, h); for (const rt of [composer.renderTarget1, composer.renderTarget2]) rt.depthTexture.image.width = w * pr, rt.depthTexture.image.height = h * pr; grade.uniforms.px.value.set(1 / w, 1 / h); dof.setSize(w, h); fxaa.material.uniforms.resolution.value.set(1 / (w * pr), 1 / (h * pr)); };
  setSize(size.x / renderer.getPixelRatio(), size.y / renderer.getPixelRatio());
  return { composer, bloom, dof: dof.u, grade: grade.uniforms, setSize, render: () => composer.render() };
}
