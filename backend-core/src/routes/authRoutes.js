import { Router } from "express";
import { login, logout, me } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Public — credential exchange for a JWT cookie
router.post("/login", login);

// Authenticated — clear the cookie, return current user
router.post("/logout", protect, logout);
router.get("/me", protect, me);

export default router;
