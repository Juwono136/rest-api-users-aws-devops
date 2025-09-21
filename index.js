import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";
import helmet from "helmet";

import userRoutes from "./routes/users.js";
import swaggerSpec from "./utils/swagger.js";

import { errorHandler } from "./middleware/errorMiddleware.js";
import { sanitizeInput } from "./middleware/sanitizeMiddleware.js";

const app = express();
dotenv.config();

app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));

const corsOptions = {
  origin: process.env.DEFAULT_CLIENT_URL || process.env.INTERNET_SERVER,
  credentials: false,
};

const CONNECTION_URL = process.env.CONNECTION_URL;
const PORT = process.env.PORT;
const DB_NAME = process.env.DB_NAME;

app.use(cors(corsOptions));
app.use(cookieParser());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        imgSrc: ["'self'", "data:", "cdn.jsdelivr.net"],
        connectSrc: ["'self'", process.env.INTERNET_SERVER],
      },
    },
  })
);

// Ensure trust for reverse proxies (e.g., Nginx or cloud hosting)
app.set("trust proxy", true);

app.use(sanitizeInput);

app.use("/api/user", userRoutes);
app.use(
  "/users/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "User Management API",
  })
);

// Serve frontend
if (process.env.NODE_ENV === "production") {
  app.get("/", (req, res) => {
    res.redirect(process.env.DEFAULT_CLIENT_URL);
  });
} else {
  app.get("/", (req, res) => res.send("Backend is running."));
}

app.use(errorHandler);

mongoose.set("strictQuery", true);

mongoose
  .connect(CONNECTION_URL, { dbName: DB_NAME })
  .then(() => app.listen(PORT, () => console.log(`Server running on port: ${PORT}`)))
  .catch((error) => console.log(error.message));
