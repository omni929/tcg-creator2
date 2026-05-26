import { CARD_CANVAS, type CardProject, type FoilMaskPattern, getTheme } from "@card-pipeline/schema";
import * as THREE from "three";

export function canvasToTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

function finalizeTexture(texture: THREE.Texture, colorSpace: THREE.ColorSpace = THREE.NoColorSpace): THREE.Texture {
  texture.colorSpace = colorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

async function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

export async function loadImageTexture(
  src: string,
  colorSpace: THREE.ColorSpace = THREE.SRGBColorSpace
): Promise<THREE.Texture> {
  const image = await loadImageElement(src);
  return finalizeTexture(new THREE.Texture(image), colorSpace);
}

function createCanvas(size: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  return canvas;
}

function createSizedCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawFoilMaskPattern(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pattern: FoilMaskPattern,
  project?: CardProject
): void {
  ctx.fillStyle = "#121212";
  ctx.fillRect(0, 0, width, height);

  if (pattern === "spotlight-burst") {
    const glow = ctx.createRadialGradient(width * 0.5, height * 0.42, 20, width * 0.5, height * 0.42, width * 0.62);
    glow.addColorStop(0, "rgba(255,255,255,0.96)");
    glow.addColorStop(0.44, "rgba(255,255,255,0.46)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, width, height);
  }

  if (pattern === "border-glints") {
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = Math.max(12, width * 0.018);
    drawRoundedRect(ctx, width * 0.035, height * 0.025, width * 0.93, height * 0.95, width * 0.04);
    ctx.stroke();
  }

  if (pattern === "text-safe-sheen" && project) {
    const theme = getTheme(project.themeId);
    const zones = [project.layout.titleZone ?? theme.titleZone, project.layout.flavorZone ?? theme.flavorZone];
    ctx.fillStyle = "rgba(255,255,255,0.48)";
    for (const zone of zones) {
      drawRoundedRect(
        ctx,
        (zone.x / CARD_CANVAS.width) * width,
        (zone.y / CARD_CANVAS.height) * height,
        (zone.width / CARD_CANVAS.width) * width,
        (zone.height / CARD_CANVAS.height) * height,
        Math.max(12, width * 0.018)
      );
      ctx.fill();
    }
  }

  ctx.globalAlpha = pattern === "diagonal-prism" ? 0.92 : 0.58;
  for (let index = -height; index < width * 1.4; index += width * 0.07) {
    const gradient = ctx.createLinearGradient(index, 0, index + width * 0.12, height);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.48, "rgba(255,255,255,0.9)");
    gradient.addColorStop(0.58, "rgba(255,255,255,0.25)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(index, 0, width * 0.12, height);
  }

  ctx.globalAlpha = 1;
}

export function createProceduralFoilMaskTexture(size = 1024): THREE.CanvasTexture {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return canvasToTexture(canvas);
  }

  drawFoilMaskPattern(ctx, size, size, "diagonal-prism");

  ctx.globalAlpha = 0.4;
  for (let index = 0; index < 18; index += 1) {
    const radius = size * (0.05 + index * 0.018);
    ctx.beginPath();
    ctx.strokeStyle = `rgba(255,255,255,${0.1 + index * 0.008})`;
    ctx.lineWidth = 2 + (index % 3);
    ctx.arc(size * 0.5, size * 0.48, radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  const texture = canvasToTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

export function generateFoilMaskDataUrl(
  pattern: FoilMaskPattern,
  project?: CardProject,
  width = CARD_CANVAS.width,
  height = CARD_CANVAS.height
): string {
  const canvas = createSizedCanvas(width, height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create foil mask canvas context");
  }

  drawFoilMaskPattern(ctx, width, height, pattern, project);
  return canvas.toDataURL("image/png");
}

export function createProceduralRoughnessTexture(size = 1024): THREE.CanvasTexture {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return canvasToTexture(canvas);
  }

  const imageData = ctx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const diagonal = Math.sin((x + y) * 0.04) * 0.1;
      const sweep = Math.cos(x * 0.08) * 0.06;
      const grain = (Math.sin(x * 12.81 + y * 78.233) * 43758.5453) % 1;
      const roughness = Math.max(0, Math.min(1, 0.54 + diagonal + sweep + grain * 0.06));
      const value = Math.round(roughness * 255);
      const offset = (y * size + x) * 4;
      imageData.data[offset] = value;
      imageData.data[offset + 1] = value;
      imageData.data[offset + 2] = value;
      imageData.data[offset + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = canvasToTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

export function createProceduralNormalTexture(size = 1024): THREE.CanvasTexture {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return canvasToTexture(canvas);
  }

  const imageData = ctx.createImageData(size, size);

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const nx = Math.sin((x + y) * 0.035) * 0.14 + Math.cos(y * 0.09) * 0.05;
      const ny = Math.cos((x - y) * 0.05) * 0.14 + Math.sin(x * 0.07) * 0.05;
      const nz = Math.sqrt(Math.max(0.001, 1 - Math.min(0.96, nx * nx + ny * ny)));
      const offset = (y * size + x) * 4;
      imageData.data[offset] = Math.round((nx * 0.5 + 0.5) * 255);
      imageData.data[offset + 1] = Math.round((ny * 0.5 + 0.5) * 255);
      imageData.data[offset + 2] = Math.round((nz * 0.5 + 0.5) * 255);
      imageData.data[offset + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = canvasToTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}

export function createCardUvDebugTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_CANVAS.width;
  canvas.height = CARD_CANVAS.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return canvasToTexture(canvas);
  }

  const checker = 100;
  for (let y = 0; y < canvas.height; y += checker) {
    for (let x = 0; x < canvas.width; x += checker) {
      ctx.fillStyle = (x / checker + y / checker) % 2 === 0 ? "#f8fafc" : "#cbd5e1";
      ctx.fillRect(x, y, checker, checker);
    }
  }

  ctx.lineWidth = 18;
  ctx.strokeStyle = "#0f172a";
  ctx.strokeRect(9, 9, canvas.width - 18, canvas.height - 18);

  ctx.lineWidth = 10;
  ctx.strokeStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(canvas.width, canvas.height);
  ctx.stroke();

  ctx.strokeStyle = "#2563eb";
  ctx.beginPath();
  ctx.moveTo(canvas.width, 0);
  ctx.lineTo(0, canvas.height);
  ctx.stroke();

  const corners = [
    { label: "TOP LEFT", x: 24, y: 48, color: "#dc2626" },
    { label: "TOP RIGHT", x: canvas.width - 360, y: 48, color: "#16a34a" },
    { label: "BOTTOM LEFT", x: 24, y: canvas.height - 72, color: "#2563eb" },
    { label: "BOTTOM RIGHT", x: canvas.width - 430, y: canvas.height - 72, color: "#ca8a04" }
  ];

  ctx.font = "700 48px sans-serif";
  for (const corner of corners) {
    ctx.fillStyle = corner.color;
    ctx.fillRect(corner.x - 12, corner.y - 48, 400, 68);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(corner.label, corner.x, corner.y);
  }

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(canvas.width / 2 - 6, 0, 12, canvas.height);
  ctx.fillRect(0, canvas.height / 2 - 6, canvas.width, 12);

  const texture = canvasToTexture(canvas);
  texture.userData.cardUvDebug = {
    purpose: "Checks that full 1400x2000 card-space UVs align with the rounded 3D card face and foil mask."
  };
  return texture;
}
