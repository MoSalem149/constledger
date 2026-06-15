// Application bootstrap, Loads environment variables, connects the database, and starts the HTTP server.
import 'dotenv/config';

import app from './app.js';
import connectDB from './config/database.js';

const PORT = process.env.PORT || 3000;

// Startup sequence
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[core] Server running on port ${PORT} — ${process.env.NODE_ENV}`);
  });
});