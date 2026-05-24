import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const schemaPath = fileURLToPath(new URL("../../packages/card-schema/src/index.ts", import.meta.url));
const enginePath = fileURLToPath(new URL("../../packages/card-engine/src/index.ts", import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@card-pipeline/schema": schemaPath,
      "@card-pipeline/engine": enginePath
    }
  }
});
