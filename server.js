const express = require("express");
const path = require("path");
const app = express();

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "vistas", "login.html"));
});

app.get("/chat", (req, res) => {
    res.sendFile(path.join(__dirname, "vistas", "chat.html"));
});

app.get("/ping", (req, res) => {
    res.status(200).send("OK");
});

const PUERTO = process.env.PORT || 3000;
app.listen(PUERTO, () => {
    console.log(`Servidor iniciado en puerto ${PUERTO}`);
});