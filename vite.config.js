import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [svelte()],
  optimizeDeps: {
    // webcola ships as CJS; Vite needs to pre-bundle it for ESM compatibility.
    include: ['webcola'],
  },
})
