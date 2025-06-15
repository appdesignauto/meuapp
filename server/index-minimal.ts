import express from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { configureCors } from "./cors-config";

const app = express();

// Basic middleware
configureCors(app);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Basic logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

(async () => {
  try {
    console.log("Starting minimal server configuration...");
    
    // Register basic routes
    registerRoutes(app);
    
    // Basic error handler
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Setup development server
    if (app.get("env") === "development") {
      await setupVite(app, undefined);
    } else {
      serveStatic(app);
    }

    const server = app.listen(5000, "0.0.0.0", () => {
      log(`Server running on port 5000`);
    });

    server.keepAliveTimeout = 120 * 1000;
    server.headersTimeout = 120 * 1000;

  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
})();