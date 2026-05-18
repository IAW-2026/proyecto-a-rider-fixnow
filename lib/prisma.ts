import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL in .env");
}

const prismaClientSingleton = () => {
  // 1. Creamos el Pool de conexiones nativo de Postgres
  const pool = new Pool({ connectionString });

  // 2. Se lo pasamos al adaptador oficial de Prisma
  const adapter = new PrismaPg(pool);

  // 3. Inicializamos Prisma pasándole las Opciones (lo que pedía el error en rojo)
  return new PrismaClient({ adapter });
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

export const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
