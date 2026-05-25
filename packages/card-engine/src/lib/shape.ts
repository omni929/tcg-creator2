import { CARD_CANVAS } from "@card-pipeline/schema";
import * as THREE from "three";

const CARD_ASPECT_RATIO = CARD_CANVAS.height / CARD_CANVAS.width;

export const CARD_MODEL = {
  width: 3,
  height: 3 * CARD_ASPECT_RATIO,
  thickness: 0.085,
  radius: 0.16
} as const;

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
  return new THREE.ShapeGeometry(createRoundedRectShape(), 36);
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
