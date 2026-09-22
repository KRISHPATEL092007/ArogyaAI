import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    server: {
        host: "::",
        port: 8080,
        fs: {
            allow: ["./client", "./shared", "index.html"],
            deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "backend/**"],
        },
        // The backend is now a separate Python (Flask) process — run it with
        // `python backend/app.py` (see backend/README.md) and Vite will proxy
        // every /api/* call from the React app straight to it.
        proxy: {
            "/api": {
                target: "http://localhost:5000",
                changeOrigin: true,
            },
        },
    },
    build: {
        outDir: "dist/spa",
    },
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./client"),
            "@shared": path.resolve(__dirname, "./shared"),
        },
    },
}));
