import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/asyncHandler';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/requireRole';
import { listAuditLogs } from './audit.service';

export const auditRouter = Router();

// Only Admin and Manager can view system audit logs; no POST route is exposed to client (P1-7)
auditRouter.get(
  '/',
  requireAuth,
  requireRole('admin', 'manager'),
  asyncHandler(async (req: Request, res: Response) => {
    const logs = await listAuditLogs({
      q: typeof req.query.q === 'string' ? req.query.q : undefined,
      action: typeof req.query.action === 'string' ? req.query.action : undefined,
      entity_type: typeof req.query.entity_type === 'string' ? req.query.entity_type : undefined,
      limit: req.query.limit ? Number(req.query.limit) : 200,
      offset: req.query.offset ? Number(req.query.offset) : 0,
    });
    res.json(logs);
  })
);

