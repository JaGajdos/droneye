import { defineConfig } from 'vite'
import { copyFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

// Plugin to copy localization files to dist
function copyLocalesPlugin() {
  return {
    name: 'copy-locales',
    writeBundle() {
      const srcLocales = join(process.cwd(), 'src', 'locales')
      const distLocales = join(process.cwd(), 'dist', 'src', 'locales')
      
      if (existsSync(srcLocales)) {
        // Create dist/src/locales directory
        if (!existsSync(distLocales)) {
          mkdirSync(distLocales, { recursive: true })
        }
        
        // Copy all JSON files
        const files = readdirSync(srcLocales)
        files.forEach(file => {
          if (file.endsWith('.json')) {
            const srcFile = join(srcLocales, file)
            const distFile = join(distLocales, file)
            copyFileSync(srcFile, distFile)
            console.log(`Copied ${file} to dist/src/locales/`)
          }
        })
      }
    }
  }
}

// Plugin to copy .htaccess to dist
function copyHtaccessPlugin() {
  return {
    name: 'copy-htaccess',
    writeBundle() {
      const htaccessFile = join(process.cwd(), '.htaccess')
      const distHtaccess = join(process.cwd(), 'dist', '.htaccess')
      
      if (existsSync(htaccessFile)) {
        copyFileSync(htaccessFile, distHtaccess)
        console.log(`Copied .htaccess to dist/`)
      }
    }
  }
}

export default defineConfig({
  base: '/droneye/',
  server: {
    port: 5173,
    open: true,
    historyApiFallback: true
  },
  plugins: [copyLocalesPlugin(), copyHtaccessPlugin()],
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
        dronetext: 'dronetext.html',
        legislativa: 'legislativa.html',
        gdpr: 'gdpr.html'
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
