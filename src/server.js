import dotenv from "dotenv";
dotenv.config();
import http from "node:http";
import jwt from "jsonwebtoken";
import { createClient } from "redis";
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from "@socket.io/redis-adapter";
import { createApp } from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

// 1. Initialize HTTP Server & Socket.IO
const httpServer = http.createServer();

export const io = new SocketIOServer(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
    },
    transports: ["websocket"],
});

// 2. Connect Redis Adapter (Multi-node sync)
if (process.env.REDIS_URL) {
    try {
        const pubClient = createClient({ url: process.env.REDIS_URL });
        const subClient = pubClient.duplicate();

        await Promise.all([pubClient.connect(), subClient.connect()]);
        io.adapter(createAdapter(pubClient, subClient));
        console.log("⚡ [Redis Adapter]: Connected!");
    } catch (err) {
        console.warn("⚠️ Redis adapter failed, falling back to in-memory");
    }
}

// 3. Inject Express into HTTP Server
const app = createApp(io);
httpServer.on("request", app);

// 4. WebSocket Auth & Events
io.on("connection", (socket) => {
    console.log(`⚡ [WebSocket Connected]`);

    socket.on("authenticate", (token) => {
        try {
            const secret = process.env.JWT_SECRET || "super_secret_jwt_key_production_2026_xyz";
            const decoded = jwt.verify(token, secret);

            socket.join(`user_${decoded.id}`);
            if (decoded.role === "ADMIN") {
                socket.join("admin_room");
            }

            socket.emit("authenticated", { success: true, message: "Connected!" });
        } catch (err) {
            socket.emit("auth_error", { message: "Invalid or expired token" });
        }
    });

    socket.on("disconnect", () => {
        console.log(`🔌 [Socket Disconnected]`);
    });
});

// 5. Sequential Boot: DB -> Models -> Server Listen (ONLY ONCE)
try {
    await connectDB();
    //await syncDatabase();

    httpServer.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`🚀 Server running`);
        console.log(`⚡ WebSocket active`);
        console.log(`====================================================`);
    });
} catch (error) {
    console.error("❌ Fatal Startup Error");
    process.exit(1);
}