import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Polling avoids file-watch locks while this workspace syncs with OneDrive.
    watch: { usePolling: true, interval: 300 },
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
  preview: {
    proxy: {
      '/api': 'http://127.0.0.1:5000',
    },
  },
})
