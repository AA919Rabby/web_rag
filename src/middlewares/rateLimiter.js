import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// 1. Create and connect the Redis client
const redisClient = createClient({
    url: process.env.REDIS_URL, // Loads your Upstash/Redis connection string
});

redisClient.on("error", (err) => console.error("Redis Client Error:", err));
redisClient.on("connect", () => console.log("Connected to Redis successfully!"));

// Connect to Redis
await redisClient.connect();

// 2. TIER 3: The 24-Hour Limiter (Persisted in Redis)
const dailyLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 45,
    message: {
        success: false,
        message: "Maximum daily attempts reached. Your IP is blocked for 24 hours.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Send data to Redis with a unique prefix
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: "rl:daily:",
    }),
});

// 3. TIER 2: The 1-Hour Limiter (Persisted in Redis)
const hourlyLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30,
    message: {
        success: false,
        message: "Too many attempts. Your IP has been temporarily blocked for 1 hour.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: "rl:hourly:",
    }),
});

// 4. TIER 1: The 15-Minute Limiter (Persisted in Redis)
const standardLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 12,
    message: {
        success: false,
        message: "Too many attempts from this IP, please try again after 15 minutes.",
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
        prefix: "rl:standard:",
    }),
});

// Export all three chained limiters
export const authLimiter = [dailyLimiter, hourlyLimiter, standardLimiter];