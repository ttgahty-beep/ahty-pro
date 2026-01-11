
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
      // NOTE: For production security, ensure VITE_API_KEY or API_KEY is set in your build environment
      'process.env.API_KEY': JSON.stringify(env.API_KEY || 'AIzaSyCCBh0pg5FKJ6WDTrWZj2ySrQZu2ACHPEo')
    }
  };
});
