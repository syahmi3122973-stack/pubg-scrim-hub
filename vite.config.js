import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const APP_BUILD_ID = Date.now().toString(36)

const emitVersionJsonPlugin = () => ({
  name: 'emit-version-json',
  generateBundle() {
    this.emitFile({
      type: 'asset',
      fileName: 'version.json',
      source: JSON.stringify({ buildId: APP_BUILD_ID })
    })
  }
})

export default defineConfig({
  define: {
    __APP_BUILD_ID__: JSON.stringify(APP_BUILD_ID)
  },
  plugins: [
    react(),
    tailwindcss(),
    emitVersionJsonPlugin(),
  ],
  build: {
    sourcemap: false,
    rolldownOptions: {
      output: {
        minify: {
          compress: {
            dropConsole: true,
            dropDebugger: true,
          },
        },
      },
    },
  },
})
