import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": resolve(__dirname, "src"),
        },
    },
    server: {
        host: true, // 👈 allow LAN access
        port: 5173,
        strictPort: true,
    },
    css: {
        devSourcemap: false,
        preprocessorOptions: {
            scss: {
                quietDeps: true,
            },
        },
    },
});
