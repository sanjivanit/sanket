import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The web app lives in web/. `npm run build` writes to ../dist, which Firebase Hosting serves.
// In development, /api is proxied to the Cloud Run API running locally (npm start).
export default defineConfig({
  root: import.meta.dirname,
  plugins: [react()],
  build: { outDir: '../dist', emptyOutDir: true },
  // fs.allow: the app imports the sample clinics from ../data so the browser and the API use the same file.
  server: { fs: { allow: ['..'] }, proxy: { '/api': 'http://localhost:8080' } },
});
