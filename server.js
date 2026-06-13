const express = require("express");
const path = require("path");

const app = express();

// TRUCO: Saltarse la pantalla de advertencia de LocalTunnel automáticamente
app.use((req, res, next) => {
  res.setHeader("Bypass-Tunnel-Reminder", "true");
  next();
});

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, "public")));

// Rutas de la aplicación
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "vistas/login.html"));
});

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "vistas/chat.html"));
});

// CONFIGURACIÓN DE PUERTO ÚNICA Y VALIDA:
// Usa el puerto automático del servidor en la nube o el 3000 si estás en tu PC
const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, () => {
    console.log("==================================================");
    console.log(`🚀 ¡TU SERVIDOR YA ESTÁ ENCIENDIDO!`);
    console.log(`👉 Tu enlace local es: http://localhost:${PUERTO}`);
    console.log("==================================================");
});