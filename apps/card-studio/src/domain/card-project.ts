import {
  DEFAULT_MATERIAL_SETTINGS,
  DEFAULT_PROJECT,
  type CardProject,
  type MaterialSettings,
  type ViewRotation,
  getViewPreset
} from "@card-pipeline/schema";

export type ProjectLike = Partial<CardProject> & {
  content?: Partial<CardProject["content"]>;
  assets?: Partial<CardProject["assets"]>;
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
