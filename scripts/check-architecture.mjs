import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "AGENTS.md",
  "ARCHITECTURE.md",
  "docs/PRODUCT_SENSE.md",
  "docs/DESIGN.md",
  "docs/PLANS.md",
  "docs/QUALITY_SCORE.md",
  "docs/RELIABILITY.md",
  "docs/SECURITY.md",
  "docs/design-docs/index.md",
  "docs/design-docs/core-beliefs.md",
  "docs/exec-plans/tech-debt-tracker.md"
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) {
    failures.push(`Missing required repo knowledge file: ${file}`);
  }
}

const agentsPath = path.join(root, "AGENTS.md");
if (fs.existsSync(agentsPath)) {
  const lineCount = fs.readFileSync(agentsPath, "utf8").trimEnd().split(/\r?\n/).length;
  if (lineCount > 120) {
    failures.push(`AGENTS.md has ${lineCount} lines. Keep it at 120 lines or fewer.`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) {
    return [];
  }

  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return walk(fullPath);
    }
    return /\.(ts|tsx)$/.test(entry.name) ? [fullPath] : [];
  });
}

function relative(file) {
  return path.relative(root, file).replaceAll(path.sep, "/");
}

function importsFor(file) {
  const source = fs.readFileSync(file, "utf8");
  return [...source.matchAll(/import\s+(?:type\s+)?[\s\S]*?\s+from\s+["']([^"']+)["']/g)].map((match) => match[1]);
}

function failOnImport(file, blockedImports, reason) {
  const rel = relative(file);
  for (const specifier of importsFor(file)) {
    if (blockedImports.some((blocked) => specifier === blocked || specifier.startsWith(blocked))) {
      failures.push(`${rel} imports "${specifier}". ${reason}`);
    }
  }
}

for (const file of walk(path.join(root, "packages/card-schema/src"))) {
  failOnImport(file, ["@card-pipeline/engine", "../card-engine", "../../card-engine", "../../apps", "../../../apps"], "Schema must stay below engine and app.");
}

for (const file of walk(path.join(root, "packages/card-engine/src"))) {
  failOnImport(file, ["../../apps", "../../../apps"], "Engine must not depend on app code.");
}

for (const file of walk(path.join(root, "apps/card-studio/src/domain"))) {
  failOnImport(file, ["../ui", "@card-pipeline/engine"], "Domain must stay free of UI and rendering dependencies.");
}

for (const file of walk(path.join(root, "apps/card-studio/src/ui"))) {
  failOnImport(file, ["../domain", "@card-pipeline/engine", "@card-pipeline/schema"], "UI controls must stay presentational.");
}

for (const file of walk(path.join(root, "apps/card-studio/src/lib"))) {
  failOnImport(file, ["react", "@card-pipeline/engine", "@card-pipeline/schema"], "Lib utilities must stay generic.");
}

if (failures.length) {
  console.error("Architecture check failed:\n");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("Architecture check passed.");
