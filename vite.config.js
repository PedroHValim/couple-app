import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// No GitHub Pages, um "project site" fica em usuario.github.io/nome-do-repo/,
// não na raiz. Defina BASE_PATH="/nome-do-repo/" como variável de ambiente no build
// (o workflow do GitHub Actions incluso já faz isso sozinho). Para outros hosts
// (Vercel, Netlify) pode deixar em branco, que ele assume a raiz "/".
const basePath = process.env.BASE_PATH || '/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Nossa Órbita',
        short_name: 'Órbita',
        description: 'O app do nosso casal — localização, mensagens e viagens.',
        theme_color: '#1B1B3A',
        background_color: '#1B1B3A',
        display: 'standalone',
        orientation: 'portrait',
        start_url: basePath,
        scope: basePath,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  server: {
    host: true
  }
});
