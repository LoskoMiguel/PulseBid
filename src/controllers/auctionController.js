import { prisma } from '../../db/db.js';
import { authenticateToken } from '../middleware/jwt.js';
import redis from '../../db/redis.js';
import agenda from '../jobs/agenda.js';

export const createAuction = [authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { start_price, product_id, start_date, end_date } = req.body;

    if (!start_price || !product_id || !start_date || !end_date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const product = await prisma.product.findUnique({
      where: { id: product_id },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.user_id !== userId) {
      return res.status(403).json({ error: 'You do not own this product' });
    }

    // parseamos la fecha para que tenga el formato correcto
    const parseDateTime = (input) => {
      const fixed = input.replace(" ", "T") + ":00-05:00";
      const date = new Date(fixed);
      return isNaN(date.getTime()) ? null : date;
    };

    const start_time = parseDateTime(start_date);
    const end_time = parseDateTime(end_date);

    if (!start_time || !end_time) {
      return res.status(400).json({ error: "Invalid start_date or end_date" });
    }

    if (start_time >= end_time) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const auction = await prisma.auction.create({
      data: {
        owner_id: userId,
        product_id: product_id,
        start_price: start_price,
        start_time: start_time,
        end_time: end_time,
        status: "waiting" // la subasta comienza en waiting y ya luego cuando sea la fecha y hora se cambia a active
      }
    });

    const { id, uuid } = auction;

    console.log("Nueva subasta creada con ID:", id);
    console.log("Guardando en Redis como: auction:" + id);

    await redis.hSet(`auction:${id}`, {
      current_price: start_price.toString(),
      start_price: start_price.toString(),
      current_winner: "",
      status: "waiting", // la subasta comienza en waiting y ya luego cuando sea la fecha y hora se cambia a active
    });

    // limpiamos cualquier puja previa asociada a esta subasta y programamos el job para iniciar la subasta
    await redis.del(`auction:${id}:bids`);
    await agenda.schedule(start_time, 'startAuction', { auctionId: id });
    // await agenda.schedule(end_time, 'endAuction', { auctionId: id });
    // console.log('Job para finalizar subasta programado en Agenda.');

    res.status(201).json({
      message: 'Auction created successfully',
      id
    });

  } catch (error) {
    console.error('Error creating auction:', error);
    res.status(500).json({ error: 'Error creating auction' });
  }
}];

export const showAuctions = async (req, res) => {
    try {
      const auctions = await prisma.auction.findMany({
        where: { status: 'active' },
        include: {
          product: true,
        },
      });
      res.json(auctions);
    } catch (error) {
      console.error('Error fetching auctions:', error);
      res.status(500).json({ error: 'Error fetching auctions' });
    }
  };

export const verifyAuction = [
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params;

      const auction = await prisma.auction.findUnique({
        where: { id },
        include: { product: true }
      });

      if (!auction) {
        return res.status(404).json({ error: 'Auction not found' });
      }

      res.json(auction);
    } catch (error) {
      console.error('Error verifying auction:', error);
      res.status(500).json({ error: 'Error verifying auction' });
    }
  },
];

export const getBidHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const bids = await redis.lRange(`auction:${id}:bids`, 0, -1);

    const parsed = bids.map(b => JSON.parse(b));

    res.json(parsed);

  } catch (error) {
    console.error('Error fetching bid history:', error);
    res.status(500).json({ error: 'Error fetching bid history' });
  }
};