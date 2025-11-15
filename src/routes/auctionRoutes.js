import express from 'express';
import { createAuction } from '../controllers/auctionController.js';
import { showAuctions } from '../controllers/auctionController.js';
import { verifyAuction } from '../controllers/auctionController.js';
import { getBidHistory } from '../controllers/auctionController.js';

const router = express.Router();

router.post('/create_auctions', createAuction);
router.get('/showAuctions', showAuctions);
router.get('/verifyAuction/:id', verifyAuction);
router.get('/:id/bids', getBidHistory);

export default router;