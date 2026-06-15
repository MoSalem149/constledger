// protect: verifies JWT from httpOnly cookie and attaches req.user
// authorize: restricts route to specific roles
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token)
    return res.status(401).json({ message: 'Not authorized — no token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

export const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: `Role '${req.user.role}' is not allowed` });
  next();
};