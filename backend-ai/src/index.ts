import 'dotenv/config';
import app from './app';
import { connectDatabase } from './config/database';

const PORT = parseInt(process.env.PORT || '5000', 10);

// Connect to Mongo first so the first request never races an unready connection.
// Any failure here is treated as fatal — exit so the container is restarted.
async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`[ai] Service running on port ${PORT} — ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('[ai] Startup failed:', (err as Error).message);
    process.exit(1);
  }
}

bootstrap();
