import { CARD_CANVAS } from "@card-pipeline/schema";
import * as THREE from "three";

const CARD_ASPECT_RATIO = CARD_CANVAS.height / CARD_CANVAS.width;

export const CARD_MODEL = {
  width: 3,
  height: 3 * CARD_ASPECT_RATIO,
  thickness: 0.085,
  radius: 0.16
} as const;

export const CARD_RENDER_TRANSFORM = {
  groupPosition: [0, 0.14, 0] as const,
  cameraTarget: [0, -0.4, 0] as const
} as const;

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

export function createRoundedRectShape(
  width = CARD_MODEL.width,
  height = CARD_MODEL.height,
  radius = CARD_MODEL.radius
): THREE.Shape {
  const x = -width / 2;
  const y = -height / 2;
  const shape = new THREE.Shape();

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return shape;
}

export function createCardFaceGeometry(): THREE.ShapeGeometry {
  const geometry = new THREE.ShapeGeometry(createRoundedRectShape(), 36);
  const position = geometry.getAttribute("position");
  const uv = new Float32Array(position.count * 2);

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index);
    const y = position.getY(index);
    uv[index * 2] = clamp01((x + CARD_MODEL.width / 2) / CARD_MODEL.width);
    uv[index * 2 + 1] = clamp01((y + CARD_MODEL.height / 2) / CARD_MODEL.height);
  }

  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geometry;
}

export function createCardEdgeGeometry(): THREE.ExtrudeGeometry {
  const geometry = new THREE.ExtrudeGeometry(createRoundedRectShape(), {
    depth: CARD_MODEL.thickness,
    bevelEnabled: false,
    curveSegments: 36
  });

  geometry.translate(0, 0, -CARD_MODEL.thickness / 2);
  return geometry;
}
