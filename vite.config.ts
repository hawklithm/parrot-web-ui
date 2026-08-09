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
      "@paperclipai/shared": path.resolve(__dirname, "./src/lib/paperclip-shared/src"),
      "@paperclipai/adapter-utils": path.resolve(__dirname, "./src/lib/paperclip-adapter-utils/src"),
      "@paperclipai/adapter-claude-local": path.resolve(__dirname, "./src/adapters/claude-local/stub"),
      "@paperclipai/adapter-codex-local": path.resolve(__dirname, "./src/adapters/codex-local/stub"),
      "@paperclipai/adapter-cursor-cloud": path.resolve(__dirname, "./src/adapters/cursor-cloud/stub"),
      "@paperclipai/adapter-cursor-local": path.resolve(__dirname, "./src/adapters/cursor-local/stub"),
      "@paperclipai/adapter-gemini-local": path.resolve(__dirname, "./src/adapters/gemini-local/stub"),
      "@paperclipai/adapter-grok-local": path.resolve(__dirname, "./src/adapters/grok-local/stub"),
      "@paperclipai/adapter-openclaw-gateway": path.resolve(__dirname, "./src/adapters/openclaw-gateway/stub"),
      "@paperclipai/adapter-opencode-local": path.resolve(__dirname, "./src/adapters/opencode-local/stub"),
      "@paperclipai/adapter-pi-local": path.resolve(__dirname, "./src/adapters/pi-local/stub"),
      "@paperclipai/hermes-paperclip-adapter": path.resolve(__dirname, "./src/adapters/hermes-gateway/stub"),
      "@assistant-ui/react": path.resolve(__dirname, "./src/lib/assistant-ui-stub"),
      lexical: path.resolve(__dirname, "./node_modules/lexical/dist/Lexical.mjs"),
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
