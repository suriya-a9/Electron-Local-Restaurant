const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
        return res.status(400).json({
            message: "no headers",
        });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(400).json({
            message: "no token",
        });
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res
                .status(401)
                .json({ message: "Invalid or expired token", error: err.message });
        }
        req.user = decoded;
        next();
    });
};