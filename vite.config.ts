import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    inspectAttr(),
    react(),
    // Ensure dev server serves .safetensors with binary content-type to avoid loader parsing issues
    {
      name: 'safetensors-mime',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          try {
            if (req.url && req.url.endsWith('.safetensors')) {
              res.setHeader('content-type', 'application/octet-stream');
            }
            // Prevent SPA fallback for missing model files
            if (req.url && req.url.startsWith('/models/')) {
              const fs = require('fs');
              const path = require('path');
              const filePath = path.join(__dirname, 'public', req.url.split('?')[0]);
              if (!fs.existsSync(filePath)) {
                res.statusCode = 404;
                res.end('Not found');
                return;
              }
            }
          } catch (e) { }
          next();
        });
      }
    },
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectManifest: {
        maximumFileSizeToCacheInBytes: 3145728, // 3 MB
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'icons/icon-192x192.svg', 'icons/icon-512x512.svg'],
      manifest: {
        name: 'Loom',
        short_name: 'Loom',
        description: 'Track interactions, habits, and build stronger friendships.',
        theme_color: '#8b5cf6',
        icons: [
          {
            src: 'icons/icon-192x192.svg',
            sizes: '192x192',
            type: 'image/svg+xml'
          },
          {
            src: 'icons/icon-512x512.svg',
            sizes: '512x512',
            type: 'image/svg+xml'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
