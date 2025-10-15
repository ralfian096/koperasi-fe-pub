import path from "path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 5000,
      host: "0.0.0.0",
      hmr: {
        clientPort: 443,
        protocol: "wss",
      },
      allowedHosts: [
        "86631b9a-eb18-4861-8c05-2aa0c276b982-00-2dx9u9whkrxha.pike.replit.dev",
      ],
    },
    plugins: [react()],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
  };
});
