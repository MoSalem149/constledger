import jwt from "jsonwebtoken";
import User from "../models/User.js";

const COOKIE_NAME = "token";

// Cookie hardening — httpOnly so JS can't read it, secure+sameSite=none in prod
// so the cookie can travel cross-site (e.g. Vercel frontend → API backend).
const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 8 * 60 * 60 * 1000,
};

const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "8h",
  });

// POST /api/auth/login — credential check + JWT issuance via httpOnly cookie
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required" });

    const user = await User.findOne({ email });

    // Same error for "user not found" and "wrong password" — avoid leaking
    // which emails exist (account enumeration).
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "Invalid credentials" });

    if (!user.isActive)
      return res.status(403).json({ message: "Account is deactivated" });

    const token = signToken(user);
    res.cookie(COOKIE_NAME, token, COOKIE_OPTS);
    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/logout — clears the auth cookie
export const logout = (_req, res) => {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "strict" });
  res.json({ message: "Logged out successfully" });
};

// GET /api/auth/me — returns the user attached by the protect middleware
export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};
