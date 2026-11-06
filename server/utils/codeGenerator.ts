import { sql } from 'drizzle-orm';
import { DbExecutor } from '../db/pool';

/**
 * Returns YYYYMMDD in Asia/Ho_Chi_Minh timezone (P1-2)
 */
export function getVietnamDateString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date).replace(/-/g, '');
}

/**
 * Returns YYYY-MM-DD in Asia/Ho_Chi_Minh timezone
 */
export function getVietnamIsoDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/**
 * Generates collision-free & deadlock-free daily or global sequence codes inside a Drizzle transaction (Issue #8).
 * Uses atomic MySQL:
 *   INSERT INTO code_sequences (prefix, date_str, last_no) VALUES (?, ?, 1)
 *   ON DUPLICATE KEY UPDATE last_no = LAST_INSERT_ID(last_no + 1)
 * Avoids gap-lock deadlocks when two concurrent requests arrive on the first ticket of the day.
 */
export async function nextSequenceCode(
  tx: DbExecutor,
  prefix: string,
  padLength = 4,
  includeDate = true
): Promise<string> {
  const cleanPrefix = prefix.trim().toUpperCase();
  const dateKey = includeDate ? getVietnamDateString() : 'GLOBAL';

  const [upsertHeader] = (await tx.execute(
    sql`INSERT INTO code_sequences (prefix, date_str, last_no)
        VALUES (${cleanPrefix}, ${dateKey}, 1)
        ON DUPLICATE KEY UPDATE last_no = LAST_INSERT_ID(last_no + 1)`
  )) as unknown as [{ affectedRows: number; insertId: number }, any];

  let nextNo = 1;
  if (Number(upsertHeader?.insertId) > 0) {
    nextNo = Number(upsertHeader.insertId);
  }

  const seqPart = String(nextNo).padStart(padLength, '0');
  return includeDate ? `${cleanPrefix}-${dateKey}-${seqPart}` : `${cleanPrefix}-${seqPart}`;
}
