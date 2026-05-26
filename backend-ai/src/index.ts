import dotenv from 'dotenv';
dotenv.config();
import app from './app';
import { connectDB } from './config/database';

const PORT = parseInt(process.env.PORT || '5000', 10);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[ai] Service running on port ${PORT} — ${process.env.NODE_ENV}`);
  });
});
