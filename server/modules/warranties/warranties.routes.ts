import { Router } from 'express';
import { and, desc, eq } from 'drizzle-orm';
import { db, withTransaction } from '../../db/pool';
import { warranties, repairTickets } from '../../db/schema';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { AppError } from '../../utils/AppError';
import { mapWarrantyRow } from '../../utils/mapRow';
import { nextSequenceCode } from '../../utils/codeGenerator';
import { recordAuditLog } from '../audit/audit.service';

export const warrantiesRouter = Router();

warrantiesRouter.get(
  '/',
  requireAuth,
  asyncHandler(async (req, res) => {
    const ticketId = req.query.ticket_id ? Number(req.query.ticket_id) : null;
    const rows = ticketId
      ? await db.select().from(warranties).where(eq(warranties.ticket_id, ticketId)).orderBy(desc(warranties.id))
      : await db.select().from(warranties).orderBy(desc(warranties.id));
    res.json(rows.map(mapWarrantyRow));
  })
);

// Item C.2 & C.3: POST /api/warranties restricted to admin & manager (manual re-issue), requires ticket.status === 'Delivered' and max 1 Active warranty per ticket
warrantiesRouter.post(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req, res) => {
    const {
      ticket_id,
      ticket_code,
      device_summary,
      customer_name,
      customer_phone,
      start_date,
      end_date,
      terms,
      status,
    } = req.body || {};

    if (!ticket_id || !start_date || !end_date) {
      throw AppError.badRequest('Thiếu thông tin bắt buộc để kích hoạt bảo hành.');
    }

    const warranty = await withTransaction(async (tx) => {
      const [ticket] = await tx
        .select()
        .from(repairTickets)
        .where(eq(repairTickets.id, Number(ticket_id)))
        .for('update');
      if (!ticket) {
        throw AppError.notFound('Không tìm thấy phiếu sửa chữa để kích hoạt bảo hành.');
      }

      if (ticket.status !== 'Delivered') {
        throw AppError.badRequest(
          'Chỉ có thể cấp phiếu bảo hành cho phiếu sửa chữa đã hoàn tất bàn giao máy (Delivered).'
        );
      }

      const targetStatus = status === 'Expired' || status === 'Voided' ? status : 'Active';
      if (targetStatus === 'Active') {
        const existingActive = await tx
          .select()
          .from(warranties)
          .where(and(eq(warranties.ticket_id, ticket.id), eq(warranties.status, 'Active')))
          .for('update');
        if (existingActive.length > 0) {
          throw AppError.conflict(
            `Phiếu ${ticket.ticket_code} đã có phiếu bảo hành đang hiệu lực (${existingActive[0].warranty_code}).`
          );
        }
      }

      const warrantyCode = await nextSequenceCode(tx, 'BH', 4, true);
      const now = new Date().toISOString();

      const [resInsert] = await tx.insert(warranties).values({
        warranty_code: warrantyCode,
        ticket_id: ticket.id,
        ticket_code: ticket.ticket_code || ticket_code,
        device_summary: device_summary || `${ticket.device_brand || ''} ${ticket.device_model || ''}`.trim(),
        customer_name: ticket.customer_name || customer_name || 'Khách hàng',
        customer_phone: ticket.customer_phone || customer_phone || '',
        start_date,
        end_date,
        terms: terms || 'Bảo hành theo quy định cửa hàng.',
        status: targetStatus,
        created_at: now,
      });

      await recordAuditLog(tx, {
        userId: req.user!.sub,
        userName: req.user!.full_name,
        action: 'CREATE_WARRANTY',
        entityType: 'warranties',
        entityId: warrantyCode,
        details: `Cấp lại phiếu bảo hành ${warrantyCode} cho phiếu ${ticket.ticket_code}`,
        ipAddress: req.ip,
      });

      const [created] = await tx
        .select()
        .from(warranties)
        .where(eq(warranties.id, Number(resInsert.insertId)))
        .limit(1);
      return mapWarrantyRow(created);
    });

    res.status(201).json(warranty);
  })
);
