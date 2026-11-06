import { eq, sql } from 'drizzle-orm';
import { DbExecutor } from '../../db/pool';
import { users } from '../../db/schema';

/**
 * Revokes every JWT previously issued to this user by bumping users.token_version.
 * requireAuth rejects any token whose `tv` claim no longer matches. Returns the new version.
 */
export async function revokeUserSessions(executor: DbExecutor, userId: number): Promise<number> {
  await executor
    .update(users)
    .set({ token_version: sql`${users.token_version} + 1` })
    .where(eq(users.id, userId));

  const [row] = await executor
    .select({ token_version: users.token_version })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return Number(row?.token_version || 0);
}
