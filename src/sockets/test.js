export function loginHandler(io, socket) {
  console.log("Handler login cargado!");

  socket.on("login_test", (data) => {
    console.log("Servidor recibió login_test:", data);
    socket.emit("Usuario Logeado", { ok: true });
  });
}