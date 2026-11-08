import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import contractRoutes from "./routes/contract.routes.js";
import ragRoutes from "./routes/rag.routes.js";


export const createApp = (io) => {
    const app = express();

    app.use(helmet({ crossOriginResourcePolicy: false })); // Allows images to load across domains
    app.use(cors({ origin: "*" }));
    app.use(express.json({ limit: "15mb" }));
    app.use(express.urlencoded({ extended: true }));

    // ✅ Expose avatars publicly at http://localhost:5000/uploads/avatars/...
    // app.use("/uploads", express.static(path.resolve("uploads")));

    app.use((req, _res, next) => {
        req.io = io;
        next();
    });

    // Mount Routes
    app.use("/v1/api/contracts", contractRoutes);
    app.use("/v1/api/rag", ragRoutes);

    app.get("/health", (_req, res) => res.json({ status: "OK" }));


    return app;
};