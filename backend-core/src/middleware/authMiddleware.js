import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// protect — verifies the JWT from the httpOnly `token` cookie and attaches
// the user document (sans password) to req.user. Used by every authenticated route.
export const protect = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token)
    return res.status(401).json({ message: 'Not authorized — no token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    // Token still valid but the user was deleted — reject
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

// authorize(...roles) — role gate. Must run after `protect` so req.user is set.
export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: `Role '${req.user.role}' is not allowed` });
  next();
};
