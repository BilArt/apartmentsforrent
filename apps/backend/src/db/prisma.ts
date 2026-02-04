import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString: string = (() => {
  const v = process.env.DATABASE_URL;
  if (typeof v !== 'string' || v.length === 0) {
    throw new Error('DATABASE_URL is not set');
  }
  return v;
})();

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
  log: ['error', 'warn'],
});

export async function prismaDisconnect(): Promise<void> {
  await prisma.$disconnect();
  await pool.end();
}
