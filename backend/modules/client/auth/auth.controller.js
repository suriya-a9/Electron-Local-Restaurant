const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { findClientByEmail } = require("../../admin/clients/clients.model");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const errors = {};

        if (!email || !email.trim()) {
            errors.email = "Email is required";
        }

        if (!password) {
            errors.password = "Password is required";
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const client = await findClientByEmail(email.trim());

        if (!client) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        if (client.status === "suspended" || client.status === "inactive") {
            return res.status(403).json({
                success: false,
                message: `Your account is ${client.status}. Please contact support.`,
            });
        }

        const isPasswordValid = await bcrypt.compare(password, client.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        const token = jwt.sign(
            { id: client.id, email: client.email, role: "client" },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        const { password: _password, ...clientData } = client;

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                client: clientData,
                token,
            },
        });

    } catch (error) {
        console.error("Client login error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

module.exports = {
    login,
};