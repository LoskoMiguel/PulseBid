import redis from "../../db/redis.js";

export function bidHandler(io, socket) {

  socket.on("place_bid", async ({ auctionId, userId, amount }) => {

    auctionId = String(auctionId);

    const current = await redis.hGetAll(`auction:${auctionId}`);

    // Validar si existe la subasta en Redis
    if (Object.keys(current).length === 0) {
      return socket.emit("error", "Auction not found");
    }

    // validar si la subasta está activa
    if (current.status !== "active") {
      return socket.emit("error", "Auction is not active");
    }

    // Validar precio actual
    if (amount <= Number(current.current_price)) {
      return socket.emit("error", "Bid too low");
    }

    // Actualizar valores uno por uno
    await redis.hSet(`auction:${auctionId}`, "current_price", amount.toString());
    await redis.hSet(`auction:${auctionId}`, "current_winner", userId.toString());

    // Registro de puja
    const record = JSON.stringify({
      userId,
      amount,
      timestamp: Date.now()
    });

    await redis.lPush(`auction:${auctionId}:bids`, record);

    // Notificar a todos en la sala
    io.to(`auction_${auctionId}`).emit("new_bid", {
      userId,
      amount
    });
  });
}