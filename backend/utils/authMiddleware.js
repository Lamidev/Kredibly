const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Always fetch user from DB to enforce accountStatus in real-time
        const dbUser = await User.findById(decoded.userId).select("-password");

        if (!dbUser) {
            return res.status(401).json({ message: "Token is not valid" });
        }

        // ─── Account Moderation Gates ───────────────────────────────────────
        if (dbUser.accountStatus === 'blocked') {
            return res.status(403).json({
                code: 'ACCOUNT_BLOCKED',
                message: 'Your account has been suspended. Please contact support.'
            });
        }

        if (dbUser.accountStatus === 'frozen') {
            // Admins are never frozen — only user accounts
            if (dbUser.role !== 'admin' && req.method !== 'GET') {
                return res.status(403).json({
                    code: 'ACCOUNT_FROZEN',
                    message: 'Your account is under review. Write access is temporarily suspended.'
                });
            }
        }
        // ────────────────────────────────────────────────────────────────────

        req.user = dbUser;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token is not valid" });
    }
};

const protect = authMiddleware;

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Not authorized as an admin" });
    }
};

module.exports = { protect, admin };
