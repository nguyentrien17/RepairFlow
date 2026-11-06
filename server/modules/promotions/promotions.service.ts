import { eq, sql } from 'drizzle-orm';
import { DbExecutor } from '../../db/pool';
import { promotions } from '../../db/schema';
import { getVietnamIsoDate } from '../../utils/codeGenerator';
import { mapPromotionRow } from '../../utils/mapRow';
import { Promotion } from '../../../shared/types';
import { AppError } from '../../utils/AppError';

/**
 * Server-side Promotion Validation & Discount Calculation inside Drizzle Transaction (P1-3, Issue #10)
 * - Prevents double-incrementing usage_count if the same ticket already consumed `alreadyConsumedPromoId`.
 * - Releases the old promotion's usage_count if switching from a different `alreadyConsumedPromoId`.
 */
export async function validateAndCalculatePromotionInTx(
  tx: DbExecutor,
  code: string | undefined | null,
  subtotal: number,
  consume = false,
  alreadyConsumedPromoId?: number | null
): Promise<{
  promotion?: Promotion;
  discountAmount: number;
  promotionCode?: string;
  promotionId?: number;
}> {
  if (!code || !code.trim()) {
    if (consume && alreadyConsumedPromoId) {
      await releasePromotionUsageInTx(tx, alreadyConsumedPromoId);
    }
    return { discountAmount: 0 };
  }

  const cleanCode = code.trim().toUpperCase();
  const rows = await tx
    .select()
    .from(promotions)
    .where(sql`UPPER(${promotions.code}) = ${cleanCode}`)
    .for('update');

  if (rows.length === 0) {
    throw AppError.badRequest(`Mã ưu đãi "${cleanCode}" không tồn tại trên hệ thống.`);
  }

  const promo = mapPromotionRow(rows[0]);
  if (!promo.is_active) {
    throw AppError.badRequest(`Chương trình ưu đãi "${promo.code}" đang tạm ngưng áp dụng.`);
  }

  const today = getVietnamIsoDate();
  if (promo.start_date && today < promo.start_date) {
    throw AppError.badRequest(`Mã ưu đãi "${promo.code}" chỉ có hiệu lực từ ngày ${promo.start_date}.`);
  }
  if (promo.end_date && today > promo.end_date) {
    throw AppError.badRequest(`Mã ưu đãi "${promo.code}" đã hết hạn sử dụng (${promo.end_date}).`);
  }

  const isSamePromoAlreadyConsumed = Boolean(alreadyConsumedPromoId && Number(alreadyConsumedPromoId) === promo.id);

  if (!isSamePromoAlreadyConsumed && promo.usage_limit && promo.usage_count >= promo.usage_limit) {
    throw AppError.badRequest(`Chương trình ưu đãi "${promo.code}" đã hết lượt sử dụng quy định.`);
  }

  if (promo.min_order_amount && subtotal < promo.min_order_amount) {
    throw AppError.badRequest(
      `Đơn hàng tối thiểu ${promo.min_order_amount.toLocaleString('vi-VN')} đ mới được áp dụng mã ${promo.code}.`
    );
  }

  let calculated = 0;
  if (promo.discount_type === 'percentage') {
    calculated = Math.round((subtotal * promo.discount_value) / 100);
    if (promo.max_discount_amount && calculated > promo.max_discount_amount) {
      calculated = promo.max_discount_amount;
    }
  } else {
    calculated = promo.discount_value;
  }

  calculated = Math.min(Math.max(0, calculated), subtotal);

  if (consume) {
    if (alreadyConsumedPromoId && Number(alreadyConsumedPromoId) !== promo.id) {
      await releasePromotionUsageInTx(tx, alreadyConsumedPromoId);
    }
    if (!isSamePromoAlreadyConsumed) {
      await tx
        .update(promotions)
        .set({ usage_count: sql`${promotions.usage_count} + 1` })
        .where(eq(promotions.id, promo.id));
      promo.usage_count += 1;
    }
  }

  return {
    promotion: promo,
    discountAmount: calculated,
    promotionCode: promo.code,
    promotionId: promo.id,
  };
}

/**
 * Releases 1 usage count back to a promotion when a ticket is cancelled or a retail order is refunded (Issue #10)
 */
export async function releasePromotionUsageInTx(
  tx: DbExecutor,
  promotionId?: number | null
): Promise<void> {
  if (!promotionId) return;
  await tx
    .update(promotions)
    .set({
      usage_count: sql`GREATEST(0, ${promotions.usage_count} - 1)`,
    })
    .where(eq(promotions.id, Number(promotionId)));
}
