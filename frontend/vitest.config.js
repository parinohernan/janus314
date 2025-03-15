import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";

export default defineConfig({
  plugins: [svelte({ hot: !process.env.VITEST })],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.js"],
    include: ["./tests/**/*.{test,spec}.{js,ts}"],
  },
  resolve: {
    alias: {
      $lib: "/src/lib",
      $app: "/src/__mocks__/app",
      $env: "/src/__mocks__/env",
    },
  },
});
