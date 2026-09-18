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
