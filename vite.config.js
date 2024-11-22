import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import compression from 'vite-plugin-compression';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br',
    }),
    {
      name: 'copy-manifest',
      buildStart() {
        this.addWatchFile('public/manifest.json');
      },
      generateBundle() {
        const manifestPath = path.resolve(__dirname, 'public/manifest.json');
        if (fs.existsSync(manifestPath)) {
          this.emitFile({
            type: 'asset',
            fileName: 'manifest.json',
            source: fs.readFileSync(manifestPath, 'utf-8')
          });
        } else {
          throw new Error('manifest.json not found in public directory');
        }
      }
    }
  ],
  root: process.cwd(),
  base: './',
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', '@tanstack/react-query'],
          'vendor-ui': ['@headlessui/react', '@heroicons/react', 'framer-motion'],
          'vendor-charts': ['recharts'],
          'vendor-network': ['axios', 'socket.io-client', 'ws'],
          'vendor-utils': ['prop-types']
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name.endsWith('.css')) {
            return 'static/css/main.css';
          }
          if (/\.(jpe?g|png|gif|svg|ico)$/i.test(assetInfo.name)) {
            return 'static/images/[name][extname]';
          }
          return `static/[ext]/[name][extname]`;
        },
        chunkFileNames: 'static/js/[name].js',
        entryFileNames: 'static/js/main.js'
      }
    },
    manifest: false, // Disable Vite's build manifest since we don't need it
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    preload: [
      'static/js/vendor-react-[hash].js',
      'static/js/vendor-ui-[hash].js',
      'static/js/vendor-charts-[hash].js',
      'static/js/vendor-network-[hash].js',
      'static/js/vendor-utils-[hash].js',
    ]
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
});