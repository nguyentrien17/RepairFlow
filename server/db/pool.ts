import mysql from 'mysql2/promise';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import path from 'path';
import { env } from '../config/env';
import * as schema from './schema';

export type DrizzleDB = MySql2Database<typeof schema>;
export type DbTransaction = Parameters<Parameters<DrizzleDB['transaction']>[0]>[0];
export type DbExecutor = DrizzleDB | DbTransaction;

let mysqlPool: mysql.Pool | null = null;
let drizzleInstance: DrizzleDB | null = null;
let isInitialized = false;

export const db: DrizzleDB = new Proxy({} as DrizzleDB, {
  get(_target, prop, receiver) {
    if (!drizzleInstance) {
      throw new Error('[Database Error] Drizzle ORM chưa được khởi tạo. Hãy gọi await initDatabase() trước.');
    }
    const value = Reflect.get(drizzleInstance, prop, receiver);
    return typeof value === 'function' ? value.bind(drizzleInstance) : value;
  },
});

export function getDatabaseStatus() {
  return {
    engine: 'mysql (Drizzle ORM)',
    isMySQL: true,
    host: env.DB_HOST,
    port: env.DB_PORT,
    database: env.DB_NAME,
    user: env.DB_USER,
    connected: isInitialized,
  };
}

/**
 * ACID Transaction Wrapper using Drizzle ORM native transaction with automatic deadlock retry (P1-4, Item H)
 */
export async function withTransaction<T>(fn: (tx: DbTransaction) => Promise<T>, maxRetries = 2): Promise<T> {
  if (!isInitialized || !drizzleInstance) {
    await initDatabase();
  }
  let attempt = 0;
  while (true) {
    try {
      return await drizzleInstance!.transaction(async (tx) => {
        return fn(tx);
      });
    } catch (err: any) {
      const isDeadlock =
        err?.code === 'ER_LOCK_DEADLOCK' ||
        err?.errno === 1213 ||
        err?.cause?.code === 'ER_LOCK_DEADLOCK' ||
        err?.cause?.errno === 1213;
      if (isDeadlock && attempt < maxRetries) {
        attempt++;
        await new Promise((r) => setTimeout(r, 30 * attempt));
        continue;
      }
      throw err;
    }
  }
}

/**
 * Initialize MySQL Pool + Drizzle ORM and run official Drizzle Kit migrations from server/db/migrations
 */
export async function initDatabase(): Promise<void> {
  if (isInitialized && drizzleInstance) return;

  const tempConn = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    connectTimeout: 5000,
  });
  await tempConn.query(
    `CREATE DATABASE IF NOT EXISTS \`${env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await tempConn.end();

  mysqlPool = mysql.createPool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4',
  });

  drizzleInstance = drizzle(mysqlPool, { schema, mode: 'default' });

  const migrationsFolder = path.resolve(process.cwd(), 'server', 'db', 'migrations');
  await migrate(drizzleInstance, { migrationsFolder });

  isInitialized = true;
}

export async function closeDatabase(): Promise<void> {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
  drizzleInstance = null;
  isInitialized = false;
}
