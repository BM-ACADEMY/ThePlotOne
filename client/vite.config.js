import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",

      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB
      },

      devOptions: {
        enabled: true,
      },

      includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],

      manifest: {
        name: "The Plot One",
        short_name: "ThePlotOne",
        description:
          "Pondicherry's leading real estate platform. Buy, sell, and rent verified properties.",
        theme_color: "#003366",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/",
        icons: [
          {
            src: "/Logo/pwa-logo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/Logo/pwa-logo.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/Logo/pwa-logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          antd: ["antd", "@ant-design/icons"],
          ui: ["framer-motion", "lucide-react"],
          utils: ["axios", "moment", "date-fns"],
          charts: ["recharts"],
          leaflet: ["leaflet", "react-leaflet"]
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  base: "/",
})
