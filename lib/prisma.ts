// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Prevenim erorile dacă DATABASE_URL nu este definită
const connectionString = `${process.env.DATABASE_URL}`;

// Configurăm Pool-ul și Adaptorul
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

// Salvăm instanța global pentru a preveni epuizarea conexiunilor la hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}