import "dotenv/config";

import dns from "dns";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import authRoutes from "./routes/auth.route";
import placesRoutes from "./routes/places.route";
import passwordResetRoutes from "./routes/password-reset.route";
// import healthRoutes from "./routes/health";

dns.setDefaultResultOrder("ipv4first");

const app = express();

const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

const API_V1="/api/v1";

// Routes
app.use(`${API_V1}/auth`, authRoutes);

app.use(`${API_V1}/auth`, passwordResetRoutes);
app.use(`${API_V1}/places`, placesRoutes);
// app.use("/api", healthRoutes);

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
    console.error(err.stack);

    return res.status(err.status || 500).json({
      success: false,
      message:
        err.message || "Internal server error",
      ...(process.env.NODE_ENV === "development" && {
        stack: err.stack,
      }),
    });
  }
);

app.listen(PORT, () => {
  console.log(
    ` Find My Theka Server running on port ${PORT}`
  );

  console.log(
    ` API Base URL: http://localhost:${PORT}`
  );
});

export default app;