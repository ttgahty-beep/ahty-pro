
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
    },
    server: {
      port: 3000,
    },
    define: {
      // Use logical OR to ensure it's at least an empty string if undefined, preventing some build issues
      'process.env.API_KEY': JSON.stringify(env.API_KEY || 'AIzaSyCig6dk3C-M04kzTEAAipBTfJ31TYyK_5c')
    }
  };
});
