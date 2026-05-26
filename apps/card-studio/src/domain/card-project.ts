import {
  DEFAULT_MATERIAL_SETTINGS,
  DEFAULT_PROJECT,
  type CardProject,
  type EditableLayoutZoneId,
  type MaterialSettings,
  type ViewRotation,
  getTheme,
  getViewPreset
} from "@card-pipeline/schema";

export type ProjectLike = Partial<CardProject> & {
  content?: Partial<CardProject["content"]>;
  assets?: Partial<CardProject["assets"]>;
  layout?: Partial<CardProject["layout"]>;
  artPlacement?: Partial<CardProject["artPlacement"]>;
  framePlacement?: Partial<CardProject["framePlacement"]>;
  viewRotation?: Partial<ViewRotation>;
  material?: Partial<MaterialSettings>;
};

export type BatchEntry = {
  id: string;
  name: string;
  project: CardProject;
};

const DEFAULT_ROLL = -0.015;
const LAYOUT_ZONE_IDS: EditableLayoutZoneId[] = ["titleZone", "artZone", "flavorZone", "badgeZone"];

export function defaultViewRotation(viewPresetId: string): ViewRotation {
  const preset = getViewPreset(viewPresetId);
  return {
    x: preset.rotationX,
    y: preset.rotationY,
    z: DEFAULT_ROLL
  };
}

export function normalizeProject(input: ProjectLike): CardProject {
  const viewPresetId = input.viewPresetId ?? DEFAULT_PROJECT.viewPresetId;
  const fallbackRotation = defaultViewRotation(viewPresetId);
  const theme = getTheme(input.themeId ?? DEFAULT_PROJECT.themeId);

  return {
    ...DEFAULT_PROJECT,
    ...input,
    content: {
      ...DEFAULT_PROJECT.content,
      ...input.content
    },
    assets: {
      ...DEFAULT_PROJECT.assets,
      ...input.assets
    },
    layout: LAYOUT_ZONE_IDS.reduce<CardProject["layout"]>((layout, zoneId) => {
      const zone = input.layout?.[zoneId];
      if (zone) {
        layout[zoneId] = {
          ...theme[zoneId],
          ...zone
        };
      }
      return layout;
    }, {}),
    artPlacement: {
      ...DEFAULT_PROJECT.artPlacement,
      ...input.artPlacement
    },
    framePlacement: {
      ...DEFAULT_PROJECT.framePlacement,
      ...input.framePlacement
    },
    viewRotation: {
      ...fallbackRotation,
      ...input.viewRotation
    },
    material: {
      ...DEFAULT_MATERIAL_SETTINGS,
      ...DEFAULT_PROJECT.material,
      ...input.material
    }
  };
}

export function cloneProject(project: CardProject): CardProject {
  return normalizeProject(JSON.parse(JSON.stringify(project)) as ProjectLike);
}

export function createBatchId(): string {
  return `batch-${Math.random().toString(36).slice(2, 10)}`;
}
