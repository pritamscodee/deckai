import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF!,
  dirs: ["./trigger"],
  // Each illustrated slide now waits on an OpenAI image (~13s observed, slower under load).
  // A 10-slide deck can approach the old 300s ceiling, and a timeout loses the whole deck.
  maxDuration: 600,
});
