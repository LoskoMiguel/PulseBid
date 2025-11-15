import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import authRoutes from "./src/routes/auth.js";
import productRoutes from "./src/routes/productRoutes.js";
import auctionRoutes from "./src/routes/auctionRoutes.js";
import redis from "./db/redis.js";
import socketHandlers from "./src/sockets/index.js";

const app = express();
const httpServer = createServer(app);

// CORS para socket.io
const io = new Server(httpServer, { 
  cors: { origin: "*" }
});

// CORS para Express (lo que te faltaba)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Pasar io a req
app.use((req, res, next) => {
  req.io = io;
  next();
});

socketHandlers(io);

// Rutas
app.use("/auth", authRoutes);
app.use("/products", productRoutes);
app.use("/auctions", auctionRoutes);

httpServer.listen(3000, () => 
  console.log("Servidor en http://localhost:3000")
);
