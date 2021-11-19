import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
    return {
        plugins: [react(), ViteEjsPlugin()],
        build: {
            outDir: path.join(__dirname, '../../docs/examples/react-demo')
        }
    };
});
