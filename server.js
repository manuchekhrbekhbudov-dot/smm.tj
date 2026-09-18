"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: true,
    credentials: true
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ===============================
// HEALTH CHECK
// ===============================

app.get("/", (req, res) => {
    res.json({
        success: true,
        name: "SMM.TJ",
        message: "SMM.TJ Backend API фаъол аст",
        version: "1.0.0"
    });
});

app.get("/api", (req, res) => {
    res.json({
        success: true,
        message: "SMM.TJ API фаъол аст",
        status: "online"
    });
});

// ===============================
// DATABASE TEST
// ===============================

app.get("/api/test/database", async (req, res) => {
    try {
        const result = await prisma.$queryRawUnsafe(
            "SELECT 1 AS ok"
        );

        res.json({
            success: true,
            message: "Database connected",
            data: result
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Database error",
            error: error.message
        });
    }
});

// ===============================
// SMM PROFILES
// ===============================

app.get("/api/profiles", async (req, res) => {
    try {
        const profiles = await prisma.smm_profiles.findMany({
            orderBy: {
                created_at: "desc"
            }
        });

        res.json({
            success: true,
            count: profiles.length,
            data: profiles
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to get profiles",
            error: error.message
        });
    }
});

// ===============================
// SERVER
// ===============================
// ===============================
// AUTH REGISTER
// ===============================

app.post("/api/auth/register", async (req, res) => {
    try {
        const {
            name,
            surname,
            username,
            phone,
            email,
            password,
            confirmPassword,
            city,
            country,
            role
        } = req.body;

        if (!name || !surname || !username || !phone || !email || !password) {
            return res.status(400).json({
                success: false,
                message: "Ҳамаи майдонҳои ҳатмиро пур кунед"
            });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Паролҳо мувофиқ нестанд"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Парол бояд ҳадди ақал 6 символ бошад"
            });
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    surname,
                    username,
                    phone,
                    city: city || null,
                    country: country || null,
                    role: role || "smm_specialist"
                }
            }
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        return res.status(201).json({
            success: true,
            message: "Ҳисоб бомуваффақият сохта шуд",
            data: {
                user: data.user,
                session: data.session
            }
        });

    } catch (error) {
        console.error("Register error:", error);

        return res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
});
// ===============================
// AUTH REGISTER
// ===============================

app.post("/api/auth/register", async (req, res) => {
    try {
        const {
            email,
            password,
            name,
            phone
        } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email ва password ҳатмӣ мебошанд"
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password бояд ҳадди ақал 6 символ бошад"
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email
            }
        });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "Ин email аллакай истифода шудааст"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                encrypted_password: hashedPassword,
                phone: phone || null,
                raw_user_meta_data: {
                    name: name || null
                }
            }
        });

        res.status(201).json({
            success: true,
            message: "Registration successful",
            data: {
                id: user.id,
                email: user.email,
                phone: user.phone
            }
        });

    } catch (error) {
        console.error("Register error:", error);

        res.status(500).json({
            success: false,
            message: "Registration failed",
            error: error.message
        });
    }
});
app.listen(PORT, () => {
    console.log("");
    console.log("=================================");
    console.log("       SMM.TJ BACKEND");
    console.log("=================================");
    console.log(`Server:   http://localhost:${PORT}`);
    console.log(`API:      http://localhost:${PORT}/api`);
    console.log(`Database: /api/test/database`);
    console.log(`Profiles: /api/profiles`);
    console.log("Status:   ONLINE");
    console.log("=================================");
    console.log("");
});
