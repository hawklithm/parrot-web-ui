import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  build: {
    minify: "esbuild",
  },
  esbuild:
    mode === "production"
      ? {
          drop: ["console", "debugger"],
          legalComments: "none",
        }
      : undefined,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@paperclipai/shared": path.resolve(
        __dirname,
        "./src/lib/paperclip-shared/src/index.ts",
      ),
      "@assistant-ui/react": path.resolve(__dirname, "./src/lib/assistant-ui-stub"),
      "parrot-adapter-utils": path.resolve(
        __dirname,
        "./src/lib/paperclip-adapter-utils/src/index.ts",
      ),
      lexical: path.resolve(__dirname, "./node_modules/lexical/Lexical.mjs"),
      "parrot-plugin-sdk": path.resolve(
        __dirname,
        "./src/sdk/plugin/index.ts",
      ),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_API_BASE_URL || "http://localhost:3100",
        changeOrigin: true,
        ws: true,
      },
    },
  },
}));
