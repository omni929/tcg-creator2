import { type FinishProfile, type MaterialSettings } from "@card-pipeline/schema";
import * as THREE from "three";
import { CARD_MODEL } from "./shape";

const overlayVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

const overlayFragmentShader = `
  uniform sampler2D uBaseMap;
  uniform sampler2D uFoilMask;
  uniform sampler2D uRoughnessMap;
  uniform sampler2D uNormalMap;
  uniform float uTime;
  uniform float uSheen;
  uniform float uRainbow;
  uniform float uGlow;
  uniform float uFoilIntensity;
  uniform float uFoilScale;
  uniform float uFoilDetail;
  uniform float uCardAspect;
  uniform vec3 uAccent;

  varying vec2 vUv;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  vec3 spectral(float value) {
    return 0.5 + 0.5 * cos(6.28318 * (vec3(0.0, 0.33, 0.67) + value));
  }

  vec2 scaleFromCenter(vec2 uv, float scale) {
    return (uv - 0.5) * scale + 0.5;
  }

  vec2 toCardPatternUv(vec2 uv) {
    return vec2(uv.x, (uv.y - 0.5) * uCardAspect + 0.5);
  }

  void main() {
    vec4 base = texture2D(uBaseMap, vUv);
    if (base.a < 0.01) {
      discard;
    }

    vec3 normal = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
    vec2 maskUv = clamp(scaleFromCenter(vUv, uFoilScale), 0.0, 1.0);
    vec2 patternUv = toCardPatternUv(maskUv);
    float mask = texture2D(uFoilMask, maskUv).r;
    float roughnessDetail = texture2D(uRoughnessMap, vUv).r;
    vec3 tangentNormal = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
    float normalDetail = clamp(length(tangentNormal.xy), 0.0, 1.0);
    float bandA = sin((patternUv.x * 12.0) + (patternUv.y * 4.0) + (uTime * 0.7)) * 0.5 + 0.5;
    float bandB = sin((patternUv.x - patternUv.y + uTime * 0.12) * (18.0 + uFoilDetail * 22.0)) * 0.5 + 0.5;
    float sparkle = pow(max(0.0, 1.0 - abs((patternUv.x + patternUv.y) - 1.0)), 2.0);
    float foil = mask * uFoilIntensity * uSheen * (bandA * 0.5 + bandB * (0.2 + uFoilDetail * 0.45) + sparkle * 0.15);
    foil *= mix(1.15, 0.7, roughnessDetail) * (1.0 + normalDetail * 0.25);
    vec3 rainbow = spectral((patternUv.x * 0.8) + (patternUv.y * 0.35) + (uTime * 0.03));
    vec3 foilColor = mix(uAccent, rainbow, uRainbow);
    vec3 color = foilColor * (foil + fresnel * uGlow * 0.6);
    float alpha = min(1.0, (foil * 0.8) + (fresnel * uGlow * 0.35));
    gl_FragColor = vec4(color, alpha * base.a);
  }
`;

export type FoilOverlayMaterial = THREE.ShaderMaterial & {
  uniforms: {
    uBaseMap: { value: THREE.Texture };
    uFoilMask: { value: THREE.Texture };
    uRoughnessMap: { value: THREE.Texture };
    uNormalMap: { value: THREE.Texture };
    uTime: { value: number };
    uSheen: { value: number };
    uRainbow: { value: number };
    uGlow: { value: number };
    uFoilIntensity: { value: number };
    uFoilScale: { value: number };
    uFoilDetail: { value: number };
    uCardAspect: { value: number };
    uAccent: { value: THREE.Color };
  };
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function createFrontBaseMaterial(options: {
  texture: THREE.Texture;
  roughnessMap?: THREE.Texture | null;
  normalMap?: THREE.Texture | null;
  emissiveOverlay?: THREE.Texture | null;
  finish: FinishProfile;
  material: MaterialSettings;
  accent: string;
}): THREE.MeshPhysicalMaterial {
  const roughness = clamp(options.finish.roughness + options.material.roughnessShift, 0.05, 1);
  const metalness = clamp(options.finish.metalness + options.material.metalnessShift, 0, 1);

  return new THREE.MeshPhysicalMaterial({
    map: options.texture,
    roughnessMap: options.roughnessMap ?? null,
    normalMap: options.normalMap ?? null,
    emissiveMap: options.emissiveOverlay ?? null,
    emissive: new THREE.Color(options.accent),
    emissiveIntensity: options.emissiveOverlay ? options.material.emissiveStrength : 0,
    roughness,
    metalness,
    clearcoat: clamp(options.material.clearcoat, 0, 1),
    clearcoatRoughness: clamp(options.material.clearcoatRoughness, 0.02, 1),
    normalScale: new THREE.Vector2(options.material.normalStrength, options.material.normalStrength),
    transparent: true,
    alphaTest: 0.01
  });
}

export function createFoilOverlayMaterial(options: {
  baseTexture: THREE.Texture;
  foilMask: THREE.Texture;
  roughnessMap: THREE.Texture;
  normalMap: THREE.Texture;
  finish: FinishProfile;
  material: MaterialSettings;
  accent: string;
}): FoilOverlayMaterial {
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uBaseMap: { value: options.baseTexture },
      uFoilMask: { value: options.foilMask },
      uRoughnessMap: { value: options.roughnessMap },
      uNormalMap: { value: options.normalMap },
      uTime: { value: 0 },
      uSheen: { value: options.finish.sheen },
      uRainbow: { value: options.finish.rainbow },
      uGlow: { value: options.finish.glow },
      uFoilIntensity: { value: options.material.foilIntensity },
      uFoilScale: { value: options.material.foilScale },
      uFoilDetail: { value: options.material.foilDetail },
      uCardAspect: { value: CARD_MODEL.height / CARD_MODEL.width },
      uAccent: { value: new THREE.Color(options.accent) }
    },
    vertexShader: overlayVertexShader,
    fragmentShader: overlayFragmentShader
  });

  material.depthTest = true;
  material.depthWrite = false;
  material.polygonOffset = true;
  material.polygonOffsetFactor = -1;
  material.polygonOffsetUnits = -1;

  return material as FoilOverlayMaterial;
}

export function createBackMaterial(
  texture: THREE.Texture,
  finish: FinishProfile,
  material: MaterialSettings
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    map: texture,
    roughness: clamp(finish.roughness + material.roughnessShift + 0.08, 0.08, 1),
    metalness: clamp(finish.metalness * 0.45 + material.metalnessShift * 0.5, 0.04, 0.55),
    clearcoat: clamp(material.clearcoat * 0.8, 0, 1),
    clearcoatRoughness: clamp(material.clearcoatRoughness + 0.08, 0.04, 1)
  });
}

export function createEdgeMaterial(
  color: string,
  finish: FinishProfile,
  material: MaterialSettings
): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: clamp(finish.roughness * 0.72 + material.roughnessShift * 0.35, 0.08, 0.8),
    metalness: clamp(Math.max(0.28, finish.metalness + material.metalnessShift * 0.8), 0.2, 1),
    clearcoat: clamp(material.clearcoat * 0.7, 0, 1),
    clearcoatRoughness: clamp(material.clearcoatRoughness + 0.05, 0.03, 1)
  });
}
