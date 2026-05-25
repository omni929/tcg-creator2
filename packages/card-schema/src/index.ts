export type Rarity = "common" | "rare" | "epic" | "legendary";

export type FinishType =
  | "standard"
  | "gloss"
  | "holo"
  | "spectral"
  | "gold-foil";

export type AssetSource = {
  src: string;
  name?: string;
};

export type ArtFitMode = "auto" | "art-zone" | "full-card";

export type CardAssets = {
  frontArt?: AssetSource;
  frontFrame?: AssetSource;
  backArt?: AssetSource;
  foilMask?: AssetSource;
  roughnessMap?: AssetSource;
  normalMap?: AssetSource;
  emissiveOverlay?: AssetSource;
};

export type CardContent = {
  name: string;
  subtitle: string;
  flavorText: string;
  rarity: Rarity;
  serial: string;
  setCode: string;
  artistCredit: string;
  badge: string;
};

export type ArtPlacement = {
  fitMode: ArtFitMode;
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type MaterialSettings = {
  foilIntensity: number;
  foilScale: number;
  foilDetail: number;
  roughnessShift: number;
  metalnessShift: number;
  clearcoat: number;
  clearcoatRoughness: number;
  normalStrength: number;
  emissiveStrength: number;
};

export type TextZone = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ThemeDefinition = {
  id: string;
  label: string;
  accent: string;
  secondaryAccent: string;
  backgroundTop: string;
  backgroundBottom: string;
  edgeColor: string;
  backPattern: string;
  titleZone: TextZone;
  artZone: TextZone;
  flavorZone: TextZone;
  badgeZone: TextZone;
};

export type FinishProfile = {
  id: FinishType;
  label: string;
  sheen: number;
  rainbow: number;
  roughness: number;
  metalness: number;
  glow: number;
};

export type ViewPreset = {
  id: string;
  label: string;
  rotationX: number;
  rotationY: number;
  distance: number;
};

export type ExportPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  format: "png" | "webp";
  pixelRatio: number;
};

export type CardProject = {
  version: 1;
  id: string;
  themeId: string;
  finishId: FinishType;
  exportPresetId: string;
  viewPresetId: string;
  content: CardContent;
  assets: CardAssets;
  artPlacement: ArtPlacement;
  material: MaterialSettings;
  shimmerSpeed: number;
  exposure: number;
  showTiltPreview: boolean;
};

export const CARD_CANVAS = {
  width: 1400,
  height: 2000,
  radius: 54
} as const;

export const THEMES: ThemeDefinition[] = [
  {
    id: "obsidian",
    label: "Obsidian Vault",
    accent: "#f8ff61",
    secondaryAccent: "#ff8f1f",
    backgroundTop: "#121212",
    backgroundBottom: "#020202",
    edgeColor: "#4d3b17",
    backPattern: "#d5b66b",
    titleZone: { x: 96, y: 92, width: 940, height: 120 },
    artZone: { x: 82, y: 232, width: 1236, height: 1140 },
    flavorZone: { x: 110, y: 1524, width: 1180, height: 240 },
    badgeZone: { x: 1080, y: 92, width: 210, height: 72 }
  },
  {
    id: "aurora",
    label: "Aurora Prism",
    accent: "#8af2ff",
    secondaryAccent: "#9f56ff",
    backgroundTop: "#0b1026",
    backgroundBottom: "#030510",
    edgeColor: "#334f88",
    backPattern: "#7ed4ff",
    titleZone: { x: 96, y: 92, width: 940, height: 120 },
    artZone: { x: 82, y: 232, width: 1236, height: 1140 },
    flavorZone: { x: 110, y: 1524, width: 1180, height: 240 },
    badgeZone: { x: 1080, y: 92, width: 210, height: 72 }
  }
];

export const FINISH_PROFILES: FinishProfile[] = [
  { id: "standard", label: "Standard Satin", sheen: 0.12, rainbow: 0.01, roughness: 0.66, metalness: 0.08, glow: 0.05 },
  { id: "gloss", label: "Gloss Coat", sheen: 0.24, rainbow: 0.03, roughness: 0.38, metalness: 0.14, glow: 0.09 },
  { id: "holo", label: "Holo Burst", sheen: 0.56, rainbow: 0.48, roughness: 0.22, metalness: 0.3, glow: 0.17 },
  { id: "spectral", label: "Spectral Prism", sheen: 0.72, rainbow: 0.76, roughness: 0.16, metalness: 0.38, glow: 0.23 },
  { id: "gold-foil", label: "Gold Foil", sheen: 0.5, rainbow: 0.02, roughness: 0.18, metalness: 0.78, glow: 0.18 }
];

export const VIEW_PRESETS: ViewPreset[] = [
  { id: "hero", label: "Hero", rotationX: -0.16, rotationY: 0.24, distance: 10.3 },
  { id: "front", label: "Front", rotationX: -0.02, rotationY: 0, distance: 10.05 },
  { id: "dramatic", label: "Dramatic", rotationX: -0.24, rotationY: 0.42, distance: 10.8 }
];

export const EXPORT_PRESETS: ExportPreset[] = [
  { id: "social-png", label: "Social PNG", width: 1600, height: 1600, format: "png", pixelRatio: 1 },
  { id: "marketplace-png", label: "Marketplace PNG", width: 2000, height: 2400, format: "png", pixelRatio: 1 },
  { id: "product-webp", label: "Product WebP", width: 1600, height: 2000, format: "webp", pixelRatio: 1 },
  { id: "print-large", label: "Print Large PNG", width: 2800, height: 3600, format: "png", pixelRatio: 1 }
];

export const DEFAULT_MATERIAL_SETTINGS: MaterialSettings = {
  foilIntensity: 1,
  foilScale: 1.15,
  foilDetail: 0.62,
  roughnessShift: 0,
  metalnessShift: 0.08,
  clearcoat: 0.88,
  clearcoatRoughness: 0.16,
  normalStrength: 0.45,
  emissiveStrength: 0.1
};

export const DEFAULT_PROJECT: CardProject = {
  version: 1,
  id: "starter-project",
  themeId: "obsidian",
  finishId: "holo",
  exportPresetId: "marketplace-png",
  viewPresetId: "hero",
  content: {
    name: "Solar Warden",
    subtitle: "Radiant Vanguard",
    flavorText:
      "A mythic sentinel forged at the edge of dawn. Its armor bends light into a living halo.",
    rarity: "legendary",
    serial: "001/120",
    setCode: "OVR",
    artistCredit: "Your Studio",
    badge: "FIRST EDITION"
  },
  assets: {},
  artPlacement: {
    fitMode: "auto",
    scale: 1,
    offsetX: 0,
    offsetY: 0
  },
  material: DEFAULT_MATERIAL_SETTINGS,
  shimmerSpeed: 1,
  exposure: 1,
  showTiltPreview: true
};

export function getTheme(themeId: string): ThemeDefinition {
  return THEMES.find((theme) => theme.id === themeId) ?? THEMES[0];
}

export function getFinishProfile(finishId: FinishType): FinishProfile {
  return FINISH_PROFILES.find((finish) => finish.id === finishId) ?? FINISH_PROFILES[0];
}

export function getExportPreset(presetId: string): ExportPreset {
  return EXPORT_PRESETS.find((preset) => preset.id === presetId) ?? EXPORT_PRESETS[0];
}

export function getViewPreset(presetId: string): ViewPreset {
  return VIEW_PRESETS.find((preset) => preset.id === presetId) ?? VIEW_PRESETS[0];
}
