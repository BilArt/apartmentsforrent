import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    proxy: {
      "/auth": "http://localhost:3000",
      "/listings": "http://localhost:3000",
      "/health": "http://localhost:3000",
    },
  },
});
