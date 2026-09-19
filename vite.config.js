import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';

const enableSsl = process.env.HTTPS === 'true' || process.argv.includes('--https');

export default defineConfig({
  plugins: [
    react(),
    enableSsl ? basicSsl() : null
  ].filter(Boolean),
  server: {
    host: true,
    port: 5173
  }
});
