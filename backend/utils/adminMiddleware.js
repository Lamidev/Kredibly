/**
 * Middleware to restrict access to Admins only
 */
const adminMiddleware = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: "Access Denied: Founder/Admin only." });
    }
};

module.exports = adminMiddleware;
