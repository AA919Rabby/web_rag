import dotenv from "dotenv";
dotenv.config();
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

export const query = async (text, params = []) => {
    const { rows } = await pool.query(text, params);
    return { rows };
};

export const connectDB = async () => {
    try {
        console.log("🔌 Connecting to Neon PostgreSQL (Singapore Region)...");
        const { rows } = await query("SELECT NOW() as current_time;");

        console.log("=================================");
        console.log("✅ Connected to Neon PostgreSQL DB!");
        console.log("🕒 Server Time:", rows[0].current_time);
        console.log("=================================");
    } catch (error) {
        console.error("❌ Neon DB Connection Error:", error.message);
        process.exit(1);
    }
};