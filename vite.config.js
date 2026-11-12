import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages sert le site sous https://UTILISATEUR.github.io/NOM_DU_DEPOT/
// Remplacer NOM_DU_DEPOT par le nom exact du dépôt (en gardant les deux barres obliques).
export default defineConfig({
  base: '/NOM_DU_DEPOT/',
  plugins: [react()],
});
