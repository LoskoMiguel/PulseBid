import { bidHandler } from "./bids.js";
import redis from "../../db/redis.js";

export default function socketHandlers(io) {
  io.on("connection", (socket) => {
    console.log(`🟢 Cliente conectado: ${socket.id}`);

    socket.on("join_auction", async (auctionId) => {
      auctionId = String(auctionId);

      const current = await redis.hGetAll(`auction:${auctionId}`);

      if (!current || Object.keys(current).length === 0) {
        return socket.emit("error", "Auction not found");
      }

      socket.join(`auction_${auctionId}`);

      socket.emit("auction_state", {
        current_price: Number(current.current_price),
        current_winner: current.current_winner
      });
    });

    bidHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`🔴 Cliente desconectado: ${socket.id}`);
    });
  });
}
