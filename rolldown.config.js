import { defineConfig } from 'rolldown';

export default defineConfig([
  // ESM build — multiple entry points for npm + demo server
  {
    input: ['src/main.js', 'src/react.js', 'src/vue.js', 'src/svelte.js'],
    output: {
      dir: 'dist',
      entryFileNames: '[name].js',
    },
  },
  // CDN build — single self-contained IIFE file (no code-splitting)
  {
    input: 'src/main.js',
    output: {
      file: 'dist/mate.global.js',
      format: 'iife',
      name: 'Mate',
    },
  },
]);
