import { loginHandler } from "./test.js";

export default function socketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`🟢 Cliente conectado: ${socket.id}`);

    loginHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`🔴 Cliente desconectado: ${socket.id}`);
    });
  });
}