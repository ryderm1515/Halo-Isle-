// Shared wind: one clock that every swaying material reads, so the whole island moves together.
export const WIND = { time: { value: 0 } };
// Bend a material's vertices with height (y above the model origin). kind: 'tree' (slow sway + leaf flutter), 'cloth' (uv-driven ripple)
export function windify(mat, kind = 'tree', amp = 1) {
  if (mat.userData.wind) return mat; mat.userData.wind = true; const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (s, r) => {
    prev?.(s, r); s.uniforms.uWind = WIND.time;
    s.vertexShader = s.vertexShader.replace('#include <common>', '#include <common>\nuniform float uWind;').replace('#include <begin_vertex>', `#include <begin_vertex>
      { vec4 wp0=modelMatrix*vec4(0.,0.,0.,1.); float ph=wp0.x*.37+wp0.z*.29; ${kind === 'cloth'
        ? `float k=(1.-uv.y)*${(0.09 * amp).toFixed(3)}; transformed.y+=sin(uWind*3.1+ph+uv.x*5.+uv.y*4.)*k; transformed.x+=cos(uWind*2.3+ph+uv.y*6.)*k*.5;`
        : `float hgt=max(transformed.y,0.); float sway=sin(uWind*1.15+ph)+.5*sin(uWind*2.1+ph*1.7); float fl=sin(uWind*4.3+transformed.x*3.+transformed.z*2.7+ph)*.5+sin(uWind*6.1+transformed.z*4.)*.25;
           transformed.x+=(sway*.012*hgt+fl*.004*min(hgt,4.))*${amp.toFixed(2)}; transformed.z+=(sway*.007*hgt+fl*.003*min(hgt,4.))*${amp.toFixed(2)};`} }`);
  };
  mat.customProgramCacheKey = () => 'wind' + kind + amp; mat.needsUpdate = true; return mat;
}
