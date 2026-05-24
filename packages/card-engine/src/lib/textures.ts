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

export function createProceduralFoilMaskTexture(size = 1024): THREE.CanvasTexture {
  const canvas = createCanvas(size);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return canvasToTexture(canvas);
  }

  ctx.fillStyle = "#202020";
  ctx.fillRect(0, 0, size, size);

  ctx.globalAlpha = 0.92;
  for (let index = -size; index < size * 1.4; index += 84) {
    const gradient = ctx.createLinearGradient(index, 0, index + 120, size);
    gradient.addColorStop(0, "rgba(255,255,255,0)");
    gradient.addColorStop(0.45, "rgba(255,255,255,0.92)");
    gradient.addColorStop(0.55, "rgba(255,255,255,0.28)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(index, 0, 120, size);
  }

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
