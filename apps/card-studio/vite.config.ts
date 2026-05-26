import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const schemaPath = fileURLToPath(new URL("../../packages/card-schema/src/index.ts", import.meta.url));
const enginePath = fileURLToPath(new URL("../../packages/card-engine/src/index.ts", import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/three/examples")) {
            return "three-examples";
          }
          if (id.includes("node_modules/three")) {
            return "three-core";
          }
          if (id.includes("@react-three")) {
            return "three-react";
          }
          if (id.includes("node_modules")) {
            return "vendor";
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      "@card-pipeline/schema": schemaPath,
      "@card-pipeline/engine": enginePath
    }
  }
});
