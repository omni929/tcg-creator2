import { CardViewport, renderCard } from "@card-pipeline/engine";
import {
  DEFAULT_PROJECT,
  EXPORT_PRESETS,
  FINISH_PROFILES,
  THEMES,
  VIEW_PRESETS,
  type ArtFitMode,
  type CardProject,
  type ViewRotation
} from "@card-pipeline/schema";
import { startTransition, useMemo, useState, type ReactElement } from "react";
import {
  type BatchEntry,
  type ProjectLike,
  cloneProject,
  createBatchId,
  defaultViewRotation,
  normalizeProject
} from "./domain/card-project";
import {
  type AssetSlot,
  type StudioTab,
  FRONT_ART_FIT_MODES,
  PRIMARY_ASSETS,
  STUDIO_TABS,
  SURFACE_ASSETS,
  TEMPLATE_PRESETS,
  labelFromSlot
} from "./domain/studio-config";
import { downloadBlob, fileToDataUrl, fileToText, safeFileBaseName } from "./lib/file";
import { AssetCard } from "./ui/AssetCard";
import { RangeField } from "./ui/RangeField";

const ROTATION_STEP = Math.PI / 12;

function App(): ReactElement {
  const [project, setProject] = useState<CardProject>(() => normalizeProject(DEFAULT_PROJECT));
  const [busyLabel, setBusyLabel] = useState<string>("");
  const [message, setMessage] = useState<string>("Ready to build premium cards.");
  const [activeTab, setActiveTab] = useState<StudioTab>("workflow");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(TEMPLATE_PRESETS[0]?.id ?? "");
  const [batchEntries, setBatchEntries] = useState<BatchEntry[]>([]);

  const activeTheme = useMemo(
    () => THEMES.find((theme) => theme.id === project.themeId) ?? THEMES[0],
    [project.themeId]
  );

  const activePreset = useMemo(
    () => EXPORT_PRESETS.find((preset) => preset.id === project.exportPresetId) ?? EXPORT_PRESETS[0],
    [project.exportPresetId]
  );

  const activeFinish = useMemo(
    () => FINISH_PROFILES.find((finish) => finish.id === project.finishId) ?? FINISH_PROFILES[0],
    [project.finishId]
  );

  const primaryAssetCount = PRIMARY_ASSETS.filter(({ slot }) => Boolean(project.assets[slot]?.src)).length;
  const surfaceAssetCount = SURFACE_ASSETS.filter(({ slot }) => Boolean(project.assets[slot]?.src)).length;

  function patchProject(updater: (current: CardProject) => CardProject): void {
    startTransition(() => {
      setProject((current) => normalizeProject(updater(current)));
    });
  }

  function loadProject(nextProject: ProjectLike, nextMessage: string): void {
    startTransition(() => {
      setProject(normalizeProject(nextProject));
    });
    setMessage(nextMessage);
  }

  async function handleAssetUpload(slot: AssetSlot, file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }

    setBusyLabel(`Loading ${labelFromSlot(slot)}...`);
    try {
      const src = await fileToDataUrl(file);
      patchProject((current) => ({
        ...current,
        assets: {
          ...current.assets,
          [slot]: { src, name: file.name }
        },
        artPlacement:
          slot === "frontArt"
            ? {
                ...DEFAULT_PROJECT.artPlacement
              }
            : current.artPlacement
      }));
      setMessage(`${labelFromSlot(slot)} updated.`);
    } finally {
      setBusyLabel("");
    }
  }

  function clearAsset(slot: AssetSlot): void {
    patchProject((current) => ({
      ...current,
      assets: {
        ...current.assets,
        [slot]: undefined
      },
      artPlacement:
        slot === "frontArt"
          ? {
              ...DEFAULT_PROJECT.artPlacement
            }
          : current.artPlacement
    }));
    setMessage(`${labelFromSlot(slot)} cleared.`);
  }

  function resetFrontArtPlacement(): void {
    patchProject((current) => ({
      ...current,
      artPlacement: {
        ...DEFAULT_PROJECT.artPlacement
      }
    }));
    setMessage("Front art fit reset.");
  }

  async function handleProjectImport(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }

    setBusyLabel("Loading project...");
    try {
      const text = await fileToText(file);
      const parsed = JSON.parse(text) as ProjectLike & { version?: number; project?: ProjectLike };
      const incoming = parsed.project ?? parsed;
      if ((incoming.version ?? 1) !== 1) {
        throw new Error("Unsupported project version.");
      }
      loadProject(incoming, "Project loaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load project.");
    } finally {
      setBusyLabel("");
    }
  }

  function handleProjectExport(): void {
    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: "application/json"
    });
    downloadBlob(blob, `${safeFileBaseName(project.content.name)}-project.json`);
    setMessage("Project JSON downloaded.");
  }

  function handleTemplateExport(): void {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            name: project.content.name,
            project
          },
          null,
          2
        )
      ],
      { type: "application/json" }
    );
    downloadBlob(blob, `${safeFileBaseName(project.content.name)}-template.json`);
    setMessage("Template JSON downloaded.");
  }

  async function handleTemplateImport(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }

    setBusyLabel("Loading template...");
    try {
      const text = await fileToText(file);
      const parsed = JSON.parse(text) as { project?: ProjectLike } & ProjectLike;
      loadProject(parsed.project ?? parsed, "Template loaded into the editor.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load template.");
    } finally {
      setBusyLabel("");
    }
  }

  async function handleRenderExport(): Promise<void> {
    setBusyLabel("Rendering export...");
    try {
      const blob = await renderCard(project, activePreset);
      downloadBlob(blob, `${safeFileBaseName(project.content.name)}-${activePreset.id}.${activePreset.format}`);
      setMessage(`Exported ${activePreset.label}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Export failed.");
    } finally {
      setBusyLabel("");
    }
  }

  function addCurrentToBatch(): void {
    setBatchEntries((current) => [
      ...current,
      {
        id: createBatchId(),
        name: project.content.name || `Card ${current.length + 1}`,
        project: cloneProject(project)
      }
    ]);
    setMessage("Current card added to batch queue.");
  }

  function loadBatchEntry(entryId: string): void {
    const match = batchEntries.find((entry) => entry.id === entryId);
    if (!match) {
      return;
    }

    loadProject(match.project, `${match.name} loaded into the editor.`);
    setActiveTab("workflow");
  }

  function removeBatchEntry(entryId: string): void {
    setBatchEntries((current) => current.filter((entry) => entry.id !== entryId));
    setMessage("Batch item removed.");
  }

  function exportBatchJson(): void {
    const blob = new Blob(
      [
        JSON.stringify(
          {
            version: 1,
            entries: batchEntries
          },
          null,
          2
        )
      ],
      { type: "application/json" }
    );
    downloadBlob(blob, `${safeFileBaseName(project.content.name)}-batch.json`);
    setMessage("Batch JSON downloaded.");
  }

  async function importBatchJson(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }

    setBusyLabel("Loading batch...");
    try {
      const text = await fileToText(file);
      const parsed = JSON.parse(text) as {
        entries?: Array<{ id?: string; name?: string; project?: ProjectLike } | ProjectLike>;
      };

      const entries = (parsed.entries ?? []).map((entry, index) => {
        const normalized = normalizeProject("project" in entry && entry.project ? entry.project : (entry as ProjectLike));
        const name = "name" in entry && entry.name ? entry.name : normalized.content.name || `Card ${index + 1}`;
        const id = "id" in entry && entry.id ? entry.id : createBatchId();
        return { id, name, project: normalized };
      });

      setBatchEntries(entries);
      setMessage(`Loaded ${entries.length} batch item${entries.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to load batch.");
    } finally {
      setBusyLabel("");
    }
  }

  async function handleBatchRender(): Promise<void> {
    if (!batchEntries.length) {
      setMessage("Add at least one card to the batch queue first.");
      return;
    }

    setBusyLabel("Rendering batch...");
    try {
      for (let index = 0; index < batchEntries.length; index += 1) {
        const entry = batchEntries[index];
        const preset =
          EXPORT_PRESETS.find((candidate) => candidate.id === entry.project.exportPresetId) ?? EXPORT_PRESETS[0];
        setBusyLabel(`Rendering ${index + 1}/${batchEntries.length}...`);
        const blob = await renderCard(entry.project, preset);
        downloadBlob(blob, `${safeFileBaseName(entry.name)}-${preset.id}.${preset.format}`);
        await new Promise((resolve) => window.setTimeout(resolve, 120));
      }
      setMessage(`Rendered ${batchEntries.length} batch card${batchEntries.length === 1 ? "" : "s"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Batch render failed.");
    } finally {
      setBusyLabel("");
    }
  }

  function applyTemplatePreset(templateId: string): void {
    const template = TEMPLATE_PRESETS.find((entry) => entry.id === templateId);
    if (!template) {
      return;
    }

    patchProject((current) => template.apply(current));
    setMessage(`${template.label} applied.`);
  }

  function updateContent<K extends keyof CardProject["content"]>(
    key: K,
    value: CardProject["content"][K]
  ): void {
    patchProject((current) => ({
      ...current,
      content: {
        ...current.content,
        [key]: value
      }
    }));
  }

  function updateProject<K extends keyof CardProject>(key: K, value: CardProject[K]): void {
    patchProject((current) => ({
      ...current,
      [key]: value
    }));
  }

  function updateViewPreset(viewPresetId: string): void {
    patchProject((current) => ({
      ...current,
      viewPresetId,
      viewRotation: defaultViewRotation(viewPresetId)
    }));
  }

  function updateViewRotation(viewRotation: ViewRotation): void {
    patchProject((current) => ({
      ...current,
      viewRotation,
      showTiltPreview: false
    }));
  }

  function nudgeViewRotation(change: Partial<ViewRotation>): void {
    updateViewRotation({
      x: change.x ?? project.viewRotation.x,
      y: change.y ?? project.viewRotation.y,
      z: change.z ?? project.viewRotation.z
    });
  }

  function updateMaterial<K extends keyof CardProject["material"]>(
    key: K,
    value: CardProject["material"][K]
  ): void {
    patchProject((current) => ({
      ...current,
      material: {
        ...current.material,
        [key]: value
      }
    }));
  }

  return (
    <div className="app-shell">
      <main className="stage-column">
        <section className="stage-panel">
          <div className="stage-topbar">
            <div>
              <p className="eyebrow">Browser-first premium card studio</p>
              <h1>Total Overhaul Studio</h1>
              <p className="stage-summary">
                Keep the preview visible while you swap front art, frame, back art, and premium finish maps.
              </p>
            </div>
            <div className="status-stack">
              <span className="status-pill">{busyLabel || "Ready"}</span>
              <span className="status-note">{message}</span>
            </div>
          </div>

          <div className="stage-metrics">
            <div className="metric-card">
              <span>Theme</span>
              <strong>{activeTheme.label}</strong>
            </div>
            <div className="metric-card">
              <span>Finish</span>
              <strong>{activeFinish.label}</strong>
            </div>
            <div className="metric-card">
              <span>Assets</span>
              <strong>{primaryAssetCount}/3 core loaded</strong>
            </div>
            <div className="metric-card">
              <span>Surface Maps</span>
              <strong>{surfaceAssetCount}/4 custom</strong>
            </div>
          </div>

          <div className="viewport-shell">
            <div className="viewport-copy">
              <div>
                <p className="eyebrow">Live 3D preview</p>
                <h2>{project.content.name}</h2>
                <p>
                  {activeTheme.label} / {activePreset.label} / {project.finishId}
                </p>
              </div>
              <div className="viewport-tags">
                <span>{project.content.rarity}</span>
                <span>{project.content.serial}</span>
                <span>{project.content.setCode}</span>
              </div>
            </div>
            <div className="rotation-controls" aria-label="3D card rotation controls">
              <button type="button" onClick={() => nudgeViewRotation({ x: project.viewRotation.x - ROTATION_STEP })}>
                Pitch Up
              </button>
              <button type="button" onClick={() => nudgeViewRotation({ x: project.viewRotation.x + ROTATION_STEP })}>
                Pitch Down
              </button>
              <button type="button" onClick={() => nudgeViewRotation({ y: project.viewRotation.y - ROTATION_STEP })}>
                Yaw Left
              </button>
              <button type="button" onClick={() => nudgeViewRotation({ y: project.viewRotation.y + ROTATION_STEP })}>
                Yaw Right
              </button>
              <button type="button" onClick={() => nudgeViewRotation({ z: project.viewRotation.z - ROTATION_STEP })}>
                Roll Left
              </button>
              <button type="button" onClick={() => nudgeViewRotation({ z: project.viewRotation.z + ROTATION_STEP })}>
                Roll Right
              </button>
              <button type="button" onClick={() => updateViewRotation({ x: 0, y: 0, z: 0 })}>
                Front
              </button>
              <button type="button" onClick={() => updateViewRotation({ x: 0, y: Math.PI, z: 0 })}>
                Back
              </button>
              <button type="button" onClick={() => updateViewRotation(defaultViewRotation(project.viewPresetId))}>
                Reset
              </button>
            </div>
            <div className="viewport-canvas">
              <CardViewport project={project} rotation={project.viewRotation} onRotationChange={updateViewRotation} />
            </div>
          </div>

          <div className="stage-actions">
            <button className="primary-button" type="button" onClick={() => void handleRenderExport()} disabled={Boolean(busyLabel)}>
              {busyLabel ? busyLabel : "Render Export"}
            </button>
            <button type="button" onClick={handleProjectExport}>
              Save Project
            </button>
            <button type="button" onClick={handleTemplateExport}>
              Save Template
            </button>
          </div>
        </section>
      </main>

      <aside className="studio-column">
        <section className="panel studio-header">
          <div>
            <p className="eyebrow">Build order</p>
            <h2>Simple workflow</h2>
          </div>
          <ol className="workflow-list">
            <li>Load front art, front frame, and back art.</li>
            <li>Adjust text, crop, and export preset.</li>
            <li>Polish foil maps and surface controls.</li>
            <li>Save a template or batch when the setup feels right.</li>
          </ol>
        </section>

        <nav className="tab-strip" aria-label="Studio sections">
          {STUDIO_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={tab.id === activeTab ? "tab-button active" : "tab-button"}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "workflow" ? (
          <>
            <section className="panel">
              <h2>Core Assets</h2>
              <p className="muted">These three stay separate so the final card stays flexible.</p>
              <div className="asset-grid">
                {PRIMARY_ASSETS.map(({ slot, label, hint }) => (
                  <AssetCard
                    key={slot}
                    label={label}
                    hint={hint}
                    fileName={project.assets[slot]?.name}
                    onUpload={(file) => void handleAssetUpload(slot, file)}
                    onClear={project.assets[slot]?.src ? () => clearAsset(slot) : undefined}
                  />
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>Look Presets</h2>
              <div className="field-grid">
                <label>
                  Built-in Template
                  <select value={selectedTemplateId} onChange={(event) => setSelectedTemplateId(event.target.value)}>
                    {TEMPLATE_PRESETS.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.label}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="helper-copy">
                  {TEMPLATE_PRESETS.find((template) => template.id === selectedTemplateId)?.description}
                </p>
                <button type="button" onClick={() => applyTemplatePreset(selectedTemplateId)}>
                  Apply Template
                </button>
              </div>
            </section>

            <section className="panel">
              <h2>Project Files</h2>
              <div className="button-row">
                <label className="upload-button inline-upload">
                  Load Project
                  <input type="file" accept="application/json" onChange={(event) => void handleProjectImport(event.target.files?.[0])} />
                </label>
                <label className="upload-button inline-upload">
                  Load Template
                  <input type="file" accept="application/json" onChange={(event) => void handleTemplateImport(event.target.files?.[0])} />
                </label>
                <button type="button" onClick={() => loadProject(DEFAULT_PROJECT, "Starter project restored.")}>
                  Reset Starter
                </button>
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "content" ? (
          <>
            <section className="panel">
              <h2>Card Identity</h2>
              <div className="field-grid two-up">
                <label>
                  Name
                  <input value={project.content.name} onChange={(event) => updateContent("name", event.target.value)} />
                </label>
                <label>
                  Subtitle
                  <input value={project.content.subtitle} onChange={(event) => updateContent("subtitle", event.target.value)} />
                </label>
                <label>
                  Badge
                  <input value={project.content.badge} onChange={(event) => updateContent("badge", event.target.value)} />
                </label>
                <label>
                  Serial
                  <input value={project.content.serial} onChange={(event) => updateContent("serial", event.target.value)} />
                </label>
                <label>
                  Set Code
                  <input value={project.content.setCode} onChange={(event) => updateContent("setCode", event.target.value)} />
                </label>
                <label>
                  Artist Credit
                  <input value={project.content.artistCredit} onChange={(event) => updateContent("artistCredit", event.target.value)} />
                </label>
                <label>
                  Rarity
                  <select
                    value={project.content.rarity}
                    onChange={(event) => updateContent("rarity", event.target.value as CardProject["content"]["rarity"])}
                  >
                    <option value="common">Common</option>
                    <option value="rare">Rare</option>
                    <option value="epic">Epic</option>
                    <option value="legendary">Legendary</option>
                  </select>
                </label>
                <label>
                  View Preset
                  <select value={project.viewPresetId} onChange={(event) => updateViewPreset(event.target.value)}>
                    {VIEW_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="full-width">
                  Flavor Text
                  <textarea
                    rows={4}
                    value={project.content.flavorText}
                    onChange={(event) => updateContent("flavorText", event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="panel">
              <h2>Layout & Export</h2>
              <div className="field-grid">
                <label>
                  Theme
                  <select value={project.themeId} onChange={(event) => updateProject("themeId", event.target.value)}>
                    {THEMES.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Export Preset
                  <select value={project.exportPresetId} onChange={(event) => updateProject("exportPresetId", event.target.value)}>
                    {EXPORT_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Front Art Fit
                  <select
                    value={project.artPlacement.fitMode}
                    onChange={(event) =>
                      patchProject((current) => ({
                        ...current,
                        artPlacement: {
                          ...current.artPlacement,
                          fitMode: event.target.value as ArtFitMode
                        }
                      }))
                    }
                  >
                    {FRONT_ART_FIT_MODES.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </label>
                <RangeField
                  label="Art Scale"
                  value={project.artPlacement.scale}
                  min={0.8}
                  max={1.6}
                  step={0.01}
                  onChange={(value) =>
                    patchProject((current) => ({
                      ...current,
                      artPlacement: { ...current.artPlacement, scale: value }
                    }))
                  }
                />
                <RangeField
                  label="Art X Offset"
                  value={project.artPlacement.offsetX}
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  onChange={(value) =>
                    patchProject((current) => ({
                      ...current,
                      artPlacement: { ...current.artPlacement, offsetX: value }
                    }))
                  }
                />
                <RangeField
                  label="Art Y Offset"
                  value={project.artPlacement.offsetY}
                  min={-0.5}
                  max={0.5}
                  step={0.01}
                  onChange={(value) =>
                    patchProject((current) => ({
                      ...current,
                      artPlacement: { ...current.artPlacement, offsetY: value }
                    }))
                  }
                />
              </div>
              <p className="muted">
                Auto Detect will fill the whole card when you upload a full finished card image, or just the inner art window when you upload regular art.
              </p>
              <div className="button-row">
                <button className="ghost-button" type="button" onClick={resetFrontArtPlacement}>
                  Reset Art Fit
                </button>
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "surface" ? (
          <>
            <section className="panel">
              <h2>Finish & Motion</h2>
              <div className="field-grid">
                <label>
                  Finish Profile
                  <select value={project.finishId} onChange={(event) => updateProject("finishId", event.target.value as CardProject["finishId"])}>
                    {FINISH_PROFILES.map((finish) => (
                      <option key={finish.id} value={finish.id}>
                        {finish.label}
                      </option>
                    ))}
                  </select>
                </label>
                <RangeField
                  label="Preview Exposure"
                  value={project.exposure}
                  min={0.7}
                  max={1.5}
                  step={0.01}
                  onChange={(value) => updateProject("exposure", value)}
                />
                <RangeField
                  label="Foil Motion"
                  value={project.shimmerSpeed}
                  min={0}
                  max={2.5}
                  step={0.05}
                  onChange={(value) => updateProject("shimmerSpeed", value)}
                />
              </div>
              <label className="toggle-line">
                <input
                  type="checkbox"
                  checked={project.showTiltPreview}
                  onChange={(event) => updateProject("showTiltPreview", event.target.checked)}
                />
                <span>Enable gentle tilt preview</span>
              </label>
            </section>

            <section className="panel">
              <h2>Surface Maps</h2>
              <p className="muted">Leave these empty and the studio will use built-in premium fallback maps.</p>
              <div className="asset-grid">
                {SURFACE_ASSETS.map(({ slot, label, hint }) => (
                  <AssetCard
                    key={slot}
                    label={label}
                    hint={hint}
                    fileName={project.assets[slot]?.name}
                    onUpload={(file) => void handleAssetUpload(slot, file)}
                    onClear={project.assets[slot]?.src ? () => clearAsset(slot) : undefined}
                  />
                ))}
              </div>
            </section>

            <section className="panel">
              <h2>Material Controls</h2>
              <div className="field-grid">
                <RangeField
                  label="Foil Intensity"
                  value={project.material.foilIntensity}
                  min={0}
                  max={1.8}
                  step={0.01}
                  onChange={(value) => updateMaterial("foilIntensity", value)}
                />
                <RangeField
                  label="Foil Scale"
                  value={project.material.foilScale}
                  min={0.7}
                  max={1.6}
                  step={0.01}
                  onChange={(value) => updateMaterial("foilScale", value)}
                />
                <RangeField
                  label="Foil Detail"
                  value={project.material.foilDetail}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateMaterial("foilDetail", value)}
                />
                <RangeField
                  label="Roughness Shift"
                  value={project.material.roughnessShift}
                  min={-0.25}
                  max={0.25}
                  step={0.01}
                  onChange={(value) => updateMaterial("roughnessShift", value)}
                />
                <RangeField
                  label="Metalness Shift"
                  value={project.material.metalnessShift}
                  min={-0.15}
                  max={0.25}
                  step={0.01}
                  onChange={(value) => updateMaterial("metalnessShift", value)}
                />
                <RangeField
                  label="Clearcoat"
                  value={project.material.clearcoat}
                  min={0}
                  max={1}
                  step={0.01}
                  onChange={(value) => updateMaterial("clearcoat", value)}
                />
                <RangeField
                  label="Clearcoat Roughness"
                  value={project.material.clearcoatRoughness}
                  min={0.02}
                  max={0.5}
                  step={0.01}
                  onChange={(value) => updateMaterial("clearcoatRoughness", value)}
                />
                <RangeField
                  label="Normal Strength"
                  value={project.material.normalStrength}
                  min={0}
                  max={1.5}
                  step={0.01}
                  onChange={(value) => updateMaterial("normalStrength", value)}
                />
                <RangeField
                  label="Glow Strength"
                  value={project.material.emissiveStrength}
                  min={0}
                  max={0.4}
                  step={0.01}
                  onChange={(value) => updateMaterial("emissiveStrength", value)}
                />
              </div>
            </section>
          </>
        ) : null}

        {activeTab === "batch" ? (
          <>
            <section className="panel">
              <h2>Reusable Templates</h2>
              <p className="muted">Use project JSON for a one-off file. Use template JSON when you want a reusable starting point.</p>
              <div className="button-row">
                <button type="button" onClick={handleTemplateExport}>
                  Save Template JSON
                </button>
                <label className="upload-button inline-upload">
                  Load Template JSON
                  <input type="file" accept="application/json" onChange={(event) => void handleTemplateImport(event.target.files?.[0])} />
                </label>
              </div>
            </section>

            <section className="panel">
              <h2>Batch Queue</h2>
              <div className="button-row">
                <button type="button" onClick={addCurrentToBatch}>
                  Add Current Card
                </button>
                <button type="button" onClick={exportBatchJson} disabled={!batchEntries.length}>
                  Save Batch JSON
                </button>
                <label className="upload-button inline-upload">
                  Load Batch JSON
                  <input type="file" accept="application/json" onChange={(event) => void importBatchJson(event.target.files?.[0])} />
                </label>
                <button type="button" onClick={() => void handleBatchRender()} disabled={!batchEntries.length || Boolean(busyLabel)}>
                  Render Batch
                </button>
              </div>

              <div className="batch-list">
                {batchEntries.length ? (
                  batchEntries.map((entry, index) => (
                    <div className="batch-card" key={entry.id}>
                      <div>
                        <strong>
                          {index + 1}. {entry.name}
                        </strong>
                        <p>
                          {entry.project.themeId} / {entry.project.finishId} / {entry.project.exportPresetId}
                        </p>
                      </div>
                      <div className="asset-actions">
                        <button type="button" onClick={() => loadBatchEntry(entry.id)}>
                          Load
                        </button>
                        <button className="ghost-button" type="button" onClick={() => removeBatchEntry(entry.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">No batch items yet. Add your current card when you want a reusable queue.</p>
                )}
              </div>
            </section>
          </>
        ) : null}
      </aside>
    </div>
  );
}

export default App;
