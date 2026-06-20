import "dotenv/config";

import app from "./app.js";
import connectDB from "./config/database.js";

const PORT = process.env.PORT || 3000;

// Connect to MongoDB before accepting traffic — if the DB is unreachable
// connectDB() calls process.exit(1) and the server never starts.
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(
      `[core] Server running on port ${PORT} — ${process.env.NODE_ENV}`,
    );
  });
});
