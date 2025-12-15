import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 5173,
    open: true,
    historyApiFallback: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: 'index.html',
        sluzby: 'sluzby.html',
        projekty: 'projekty.html',
        tim: 'tim.html',
        'cenova-ponuka': 'cenova-ponuka.html',
        kontakt: 'kontakt.html',
        dronetext: 'dronetext.html'
      },
      output: {
        manualChunks: {
          'three': ['three']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['three']
  }
})
