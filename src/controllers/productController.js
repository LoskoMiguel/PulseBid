import { prisma } from '../../db/db.js';
import { authenticateToken } from '../middleware/jwt.js';
import cloudinary from '../utils/cloudinary.js';
import streamifier from 'streamifier';

export const createProduct = [authenticateToken, async (req, res) => {
    try {
      const userId = req.user.userId
      const { name, description } = req.body;
      const file = req.file ?? req.files?.image?.[0] ?? req.files?.file?.[0];

      if (!name || !description || !file) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto', folder: 'products' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          );
          streamifier.createReadStream(buffer).pipe(stream);
        });
      };

      const result = await streamUpload(file.buffer);

      const product = await prisma.product.create({
        data: {
          name,
          description,
          image_url: result.secure_url,
          user_id: userId,
        },
      });

      res.status(201).json({
        message: 'Product created successfully',
        product,
      });
    } catch (error) {
      console.error('Error creating product:', error);
      res.status(500).json({ error: 'Error creating product' });
    }
  },
];