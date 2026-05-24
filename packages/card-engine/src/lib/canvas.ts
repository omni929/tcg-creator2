import {
  CARD_CANVAS,
  type CardProject,
  type ThemeDefinition,
  getFinishProfile,
  getTheme
} from "@card-pipeline/schema";

const TITLE_FONT = `900 italic 92px "Segoe UI", Arial, sans-serif`;
const SUBTITLE_FONT = `700 30px "Segoe UI", Arial, sans-serif`;
const BODY_FONT = `500 34px "Segoe UI", Arial, sans-serif`;
const META_FONT = `800 24px "Consolas", "Courier New", monospace`;
const BADGE_FONT = `900 22px "Segoe UI", Arial, sans-serif`;

function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function roundedRectPath(
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

function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  image: CanvasImageSource,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number,
  offsetX: number,
  offsetY: number
): void {
  const imageWidth = Number((image as { width?: number }).width ?? width);
  const imageHeight = Number((image as { height?: number }).height ?? height);
  const baseScale = Math.max(width / imageWidth, height / imageHeight);
  const finalScale = baseScale * scale;
  const drawWidth = imageWidth * finalScale;
  const drawHeight = imageHeight * finalScale;
  const drawX = x + (width - drawWidth) / 2 + offsetX * width * 0.5;
  const drawY = y + (height - drawHeight) / 2 + offsetY * height * 0.5;
  ctx.drawImage(image, drawX, drawY, drawWidth, drawHeight);
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    image.src = src;
  });
}

function drawGeneratedArt(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  theme: ThemeDefinition
): void {
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, theme.backgroundTop);
  gradient.addColorStop(0.6, theme.secondaryAccent);
  gradient.addColorStop(1, theme.backgroundBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  ctx.globalAlpha = 0.25;
  for (let index = 0; index < 18; index += 1) {
    const stripeX = x + ((index * 83) % width);
    const stripeGradient = ctx.createLinearGradient(stripeX, y, stripeX + 180, y + height);
    stripeGradient.addColorStop(0, "rgba(255,255,255,0)");
    stripeGradient.addColorStop(0.5, "rgba(255,255,255,0.35)");
    stripeGradient.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = stripeGradient;
    ctx.fillRect(stripeX, y, 180, height);
  }
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.beginPath();
  ctx.arc(x + width * 0.5, y + height * 0.48, width * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (ctx.measureText(next).width > width && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }

  if (current) {
    lines.push(current);
  }

  return lines;
}

function drawBadge(
  ctx: CanvasRenderingContext2D,
  theme: ThemeDefinition,
  label: string,
  rarity: CardProject["content"]["rarity"]
): void {
  const zone = theme.badgeZone;
  const rarityColor =
    rarity === "legendary"
      ? "#f8ff61"
      : rarity === "epic"
        ? "#9f56ff"
        : rarity === "rare"
          ? "#8af2ff"
          : "#ffffff";

  ctx.save();
  roundedRectPath(ctx, zone.x, zone.y, zone.width, zone.height, 18);
  const gradient = ctx.createLinearGradient(zone.x, zone.y, zone.x + zone.width, zone.y + zone.height);
  gradient.addColorStop(0, rarityColor);
  gradient.addColorStop(1, theme.secondaryAccent);
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.fillStyle = "#050505";
  ctx.font = BADGE_FONT;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label.toUpperCase(), zone.x + zone.width / 2, zone.y + zone.height / 2 + 1);
  ctx.restore();
}

function drawFallbackFrame(ctx: CanvasRenderingContext2D, theme: ThemeDefinition): void {
  const outer = 30;
  const inner = 62;

  ctx.save();
  roundedRectPath(ctx, outer, outer, CARD_CANVAS.width - outer * 2, CARD_CANVAS.height - outer * 2, CARD_CANVAS.radius);
  const outerGradient = ctx.createLinearGradient(0, 0, CARD_CANVAS.width, CARD_CANVAS.height);
  outerGradient.addColorStop(0, theme.accent);
  outerGradient.addColorStop(0.55, theme.secondaryAccent);
  outerGradient.addColorStop(1, "#ffffff");
  ctx.strokeStyle = outerGradient;
  ctx.lineWidth = 24;
  ctx.stroke();

  roundedRectPath(
    ctx,
    inner,
    inner,
    CARD_CANVAS.width - inner * 2,
    CARD_CANVAS.height - inner * 2,
    CARD_CANVAS.radius - 18
  );
  ctx.strokeStyle = "rgba(255,255,255,0.35)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "rgba(0,0,0,0.55)";
  roundedRectPath(ctx, 74, 1440, CARD_CANVAS.width - 148, 430, 28);
  ctx.fill();
  ctx.restore();
}

function drawBackPattern(ctx: CanvasRenderingContext2D, theme: ThemeDefinition): void {
  const centerX = CARD_CANVAS.width / 2;
  const centerY = CARD_CANVAS.height / 2;
  const gradient = ctx.createRadialGradient(centerX, centerY, 120, centerX, centerY, 920);
  gradient.addColorStop(0, `${theme.backPattern}CC`);
  gradient.addColorStop(1, `${theme.backgroundBottom}FF`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_CANVAS.width, CARD_CANVAS.height);

  ctx.strokeStyle = "rgba(255,255,255,0.14)";
  ctx.lineWidth = 4;
  for (let ring = 0; ring < 7; ring += 1) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, 200 + ring * 86, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-0.22);
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `900 italic 132px "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("RAREDROP", 0, 24);
  ctx.restore();
}

export async function composeFrontCanvas(project: CardProject): Promise<HTMLCanvasElement> {
  const canvas = createCanvas(CARD_CANVAS.width, CARD_CANVAS.height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create front canvas context");
  }

  const theme = getTheme(project.themeId);
  const finish = getFinishProfile(project.finishId);

  const baseGradient = ctx.createLinearGradient(0, 0, 0, CARD_CANVAS.height);
  baseGradient.addColorStop(0, theme.backgroundTop);
  baseGradient.addColorStop(1, theme.backgroundBottom);
  ctx.fillStyle = baseGradient;
  ctx.fillRect(0, 0, CARD_CANVAS.width, CARD_CANVAS.height);

  const artZone = theme.artZone;
  ctx.save();
  roundedRectPath(ctx, artZone.x, artZone.y, artZone.width, artZone.height, 30);
  ctx.clip();

  if (project.assets.frontArt?.src) {
    const artImage = await loadImage(project.assets.frontArt.src);
    drawCoverImage(
      ctx,
      artImage,
      artZone.x,
      artZone.y,
      artZone.width,
      artZone.height,
      project.artPlacement.scale,
      project.artPlacement.offsetX,
      project.artPlacement.offsetY
    );
  } else {
    drawGeneratedArt(ctx, artZone.x, artZone.y, artZone.width, artZone.height, theme);
  }
  ctx.restore();

  ctx.save();
  roundedRectPath(ctx, artZone.x, artZone.y, artZone.width, artZone.height, 30);
  ctx.strokeStyle = "rgba(255,255,255,0.24)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  if (project.assets.frontFrame?.src) {
    const frameImage = await loadImage(project.assets.frontFrame.src);
    ctx.drawImage(frameImage, 0, 0, CARD_CANVAS.width, CARD_CANVAS.height);
  } else {
    drawFallbackFrame(ctx, theme);
  }

  const titleZone = theme.titleZone;
  ctx.fillStyle = "#ffffff";
  ctx.font = TITLE_FONT;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(project.content.name.toUpperCase(), titleZone.x, titleZone.y, titleZone.width);

  ctx.fillStyle = `${theme.accent}CC`;
  ctx.font = SUBTITLE_FONT;
  ctx.fillText(project.content.subtitle.toUpperCase(), titleZone.x + 2, titleZone.y + 96, titleZone.width);

  drawBadge(ctx, theme, project.content.badge, project.content.rarity);

  const flavorZone = theme.flavorZone;
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = BODY_FONT;
  const lines = wrapText(ctx, project.content.flavorText, flavorZone.width - 40);
  let textY = flavorZone.y + 34;
  for (const line of lines.slice(0, 4)) {
    ctx.fillText(line, flavorZone.x + 20, textY);
    textY += 46;
  }

  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(flavorZone.x + 20, flavorZone.y + flavorZone.height - 80);
  ctx.lineTo(flavorZone.x + flavorZone.width - 20, flavorZone.y + flavorZone.height - 80);
  ctx.stroke();

  ctx.fillStyle = theme.accent;
  ctx.font = META_FONT;
  ctx.fillText(project.content.serial, flavorZone.x + 20, flavorZone.y + flavorZone.height - 46);
  ctx.textAlign = "right";
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.fillText(
    `${project.content.setCode} / ${project.content.artistCredit}`,
    flavorZone.x + flavorZone.width - 20,
    flavorZone.y + flavorZone.height - 46
  );

  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = Math.min(0.28, finish.glow + 0.08);
  const sheen = ctx.createLinearGradient(0, 0, CARD_CANVAS.width, CARD_CANVAS.height);
  sheen.addColorStop(0, "rgba(255,255,255,0)");
  sheen.addColorStop(0.3, `${theme.accent}55`);
  sheen.addColorStop(0.6, `${theme.secondaryAccent}66`);
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, CARD_CANVAS.width, CARD_CANVAS.height);
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";

  return canvas;
}

export async function composeBackCanvas(project: CardProject): Promise<HTMLCanvasElement> {
  const canvas = createCanvas(CARD_CANVAS.width, CARD_CANVAS.height);
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create back canvas context");
  }

  const theme = getTheme(project.themeId);
  const gradient = ctx.createLinearGradient(0, 0, 0, CARD_CANVAS.height);
  gradient.addColorStop(0, theme.backgroundTop);
  gradient.addColorStop(1, theme.backgroundBottom);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CARD_CANVAS.width, CARD_CANVAS.height);

  if (project.assets.backArt?.src) {
    const backImage = await loadImage(project.assets.backArt.src);
    ctx.save();
    roundedRectPath(ctx, 52, 52, CARD_CANVAS.width - 104, CARD_CANVAS.height - 104, CARD_CANVAS.radius - 14);
    ctx.clip();
    drawCoverImage(ctx, backImage, 52, 52, CARD_CANVAS.width - 104, CARD_CANVAS.height - 104, 1, 0, 0);
    ctx.restore();
  } else {
    drawBackPattern(ctx, theme);
  }

  ctx.save();
  roundedRectPath(ctx, 30, 30, CARD_CANVAS.width - 60, CARD_CANVAS.height - 60, CARD_CANVAS.radius);
  const outerGradient = ctx.createLinearGradient(0, 0, CARD_CANVAS.width, CARD_CANVAS.height);
  outerGradient.addColorStop(0, theme.accent);
  outerGradient.addColorStop(1, theme.secondaryAccent);
  ctx.strokeStyle = outerGradient;
  ctx.lineWidth = 22;
  ctx.stroke();

  roundedRectPath(ctx, 76, 76, CARD_CANVAS.width - 152, CARD_CANVAS.height - 152, CARD_CANVAS.radius - 22);
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  return canvas;
}
