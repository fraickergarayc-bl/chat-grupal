const socket = io();

let username = "";

/* LOGIN */
function joinChat() {
  const inputUser = document.getElementById("username");
  username = inputUser.value.trim();

  if (username === "") return;

  document.getElementById("login").style.display = "none";
  document.getElementById("app").style.display = "flex";

  socket.emit("join", username);

  // activar ENTER
  const inputMsg = document.getElementById("input");

  inputMsg.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
}

/* ENVIAR MENSAJE */
function sendMessage() {
  const input = document.getElementById("input");
  const msg = input.value.trim();

  if (msg === "") return;

  socket.emit("message", msg);
  input.value = "";
}

/* RECIBIR MENSAJES */
socket.on("message", (data) => {
  const div = document.createElement("div");

  div.classList.add("message");
  div.classList.add(data.user === username ? "me" : "other");

  div.innerHTML = `
    <div class="msg-user">${data.user}</div>
    <div>${data.text}</div>
    <div class="msg-time">${data.time}</div>
  `;

  const container = document.getElementById("messages");
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
});

/* USUARIOS EN LÍNEA */
socket.on("users", (users) => {
  const list = document.getElementById("userList");
  list.innerHTML = "";

  users.forEach(user => {
    const li = document.createElement("li");
    li.textContent = "🟢 " + user;
    list.appendChild(li);
  });
});