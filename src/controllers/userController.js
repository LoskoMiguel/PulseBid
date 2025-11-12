import { prisma } from '../../db/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const register = async (req, res) => {
  const { name, email, password, confirm_password } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  if (existingUser) {
    return res.status(400).json({ error: 'Email already exists' });
  }


   if (!name || !email || !password || !confirm_password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

   if (password.length < 8) {
     return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

   if (name.length < 3) {
     return res.status(400).json({ error: 'Name must be at least 3 characters long' });
  }

   if (password !== confirm_password) {
     return res.status(400).json({ error: 'Passwords do not match' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password : hashedPassword,
      },
    });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const emailTrimmed = String(email).trim();

  try {
    const user = await prisma.user.findUnique({
      where: { email: emailTrimmed },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(200).json({ user, token });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
}