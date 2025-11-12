import { prisma } from '../../db/db.js';
import { authenticateToken } from '../middleware/jwt.js';

export const createAuction = [authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId;
      const { start_price, product_id, duration_time } = req.body;

      if (!start_price || !product_id || !duration_time) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // verify that the product exists and belongs to the user
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

      res.status(201).json({
        message: 'Auction created successfully',
        auction,
      });
    } catch (error) {
      console.error('Error creating auction:', error);
      res.status(500).json({ error: 'Error creating auction' });
    }
  },
];