import { and, desc, eq, like, or, SQL } from 'drizzle-orm';
import { db, DbExecutor } from '../../db/pool';
import { auditLogs } from '../../db/schema';
import { sanitizeLogDetails } from '../../utils/crypto';
import { mapAuditLogRow } from '../../utils/mapRow';
import { AuditLog } from '../../../shared/types';

export interface CreateAuditLogInput {
  userId?: number | null;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  ipAddress?: string | null;
}

/**
 * Server-only Audit Logger using Drizzle ORM (P1-7, P0-3)
 * Can run inside an active Drizzle transaction or standalone.
 */
export async function recordAuditLog(
  tx: DbExecutor | null,
  input: CreateAuditLogInput
): Promise<void> {
  const safeDetails = sanitizeLogDetails(input.details);
  const now = new Date().toISOString();
  const executor = tx || db;

  await executor.insert(auditLogs).values({
    user_id: input.userId ?? null,
    user_name: input.userName || 'Hệ thống',
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    details: safeDetails,
    ip_address: input.ipAddress || '127.0.0.1',
    created_at: now,
  });
}

export async function listAuditLogs(filters?: {
  q?: string;
  action?: string;
  entity_type?: string;
  limit?: number;
  offset?: number;
}): Promise<AuditLog[]> {
  const conditions: SQL[] = [];

  if (filters?.action) {
    conditions.push(eq(auditLogs.action, filters.action));
  }
  if (filters?.entity_type) {
    conditions.push(eq(auditLogs.entity_type, filters.entity_type));
  }
  if (filters?.q) {
    const pattern = `%${filters.q}%`;
    const searchCond = or(
      like(auditLogs.user_name, pattern),
      like(auditLogs.entity_id, pattern),
      like(auditLogs.details, pattern)
    );
    if (searchCond) conditions.push(searchCond);
  }

  const limit = Math.min(Math.max(Number(filters?.limit || 200), 1), 500);
  const offset = Math.max(Number(filters?.offset || 0), 0);

  const queryBuilder = db
    .select()
    .from(auditLogs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(auditLogs.id))
    .limit(limit)
    .offset(offset);

  const rows = await queryBuilder;
  return rows.map(mapAuditLogRow);
}
