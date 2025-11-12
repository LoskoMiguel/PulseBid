import express from 'express';
import { createAuction } from '../controllers/auctionController.js';

const router = express.Router();

router.post('/create_auctions', createAuction);

export default router;
