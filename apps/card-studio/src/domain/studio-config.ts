import { type ArtFitMode, type CardProject } from "@card-pipeline/schema";
import { defaultViewRotation } from "./card-project";

export type AssetSlot = Extract<keyof CardProject["assets"], string>;
export type StudioTab = "workflow" | "content" | "surface" | "batch";

export type TemplatePreset = {
  id: string;
  label: string;
  description: string;
  apply: (project: CardProject) => CardProject;
};

export const STUDIO_TABS: Array<{ id: StudioTab; label: string }> = [
  { id: "workflow", label: "Workflow" },
  { id: "content", label: "Content" },
  { id: "surface", label: "Surface" },
  { id: "batch", label: "Batch" }
];

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
