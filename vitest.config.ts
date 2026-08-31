import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
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
    },
  },
  test: {
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],
  },
});
