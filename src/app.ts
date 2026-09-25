import "dotenv/config";

import dns from "dns";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import httpLogger from "./middleware/logger.middleware";

import authRoutes from "./routes/auth.route";
import placesRoutes from "./routes/places.route";
import passwordResetRoutes from "./routes/password-reset.route";

dns.setDefaultResultOrder("ipv4first");

const app = express();

const API_V1 = "/api/v1";

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(httpLogger);


// Routes
app.use(`${API_V1}/auth`, authRoutes);
app.use(`${API_V1}/auth`, passwordResetRoutes);
app.use(`${API_V1}/places`, placesRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    name: "Find My Theka API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      auth_register: "POST /api/auth/register",
      auth_login: "POST /api/auth/login",
      profile: "GET /api/auth/profile",
      nearby_places:
        "GET /api/places/nearby?lat={lat}&lng={lng}",
      search_places: "POST /api/places/search",
    },
  });
});

// Error handling
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
   
    req.log?.error(err);

    return res.status(err.status || 500).json({
      success: false,
      message: err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
      }),
    });
  }
);

export default app;