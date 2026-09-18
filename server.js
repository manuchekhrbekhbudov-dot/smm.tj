"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { PrismaClient } = require("@prisma/client");
const supabase = require("./lib/supabase");

const app = express();
const prisma = new PrismaClient();

const PORT = process.env.PORT || 5000;

// ===============================
// MIDDLEWARE
// ===============================

app.use(
    cors({
        origin: true,
        credentials: true
    })
);

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
        console.error("Database error:", error);

        res.status(500).json({
            success: false,
            message: "Database error",
            error: error.message
        });
    }
});

// ===============================
// GET SMM PROFILES
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
        console.error("Profiles error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get profiles",
            error: error.message
        });
    }
});

// ===============================
// GET ONE SMM PROFILE
// ===============================

app.get("/api/profiles/:id", async (req, res) => {
    try {
        const profile = await prisma.smm_profiles.findUnique({
            where: {
                id: req.params.id
            }
        });

        if (!profile) {
            return res.status(404).json({
                success: false,
                message: "Profile not found"
            });
        }

        res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error("Profile error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to get profile",
            error: error.message
        });
    }
});

// ===============================
// CREATE SMM PROFILE
// ===============================

app.post("/api/profiles", async (req, res) => {
    try {
        const {
            name,
            instagram,
            phone,
            category,
            service,
            experience,
            price
        } = req.body;

        if (!name || !phone || !category || !service) {
            return res.status(400).json({
                success: false,
                message: "name, phone, category ва service ҳатмӣ мебошанд"
            });
        }

        const profile = await prisma.smm_profiles.create({
            data: {
                name,
                instagram: instagram || null,
                phone,
                category,
                service,
                experience: experience || null,
                price: price || null
            }
        });

        res.status(201).json({
            success: true,
            message: "Profile created successfully",
            data: profile
        });

    } catch (error) {
        console.error("Create profile error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create profile",
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

        // -------------------------------
        // VALIDATION
        // -------------------------------

        if (
            !name ||
            !surname ||
            !username ||
            !phone ||
            !email ||
            !password ||
            !confirmPassword
        ) {
            return res.status(400).json({
                success: false,
                message: "Лутфан ҳамаи майдонҳои ҳатмиро пур кунед"
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
                message: "Парол бояд ҳадди ақал 6 символ дошта бошад"
            });
        }

        // -------------------------------
        // SUPABASE AUTH REGISTER
        // -------------------------------

        const { data, error } = await supabase.auth.signUp({
            email: email.trim().toLowerCase(),
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

        // -------------------------------
        // SUPABASE ERROR
        // -------------------------------

        if (error) {
            console.error("Supabase register error:", error);

            return res.status(400).json({
                success: false,
                message: error.message
            });
        }

        // -------------------------------
        // SUCCESS
        // -------------------------------

        return res.status(201).json({
            success: true,
            message: data.session
                ? "Ҳисоб бомуваффақият сохта шуд"
                : "Ҳисоб сохта шуд. Email-и худро тасдиқ кунед.",
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
// SERVER
// ===============================

const server = app.listen(PORT, () => {
    console.log("");
    console.log("=================================");
    console.log("       SMM.TJ BACKEND");
    console.log("=================================");
    console.log(`Server:   http://localhost:${PORT}`);
    console.log(`API:      http://localhost:${PORT}/api`);
    console.log(`Database: /api/test/database`);
    console.log(`Profiles: /api/profiles`);
    console.log(`Register: /api/auth/register`);
    console.log("Status:   ONLINE");
    console.log("=================================");
    console.log("");
});

// ===============================
// GRACEFUL SHUTDOWN
// ===============================

process.on("SIGINT", async () => {
    console.log("\nStopping server...");

    await prisma.$disconnect();

    server.close(() => {
        console.log("Server stopped.");
        process.exit(0);
    });
});

process.on("SIGTERM", async () => {
    await prisma.$disconnect();

    server.close(() => {
        process.exit(0);
    });
});
