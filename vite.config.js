import { defineConfig } from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  base: '/c0r7x/',
  plugins: [glsl()],
  build: {
    target: 'esnext',
    minify: 'esbuild',
  },
});
