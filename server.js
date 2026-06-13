const express = require("express");
const path = require("path");

const app = express();

// 1. Middleware: Saltarse advertencias de túneles (por si acaso)
app.use((req, res, next) => {
    res.setHeader("Bypass-Tunnel-Reminder", "true");
    next();
});

// 2. Servir archivos estáticos
// Esto permite que el navegador encuentre tu CSS, JS e imágenes
app.use(express.static(path.join(__dirname, "public")));

// 3. Rutas de navegación
// Ruta para el Login (página inicial)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "vistas", "login.html"));
});

// Ruta para el Chat
// Nota: Usamos "/chat" para que el servidor busque el archivo en la carpeta correcta
app.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, "vistas", "chat.html"));
});

// 4. Configuración del puerto
// Railway asigna automáticamente una variable de entorno llamada PORT.
// Si no existe (estás en tu PC), usará el 3000.
const PUERTO = process.env.PORT || 3000;

app.listen(PUERTO, '0.0.0.0', () => {
    console.log("==================================================");
    console.log(`🚀 SERVIDOR EN LÍNEA EN EL PUERTO: ${PUERTO}`);
    console.log("==================================================");
});