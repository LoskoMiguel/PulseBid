import express from 'express';
import upload from '../middleware/upload.js';
import { createProduct } from '../controllers/productController.js';

const router = express.Router();

router.post(
  '/create_product',
  upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'file', maxCount: 1 },
  ]),
  createProduct
);

export default router;
