// Application bootstrap, Loads environment variables, connects the database, and starts the HTTP server.
require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 3000;

// Startup sequence
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[core] Server running on port ${PORT} — ${process.env.NODE_ENV}`);
  });
});