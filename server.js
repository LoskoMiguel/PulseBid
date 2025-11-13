import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import authRoutes from "./src/routes/auth.js";
import productRoutes from "./src/routes/productRoutes.js";
import auctionRoutes from "./src/routes/auctionRoutes.js";
import redis from "./db/redis.js";
import socketHandlers from "./src/sockets/index.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, { cors: { origin: "*" } });

app.use(express.json());

app.use((req, res, next) => {
  req.io = io;
  next();
});
socketHandlers(io);

app.use("/auth", authRoutes);

app.use("/products", productRoutes);

app.use("/auctions", auctionRoutes);

httpServer.listen(3000, () => console.log("Servidor en http://localhost:3000"));