const express = require("express");
const path = require("path");

const app = express();

// Middleware para saltarse advertencias
app.use((req, res, next) => {
    res.setHeader("Bypass-Tunnel-Reminder", "true");
    next();
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Rutas de navegación
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "vistas", "login.html"));
});

app.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, "vistas", "chat.html"));
});

// Ping para Cron-job
app.get("/ping", (req, res) => {
    res.status(200).send("OK");
});

// CONFIGURACIÓN ÚNICA DEL PUERTO
const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, '0.0.0.0', () => {
    console.log(`🚀 SERVIDOR EN LÍNEA EN EL PUERTO: ${PUERTO}`);
});