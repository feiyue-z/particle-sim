import { defineConfig } from 'vite';
import fs from 'fs';

export default defineConfig({
  base: '/particles/',
  server: {
    host: '0.0.0.0',
    https: {
      key: fs.readFileSync('localhost+1-key.pem'),
      cert: fs.readFileSync('localhost+1.pem')
    }
  }
});
