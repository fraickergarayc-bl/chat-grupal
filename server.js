const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public"));

let users = [];

/* CONEXIÓN */
io.on("connection", (socket) => {

  socket.on("join", (username) => {
    socket.username = username;
    users.push(username);

    // lista actualizada
    io.emit("users", users);

    io.emit("message", {
      user: "Sistema",
      text: `${username} se unió al chat`,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on("message", (msg) => {
    io.emit("message", {
      user: socket.username,
      text: msg,
      time: new Date().toLocaleTimeString()
    });
  });

  socket.on("disconnect", () => {
    users = users.filter(u => u !== socket.username);

    io.emit("users", users);

    io.emit("message", {
      user: "Sistema",
      text: `${socket.username} salió del chat`,
      time: new Date().toLocaleTimeString()
    });
  });

});

const PORT = process.env.PORT || 3000;

http.listen(PORT, () => {
  console.log("Servidor corriendo en puerto " + PORT);
});