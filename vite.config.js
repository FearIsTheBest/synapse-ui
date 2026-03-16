import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(
    import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
    resolve: {
        alias: {
            'reset': path.resolve(__dirname, 'src/styles/_reset.scss')
        }
    },
    plugins: [react()],
    base: './',
    server: {
        port: 5173,
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
        input: {
            main: path.resolve(__dirname, 'index.html'),
            console: path.resolve(__dirname, 'Console.html'),
        }
    }
    },
})