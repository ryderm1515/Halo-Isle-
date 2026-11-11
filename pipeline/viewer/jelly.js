// Halo Isle hero material: glossy blue jelly without transmission (transmission re-renders the scene).
// Fresnel rim + soft wrap "subsurface" glow keep it readable against blue sky and water.
import * as THREE from 'three';
export function jellyMaterial(src = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#63c6f4'), roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05,
    sheen: 0.25, sheenColor: new THREE.Color('#bfeeff'), sheenRoughness: 0.4, specularIntensity: 0.7,
    iridescence: 0.1, iridescenceIOR: 1.25, vertexColors: !!src.vertexColors,
  });
  m.onBeforeCompile = (sh) => {
    sh.uniforms.rimColor = { value: new THREE.Color('#e8fbff') };
    sh.uniforms.coreColor = { value: new THREE.Color('#2aa8ee') };
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 rimColor; uniform vec3 coreColor;')
      .replace('#include <opaque_fragment>', `
        float fres = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 2.6);
        outgoingLight = mix(outgoingLight, outgoingLight * coreColor * 1.6, 0.16 * (1.0 - fres));
        outgoingLight += rimColor * fres * 0.22;
        #include <opaque_fragment>`);
  };
  return m;
}
export function leafMaterial() {
  return new THREE.MeshPhysicalMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.38, clearcoat: 0.6,
    clearcoatRoughness: 0.15, sheen: 0.4, sheenColor: new THREE.Color('#e8ffb0'), side: THREE.DoubleSide });
}
