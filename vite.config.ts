import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages sert le site depuis un sous-chemin ; en local il reste à la
  // racine. Sans ça, les chemins des scripts publiés pointent à côté et la
  // page publiée reste blanche, sans la moindre erreur visible.
  base: process.env.VITE_BASE ?? '/',
  build: { target: 'es2022' },
});
