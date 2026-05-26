import { type ArtFitMode, type CardProject, type EditableLayoutZoneId, type FoilMaskPattern } from "@card-pipeline/schema";
import { defaultViewRotation } from "./card-project";

export type AssetSlot = Extract<keyof CardProject["assets"], string>;
export type StudioTab = "workflow" | "content" | "layout" | "surface" | "batch";

export type TemplatePreset = {
  id: string;
  label: string;
  description: string;
  apply: (project: CardProject) => CardProject;
};

export const STUDIO_TABS: Array<{ id: StudioTab; label: string }> = [
  { id: "workflow", label: "Workflow" },
  { id: "content", label: "Content" },
  { id: "layout", label: "2D Layout" },
  { id: "surface", label: "Surface" },
  { id: "batch", label: "Batch" }
];

export const LAYOUT_ZONES: Array<{ id: EditableLayoutZoneId; label: string }> = [
  { id: "titleZone", label: "Title" },
  { id: "artZone", label: "Art" },
  { id: "flavorZone", label: "Text Box" },
  { id: "badgeZone", label: "Badge" }
];

export const FOIL_MASK_PATTERNS: Array<{ id: FoilMaskPattern; label: string; description: string }> = [
  { id: "diagonal-prism", label: "Diagonal Prism", description: "Classic premium shine across the whole card." },
  { id: "spotlight-burst", label: "Spotlight Burst", description: "Bright shine focused around the main art." },
  { id: "border-glints", label: "Border Glints", description: "Foil sparkle concentrated around the frame." },
  { id: "text-safe-sheen", label: "Text Safe Sheen", description: "Adds shine while keeping text areas controlled." }
];

export const POST_READY_EXPORT_IDS = ["post-square-png", "post-portrait-webp", "story-png"] as const;

export const PRIMARY_ASSETS: Array<{
  slot: AssetSlot;
  label: string;
  hint: string;
}> = [
  { slot: "frontArt", label: "Front Art", hint: "Main character or product art." },
  { slot: "frontFrame", label: "Front Frame", hint: "Border, UI frame, logos, and foil windows." },
  { slot: "backArt", label: "Back Art", hint: "Card back image or full back design." }
];

export const SURFACE_ASSETS: Array<{
  slot: AssetSlot;
  label: string;
  hint: string;
}> = [
  { slot: "foilMask", label: "Foil Mask", hint: "White = shiny areas. Black = no foil." },
  { slot: "roughnessMap", label: "Roughness Map", hint: "Controls matte vs glossy patches." },
  { slot: "normalMap", label: "Normal Map", hint: "Adds embossed-looking surface detail." },
  { slot: "emissiveOverlay", label: "Glow Overlay", hint: "Optional glow accents on the front." }
];

export const TEMPLATE_PRESETS: TemplatePreset[] = [
  {
    id: "marketplace-hero",
    label: "Marketplace Hero",
    description: "Balanced premium showcase for listings.",
    apply: (project) => ({
      ...project,
      themeId: "obsidian",
      finishId: "holo",
      viewPresetId: "hero",
      viewRotation: defaultViewRotation("hero"),
      exportPresetId: "marketplace-png",
      showTiltPreview: true,
      material: {
        ...project.material,
        foilIntensity: 1.08,
        foilScale: 1.05,
        foilDetail: 0.58,
        clearcoat: 0.9
      }
    })
  },
  {
    id: "auction-pop",
    label: "Auction Pop",
    description: "Bright square-first look for social selling posts.",
    apply: (project) => ({
      ...project,
      themeId: "chrome-sky",
      finishId: "holo",
      viewPresetId: "hero",
      viewRotation: defaultViewRotation("hero"),
      exportPresetId: "post-square-png",
      showTiltPreview: true,
      layout: {},
      material: {
        ...project.material,
        foilIntensity: 1.18,
        foilScale: 1.08,
        foilDetail: 0.66,
        clearcoat: 0.94
      }
    })
  },
  {
    id: "gallery-chase",
    label: "Gallery Chase",
    description: "Moody premium finish for rare drops and graded-style previews.",
    apply: (project) => ({
      ...project,
      themeId: "crimson",
      finishId: "gold-foil",
      viewPresetId: "dramatic",
      viewRotation: defaultViewRotation("dramatic"),
      exportPresetId: "post-portrait-webp",
      showTiltPreview: true,
      layout: {},
      material: {
        ...project.material,
        foilIntensity: 1.24,
        foilScale: 1.24,
        foilDetail: 0.72,
        roughnessShift: -0.04,
        metalnessShift: 0.2
      }
    })
  },
  {
    id: "museum-relic",
    label: "Museum Relic",
    description: "Elegant muted premium look for collector catalog posts.",
    apply: (project) => ({
      ...project,
      themeId: "mint-relic",
      finishId: "gloss",
      viewPresetId: "front",
      viewRotation: defaultViewRotation("front"),
      exportPresetId: "marketplace-png",
      showTiltPreview: false,
      layout: {},
      material: {
        ...project.material,
        foilIntensity: 0.76,
        foilScale: 0.96,
        foilDetail: 0.42,
        roughnessShift: 0.04,
        clearcoat: 0.86
      }
    })
  },
  {
    id: "clean-catalog",
    label: "Clean Catalog",
    description: "Straight clean view for shops and product pages.",
    apply: (project) => ({
      ...project,
      themeId: "aurora",
      finishId: "gloss",
      viewPresetId: "front",
      viewRotation: defaultViewRotation("front"),
      exportPresetId: "product-webp",
      showTiltPreview: false,
      material: {
        ...project.material,
        foilIntensity: 0.5,
        foilScale: 1,
        foilDetail: 0.32,
        roughnessShift: 0.08
      }
    })
  },
  {
    id: "chase-foil",
    label: "Chase Foil",
    description: "Higher drama for premium inserts and chase cards.",
    apply: (project) => ({
      ...project,
      themeId: "obsidian",
      finishId: "spectral",
      viewPresetId: "dramatic",
      viewRotation: defaultViewRotation("dramatic"),
      exportPresetId: "print-large",
      showTiltPreview: true,
      material: {
        ...project.material,
        foilIntensity: 1.35,
        foilScale: 1.3,
        foilDetail: 0.82,
        metalnessShift: 0.16,
        emissiveStrength: 0.16
      }
    })
  }
];

export const FRONT_ART_FIT_MODES: Array<{ value: ArtFitMode; label: string }> = [
  { value: "auto", label: "Auto Detect" },
  { value: "full-card", label: "Full Card" },
  { value: "art-zone", label: "Inner Art Window" }
];

export function labelFromSlot(slot: AssetSlot): string {
  const asset = [...PRIMARY_ASSETS, ...SURFACE_ASSETS].find((entry) => entry.slot === slot);
  return asset?.label ?? slot;
}
