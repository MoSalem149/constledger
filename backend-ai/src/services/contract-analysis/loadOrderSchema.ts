import fs from 'fs';
import path from 'path';

let cached: string | null = null;

/** Loads OrderSchema.md from contract-analysis/assets (next to this module). */
export function loadOrderSchema(): string {
  if (cached) return cached;

  const candidates = [
    path.join(__dirname, 'assets', 'OrderSchema.md'),
    path.join(process.cwd(), 'src', 'services', 'contract-analysis', 'assets', 'OrderSchema.md'),
  ];

  const schemaPath = candidates.find((p) => fs.existsSync(p));
  if (!schemaPath) {
    throw new Error(
      'OrderSchema.md not found. Expected at src/services/contract-analysis/assets/OrderSchema.md',
    );
  }

  cached = fs.readFileSync(schemaPath, 'utf8');
  return cached;
}
