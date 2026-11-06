import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { env } from '../config/env';

const EXPECTED_TABLES_0000 = [
  'audit_logs',
  'code_sequences',
  'customer_devices',
  'customers',
  'device_brands',
  'device_categories',
  'inventory_batches',
  'parts',
  'payments',
  'promotions',
  'qc_checklists',
  'repair_diagnostics',
  'repair_part_usages',
  'repair_quote_items',
  'repair_quotes',
  'repair_status_histories',
  'repair_tickets',
  'retail_sale_order_items',
  'retail_sale_orders',
  'store_settings',
  'suppliers',
  'users',
  'warranties',
];

export async function runBaseline(): Promise<void> {
  const migrationsFolder = path.resolve(process.cwd(), 'server', 'db', 'migrations');
  const journalPath = path.join(migrationsFolder, 'meta', '_journal.json');

  if (!fs.existsSync(journalPath)) {
    throw new Error(`Không tìm thấy file journal tại: ${journalPath}`);
  }

  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  const entry0000 = journal.entries?.find((e: any) => e.idx === 0 || String(e.tag).startsWith('0000_'));
  if (!entry0000) {
    throw new Error('Không tìm thấy bản ghi migration 0000 trong meta/_journal.json');
  }

  const sqlPath = path.join(migrationsFolder, `${entry0000.tag}.sql`);
  if (!fs.existsSync(sqlPath)) {
    throw new Error(`Không tìm thấy file SQL migration tại: ${sqlPath}`);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');
  const hash = crypto.createHash('sha256').update(sqlContent).digest('hex');
  const createdAt = Number(entry0000.when);

  const conn = await mysql.createConnection({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    connectTimeout: 5000,
  });

  try {
    const [tableRows] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT table_name AS tableName FROM information_schema.tables WHERE table_schema = ?`,
      [env.DB_NAME]
    );
    const existingTables = new Set(tableRows.map((r) => String(r.tableName || r.TABLE_NAME).toLowerCase()));

    const missingTables = EXPECTED_TABLES_0000.filter((t) => !existingTables.has(t));
    if (missingTables.length > 0) {
      throw new Error(
        `DB hiện tại chưa đủ bảng của migration 0000 (thiếu: ${missingTables.join(', ')}). Hãy chạy migrate() bình thường thay vì baseline.`
      );
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS \`__drizzle_migrations\` (
        \`id\` SERIAL PRIMARY KEY,
        \`hash\` text NOT NULL,
        \`created_at\` bigint
      )
    `);

    const [existingMigrations] = await conn.query<mysql.RowDataPacket[]>(
      `SELECT id, hash, created_at FROM \`__drizzle_migrations\` WHERE created_at = ? OR hash = ? LIMIT 1`,
      [createdAt, hash]
    );

    if (existingMigrations.length > 0) {
      console.log(`ℹ️  Baseline migration ${entry0000.tag} đã tồn tại trong __drizzle_migrations.`);
    } else {
      await conn.query(
        `INSERT INTO \`__drizzle_migrations\` (\`hash\`, \`created_at\`) VALUES (?, ?)`,
        [hash, createdAt]
      );
      console.log(`✅ Đã ghi nhận baseline migration ${entry0000.tag} (created_at=${createdAt}) vào __drizzle_migrations.`);
    }
  } finally {
    await conn.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  runBaseline().catch((err) => {
    console.error('❌ Baseline thất bại:', err.message || err);
    process.exit(1);
  });
}

