import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isAndroid = mode === 'android';

  return {
    base: isAndroid ? './' : '/calendario-pessoal/',

    plugins: [
      react(),
      tailwindcss(),

      ...(
        isAndroid
          ? []
          : [
              VitePWA({
                registerType: 'autoUpdate',
                injectRegister: 'auto',

                includeAssets: [
                  'favicon.ico',
                  'apple-touch-icon.png',
                  'icon.svg',
                ],

                manifest: {
                  id: '/calendario-pessoal/',
                  name: 'StudyTrack',
                  short_name: 'StudyTrack',
                  description:
                    'Aplicação pessoal de gestão, planeamento semanal e acompanhamento de estudos.',
                  theme_color: '#142B4A',
                  background_color: '#F3F5F8',
                  display: 'standalone',
                  start_url: '/calendario-pessoal/',
                  scope: '/calendario-pessoal/',

                  icons: [
                    {
                      src: '/calendario-pessoal/pwa-192x192.png',
                      sizes: '192x192',
                      type: 'image/png',
                      purpose: 'any',
                    },
                    {
                      src: '/calendario-pessoal/pwa-512x512.png',
                      sizes: '512x512',
                      type: 'image/png',
                      purpose: 'any',
                    },
                    {
                      src: '/calendario-pessoal/pwa-maskable-512x512.png',
                      sizes: '512x512',
                      type: 'image/png',
                      purpose: 'maskable',
                    },
                  ],
                },

                workbox: {
                  globPatterns: [
                    '**/*.{js,css,html,ico,png,svg,woff,woff2}',
                  ],
                },

                devOptions: {
                  enabled: true,
                  type: 'module',
                },
              }),
            ]
      ),
    ],

    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : {},
    },
  };
});
