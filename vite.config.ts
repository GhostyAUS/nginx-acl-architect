
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0", // Bind to all available network interfaces
    port: 8080,      // Use port 8080 as required
  },
  plugins: [
    react(),
    mode === 'development' && 
    (() => {
      try {
        const { componentTagger } = require("lovable-tagger");
        return componentTagger();
      } catch (e) {
        console.warn("lovable-tagger not found in development mode, skipping");
        return null;
      }
    })(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
