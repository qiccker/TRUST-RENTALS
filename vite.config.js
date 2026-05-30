import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables into process.env for local API functions
Object.assign(process.env, loadEnv("development", process.cwd(), ""));

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function vercelApiPlugin() {
  return {
    name: 'vercel-api',
    configureServer(server) {
      server.middlewares.use('/api', async (req, res, next) => {
        try {
          const pathname = req.url.split('?')[0];
          // Determine the correct path (e.g. /razorpay/create-order -> api/razorpay/create-order.js)
          const filePath = path.resolve(__dirname, 'api', pathname.slice(1) + '.js');
          
          if (fs.existsSync(filePath)) {
            // Add a cache buster parameter to load fresh code on edits
            const { pathToFileURL } = await import("url");
            const fileUrl = pathToFileURL(filePath);
            fileUrl.searchParams.set("update", Date.now().toString());
            
            const module = await import(fileUrl.href);
            
            if (module.default) {
              await module.default(req, res);
              return;
            }
          }
        } catch (err) {
          console.error("API Error:", err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        next();
      });
    }
  }
}

export default defineConfig({
  plugins: [react(), vercelApiPlugin()],
  server: {
    port: 5173,
  },
});
