import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'
import { componentTagger } from 'lovable-tagger'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  appType: 'spa',
  server: {
    host: '::',
    port: 3000,
    allowedHosts: ['.ngrok-free.dev', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === 'development' && componentTagger()].filter(
    Boolean,
  ),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Pure logic only for now, so no DOM environment is needed. Adding
    // component tests later means installing jsdom and switching this to
    // 'jsdom' plus a setup file.
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
}))
