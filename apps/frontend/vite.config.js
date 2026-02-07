import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
      "/auth": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/health": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/chat": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/listings": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/requests": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/favorites": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      "/geo": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },

      "/media": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
