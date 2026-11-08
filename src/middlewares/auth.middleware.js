import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
    try {
        // 1. Safely check for authorization header
        const authHeader = req.headers && req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No Bearer token provided in Auth header.",
            });
        }

        // 2. Extract token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token missing.",
            });
        }

        // 3. Verify token with secret
        const secret = process.env.JWT_SECRET || "super_secret_jwt_key_production_2026_xyz";
        const decoded = jwt.verify(token, secret);

        // 4. Attach user data to request object
        req.user = decoded;
        next();
    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        return res.status(401).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};

// Check if user is an ADMIN
export const authorizeAdmin = (req, res, next) => {
    if (req.user?.role !== "ADMIN") {
        return res.status(403).json({
            success: false,
            message: "Access denied. Admin access only.",
        });
    }
    next();
};