import { prisma } from '../../db/db.js';
import { authenticateToken } from '../middleware/jwt.js';
import redis from '../../db/redis.js';

export const createAuction = [authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { start_price, product_id, duration_time } = req.body;

    if (!start_price || !product_id || !duration_time) {
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

    const start_time = new Date();
    const end_time = new Date(start_time.getTime() + duration_time * 60 * 1000);

    const auction = await prisma.auction.create({
      data: {
        owner_id: userId,
        product_id: product_id,
        start_price: start_price,
        start_time,
        end_time,
        status: "active"
      }
    });

    const { id, uuid } = auction;

    console.log("Nueva subasta creada con ID:", id);
    console.log("Guardando en Redis como: auction:" + id);

    await redis.hSet(`auction:${id}`, {
      current_price: start_price.toString(),
      start_price: start_price.toString(),
      current_winner: ""
    });

    await redis.del(`auction:${id}:bids`);

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