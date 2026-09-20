import os from "node:os"

import react from "@vitejs/plugin-react"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // `server-only` throws outside a React Server environment; tests run in jsdom.
      "server-only": fileURLToPath(new URL("./src/test/server-only-stub.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    // Room for the slowest interaction tests to finish when every worker is busy; it
    // bounds a hung test, it does not slow a passing one.
    testTimeout: 20_000,
    // Motion advances enter/exit animations on requestAnimationFrame, which jsdom drives
    // off a timer. Saturating every core delays those frames enough that content behind an
    // `AnimatePresence mode="wait"` can miss a query's timeout — a flake, not a real
    // failure. Leaving cores free keeps those frames ticking: it costs roughly three
    // seconds of wall time and takes the suite from flaky to green run after run.
    maxWorkers: Math.max(2, os.cpus().length - 3),
  },
})
