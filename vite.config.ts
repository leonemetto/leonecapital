import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  ssr: {
    // Ensure these are bundled for the SSR prerender step, not treated as externals
    noExternal: ['react-helmet-async', 'framer-motion'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'recharts': ['recharts'],
          'framer-motion': ['framer-motion'],
          'tanstack-query': ['@tanstack/react-query'],
          'sentry': ['@sentry/react'],
          'date-fns': ['date-fns'],
        },
      },
    },
  },
});
