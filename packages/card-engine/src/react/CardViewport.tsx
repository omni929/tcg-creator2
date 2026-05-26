import {
  DEFAULT_MATERIAL_SETTINGS,
  type CardProject,
  type ViewRotation,
  getFinishProfile,
  getTheme,
  getViewPreset
} from "@card-pipeline/schema";
import { OrbitControls } from "@react-three/drei";
import { Canvas, type ThreeEvent, useFrame, useThree } from "@react-three/fiber";
import { useDeferredValue, useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { composeBackCanvas, composeFrontCanvas } from "../lib/canvas";
import {
  createBackMaterial,
  createEdgeMaterial,
  createFoilOverlayMaterial,
  createFrontBaseMaterial,
  type FoilOverlayMaterial
} from "../lib/materials";
import { CARD_MODEL, CARD_RENDER_TRANSFORM, createCardEdgeGeometry, createCardFaceGeometry } from "../lib/shape";
import {
  canvasToTexture,
  createProceduralFoilMaskTexture,
  createProceduralNormalTexture,
  createProceduralRoughnessTexture,
  loadImageTexture
} from "../lib/textures";

type TextureState = {
  front: THREE.CanvasTexture;
  back: THREE.CanvasTexture;
  foilMask: THREE.Texture;
  roughnessMap: THREE.Texture;
  normalMap: THREE.Texture;
  emissiveOverlay: THREE.Texture | null;
};

function disposeTextures(textures: TextureState | null): void {
  if (!textures) {
    return;
  }

  textures.front.dispose();
  textures.back.dispose();
  textures.foilMask.dispose();
  textures.roughnessMap.dispose();
  textures.normalMap.dispose();
  textures.emissiveOverlay?.dispose();
}

async function loadTextureState(project: CardProject): Promise<TextureState> {
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

  return {
    front: canvasToTexture(frontCanvas),
    back: canvasToTexture(backCanvas),
    foilMask,
    roughnessMap,
    normalMap,
    emissiveOverlay
  };
}

function useCardTextures(project: CardProject): TextureState | null {
  const deferredProject = useDeferredValue(project);
  const [textures, setTextures] = useState<TextureState | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadTextureState(deferredProject).then((nextTextures) => {
      if (cancelled) {
        disposeTextures(nextTextures);
        return;
      }

      setTextures((previous) => {
        disposeTextures(previous);
        return nextTextures;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [deferredProject]);

  useEffect(() => {
    return () => {
      disposeTextures(textures);
    };
  }, [textures]);

  return textures;
}

function EnvironmentRig({
  exposure
}: {
  exposure: number;
}): null {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const environment = pmrem.fromScene(new RoomEnvironment(), 0.03).texture;
    scene.environment = environment;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.outputColorSpace = THREE.SRGBColorSpace;
    gl.toneMappingExposure = exposure;

    return () => {
      environment.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [exposure, gl]);

  return null;
}

function CameraRig({
  project
}: {
  project: CardProject;
}): null {
  const { camera } = useThree();
  const viewPreset = getViewPreset(project.viewPresetId);

  useEffect(() => {
    camera.position.set(0, 0.1, viewPreset.distance);
    camera.lookAt(...CARD_RENDER_TRANSFORM.cameraTarget);
    camera.updateProjectionMatrix();
  }, [camera, viewPreset.distance]);

  return null;
}

function useManagedMaterial<T extends THREE.Material | FoilOverlayMaterial>(material: T | null): void {
  useEffect(() => {
    return () => {
      material?.dispose();
    };
  }, [material]);
}

function CardModel({
  project,
  interactive,
  rotation,
  onRotationChange
}: {
  project: CardProject;
  interactive: boolean;
  rotation: ViewRotation;
  onRotationChange?: (rotation: ViewRotation) => void;
}): ReactElement | null {
  const groupRef = useRef<THREE.Group>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startRotation: ViewRotation;
    mode: "spin" | "roll";
  } | null>(null);
  const textures = useCardTextures(project);
  const theme = getTheme(project.themeId);
  const finish = getFinishProfile(project.finishId);
  const materialSettings = project.material ?? DEFAULT_MATERIAL_SETTINGS;
  const edgeGeometry = useMemo(() => createCardEdgeGeometry(), []);
  const faceGeometry = useMemo(() => createCardFaceGeometry(), []);

  const frontBaseMaterial = useMemo(() => {
    if (!textures) {
      return null;
    }

    return createFrontBaseMaterial({
      texture: textures.front,
      roughnessMap: textures.roughnessMap,
      normalMap: textures.normalMap,
      emissiveOverlay: textures.emissiveOverlay,
      finish,
      material: materialSettings,
      accent: theme.accent
    });
  }, [textures, finish, materialSettings, theme.accent]);

  const foilOverlayMaterial = useMemo(() => {
    if (!textures) {
      return null;
    }

    return createFoilOverlayMaterial({
      baseTexture: textures.front,
      foilMask: textures.foilMask,
      roughnessMap: textures.roughnessMap,
      normalMap: textures.normalMap,
      finish,
      material: materialSettings,
      accent: theme.accent
    });
  }, [textures, finish, materialSettings, theme.accent]);

  const backMaterial = useMemo(() => {
    if (!textures) {
      return null;
    }

    return createBackMaterial(textures.back, finish, materialSettings);
  }, [textures, finish, materialSettings]);

  const edgeMaterial = useMemo(
    () => createEdgeMaterial(theme.edgeColor, finish, materialSettings),
    [finish, materialSettings, theme.edgeColor]
  );

  useManagedMaterial(frontBaseMaterial);
  useManagedMaterial(foilOverlayMaterial);
  useManagedMaterial(backMaterial);
  useManagedMaterial(edgeMaterial);

  useEffect(() => {
    return () => {
      edgeGeometry.dispose();
      faceGeometry.dispose();
    };
  }, [edgeGeometry, faceGeometry]);

  function handlePointerDown(event: ThreeEvent<PointerEvent>): void {
    if (!interactive || !onRotationChange) {
      return;
    }

    event.stopPropagation();
    const mode = event.shiftKey || event.button === 2 ? "roll" : "spin";
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startRotation: rotation,
      mode
    };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ThreeEvent<PointerEvent>): void {
    const drag = dragRef.current;
    if (!drag || !onRotationChange) {
      return;
    }

    event.stopPropagation();
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    const nextRotation =
      drag.mode === "roll"
        ? {
            ...drag.startRotation,
            z: drag.startRotation.z + dx * 0.01
          }
        : {
            x: drag.startRotation.x + dy * 0.01,
            y: drag.startRotation.y + dx * 0.01,
            z: drag.startRotation.z
          };

    onRotationChange(nextRotation);
  }

  function endDrag(event: ThreeEvent<PointerEvent>): void {
    const drag = dragRef.current;
    if (!drag) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target?.hasPointerCapture(drag.pointerId)) {
      target.releasePointerCapture(drag.pointerId);
    }
    dragRef.current = null;
  }

  useFrame((_, delta) => {
    if (!foilOverlayMaterial) {
      return;
    }

    foilOverlayMaterial.uniforms.uTime.value += delta * project.shimmerSpeed;
  });

  if (!textures || !frontBaseMaterial || !foilOverlayMaterial || !backMaterial) {
    return null;
  }

  return (
    <group
      ref={groupRef}
      position={CARD_RENDER_TRANSFORM.groupPosition}
      rotation={[rotation.x, rotation.y, rotation.z]}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerLeave={endDrag}
      onPointerCancel={endDrag}
    >
      <mesh geometry={edgeGeometry} material={edgeMaterial} />
      <mesh geometry={faceGeometry} material={frontBaseMaterial} position={[0, 0, CARD_MODEL.thickness / 2 + 0.001]} />
      <mesh
        geometry={faceGeometry}
        material={foilOverlayMaterial}
        position={[0, 0, CARD_MODEL.thickness / 2 + 0.003]}
        renderOrder={2}
      />
      <mesh
        geometry={faceGeometry}
        material={backMaterial}
        rotation={[0, Math.PI, 0]}
        position={[0, 0, -CARD_MODEL.thickness / 2 - 0.001]}
      />
    </group>
  );
}

export function CardViewport({
  project,
  interactive = true,
  rotation,
  onRotationChange
}: {
  project: CardProject;
  interactive?: boolean;
  rotation?: ViewRotation;
  onRotationChange?: (rotation: ViewRotation) => void;
}): ReactElement {
  const viewPreset = getViewPreset(project.viewPresetId);
  const activeRotation = rotation ??
    project.viewRotation ?? {
      x: viewPreset.rotationX,
      y: viewPreset.rotationY,
      z: -0.015
    };

  return (
    <Canvas
      camera={{ position: [0, 0.1, viewPreset.distance], fov: 24 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      onContextMenu={(event) => event.preventDefault()}
    >
      <EnvironmentRig exposure={project.exposure} />
      <CameraRig project={project} />
      <ambientLight intensity={1.25} />
      <spotLight position={[4.6, 5.8, 8]} intensity={96} angle={0.38} penumbra={0.7} />
      <directionalLight position={[-3, 1.4, 4]} intensity={1.7} color="#fff3c4" />
      <pointLight position={[-4.5, 1.2, -3.6]} intensity={20} color="#8ad9ff" />
      <CardModel project={project} interactive={interactive} rotation={activeRotation} onRotationChange={onRotationChange} />
      {interactive ? (
        <OrbitControls
          enablePan={false}
          enableRotate={false}
          enableZoom
          enableDamping
          dampingFactor={0.08}
          zoomSpeed={0.85}
          minDistance={Math.max(7.6, viewPreset.distance - 1.9)}
          maxDistance={viewPreset.distance + 9.5}
          target={CARD_RENDER_TRANSFORM.cameraTarget}
        />
      ) : null}
    </Canvas>
  );
}
