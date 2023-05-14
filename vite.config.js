import mkcert from 'vite-plugin-mkcert';
import { defineConfig } from 'vite';

export default defineConfig({
  server: { https: true },
  base: '/vr-labs',
  plugins: [mkcert()],
});
