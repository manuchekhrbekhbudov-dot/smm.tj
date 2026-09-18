"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const supabase = require("./lib/supabase");

const app = express();

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
// SUPABASE TEST
// ===============================

app.get("/api/test/supabase", async (req, res) => {
    try {
        const { data, error } = await supabase
            .from("smm_profiles")
            .select("id,name")
            .limit(3);

        if (error) {
            return res.status(500).json({
                success: false,
                message: "Supabase query error",
                error: error.message
            });
        }

        res.json({
            success: true,
            message: "Supabase connected",
            data
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server error",
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
    console.log(`Server: http://localhost:${PORT}`);
    console.log(`API:    http://localhost:${PORT}/api`);
    console.log(`Test:   http://localhost:${PORT}/api/test/supabase`);
    console.log("Status: ONLINE");
    console.log("=================================");
    console.log("");
});
