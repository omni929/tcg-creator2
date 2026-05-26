import {
  DEFAULT_MATERIAL_SETTINGS,
  type CardProject,
  type ExportPreset,
  getExportPreset,
  getFinishProfile,
  getTheme,
  getViewPreset
} from "@card-pipeline/schema";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { composeBackCanvas, composeFrontCanvas } from "./canvas";
import {
  createBackMaterial,
  createEdgeMaterial,
  createFoilOverlayMaterial,
  createFrontBaseMaterial
} from "./materials";
import { CARD_MODEL, CARD_RENDER_TRANSFORM, createCardEdgeGeometry, createCardFaceGeometry } from "./shape";
import {
  canvasToTexture,
  createProceduralFoilMaskTexture,
  createProceduralNormalTexture,
  createProceduralRoughnessTexture,
  loadImageTexture
} from "./textures";

function buildRenderer(width: number, height: number, exposure: number): THREE.WebGLRenderer {
  const canvas = document.createElement("canvas");
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = exposure;
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

async function buildCardMeshes(project: CardProject): Promise<THREE.Group> {
  const theme = getTheme(project.themeId);
  const finish = getFinishProfile(project.finishId);
  const materialSettings = project.material ?? DEFAULT_MATERIAL_SETTINGS;

  const [frontCanvas, backCanvas, foilMask, roughnessMap, normalMap, emissiveOverlay] = await Promise.all([
    composeFrontCanvas(project),
    composeBackCanvas(project),
    project.assets.foilMask?.src
      ? loadImageTexture(project.assets.foilMask.src, THREE.NoColorSpace)
      : Promise.resolve(createProceduralFoilMaskTexture()),
    project.assets.roughnessMap?.src
      ? loadImageTexture(project.assets.roughnessMap.src, THREE.NoColorSpace)
      : Promise.resolve(createProceduralRoughnessTexture()),
    project.assets.normalMap?.src
      ? loadImageTexture(project.assets.normalMap.src, THREE.NoColorSpace)
      : Promise.resolve(createProceduralNormalTexture()),
    project.assets.emissiveOverlay?.src
      ? loadImageTexture(project.assets.emissiveOverlay.src, THREE.SRGBColorSpace)
      : Promise.resolve(null)
  ]);

  const frontTexture = canvasToTexture(frontCanvas);
  const backTexture = canvasToTexture(backCanvas);
  const faceGeometry = createCardFaceGeometry();

  const group = new THREE.Group();

  const edgeMesh = new THREE.Mesh(
    createCardEdgeGeometry(),
    createEdgeMaterial(theme.edgeColor, finish, materialSettings)
  );
  group.add(edgeMesh);

  const frontMesh = new THREE.Mesh(
    faceGeometry,
    createFrontBaseMaterial({
      texture: frontTexture,
      roughnessMap,
      normalMap,
      emissiveOverlay,
      finish,
      material: materialSettings,
      accent: theme.accent
    })
  );
  frontMesh.position.z = CARD_MODEL.thickness / 2 + 0.001;
  group.add(frontMesh);

  const foilMesh = new THREE.Mesh(
    faceGeometry,
    createFoilOverlayMaterial({
      baseTexture: frontTexture,
      foilMask,
      roughnessMap,
      normalMap,
      finish,
      material: materialSettings,
      accent: theme.accent
    })
  );
  foilMesh.position.z = CARD_MODEL.thickness / 2 + 0.003;
  foilMesh.renderOrder = 2;
  (foilMesh.material as ReturnType<typeof createFoilOverlayMaterial>).uniforms.uTime.value = project.shimmerSpeed * 0.8;
  group.add(foilMesh);

  const backMesh = new THREE.Mesh(faceGeometry, createBackMaterial(backTexture, finish, materialSettings));
  backMesh.rotation.y = Math.PI;
  backMesh.position.z = -CARD_MODEL.thickness / 2 - 0.001;
  group.add(backMesh);

  return group;
}

function cleanupGroup(group: THREE.Object3D): void {
  group.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (mesh.geometry) {
      mesh.geometry.dispose();
    }

    const material = mesh.material;
    if (Array.isArray(material)) {
      for (const entry of material) {
        entry.dispose();
      }
    } else if (material) {
      material.dispose();
    }
  });
}

function blobFromCanvas(canvas: HTMLCanvasElement, format: ExportPreset["format"]): Promise<Blob> {
  const mimeType = format === "webp" ? "image/webp" : "image/png";
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to export canvas blob"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      format === "webp" ? 0.96 : undefined
    );
  });
}

export async function renderCard(
  project: CardProject,
  preset: ExportPreset = getExportPreset(project.exportPresetId)
): Promise<Blob> {
  const renderer = buildRenderer(preset.width, preset.height, project.exposure);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, preset.width / preset.height, 0.1, 100);
  const viewPreset = getViewPreset(project.viewPresetId);

  camera.position.set(0, 0.1, viewPreset.distance);
  camera.lookAt(...CARD_RENDER_TRANSFORM.cameraTarget);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environment = environment;
  scene.background = null;

  scene.add(new THREE.AmbientLight(0xffffff, 1.25));

  const spot = new THREE.SpotLight(0xffffff, 82, 22, 0.38, 0.7);
  spot.position.set(4.6, 5.8, 8);
  scene.add(spot);

  const warmKey = new THREE.DirectionalLight(0xfff3c4, 1.7);
  warmKey.position.set(-3, 1.4, 4);
  scene.add(warmKey);

  const rim = new THREE.PointLight(0x8ad9ff, 18, 14, 2);
  rim.position.set(-4.5, 1.2, -3.6);
  scene.add(rim);

  const group = await buildCardMeshes(project);
  const viewRotation = project.viewRotation ?? {
    x: viewPreset.rotationX,
    y: viewPreset.rotationY,
    z: -0.015
  };
  group.position.set(...CARD_RENDER_TRANSFORM.groupPosition);
  group.rotation.x = viewRotation.x;
  group.rotation.y = viewRotation.y;
  group.rotation.z = viewRotation.z;
  scene.add(group);

  renderer.render(scene, camera);

  const blob = await blobFromCanvas(renderer.domElement, preset.format);

  cleanupGroup(group);
  environment.dispose();
  pmrem.dispose();
  renderer.dispose();

  return blob;
}
