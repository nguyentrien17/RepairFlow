import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { getDatabaseStatus, initDatabase } from './db/pool';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './utils/AppError';
import { requireAuth } from './middleware/auth';
import { requireRole } from './middleware/requireRole';
import { asyncHandler } from './middleware/asyncHandler';
import { seedDevelopmentData } from './db/seeds/dev.seed';

// Routers
import { authRouter } from './modules/auth/auth.routes';
import { usersRouter } from './modules/users/users.routes';
import { settingsRouter } from './modules/settings/settings.routes';
import { customersRouter, devicesRouter, catalogRouter } from './modules/customers/customers.routes';
import { promotionsRouter } from './modules/promotions/promotions.routes';
import { partsRouter, batchesRouter, suppliersRouter, partUsagesRouter } from './modules/inventory/inventory.routes';
import {
  ticketsRouter,
  statusHistoriesRouter,
  diagnosticsRouter,
  quotesRouter,
  checklistsRouter,
} from './modules/tickets/tickets.routes';
import { paymentsRouter, webhooksRouter, devWebhookRouter } from './modules/payments/payments.routes';
import { warrantiesRouter } from './modules/warranties/warranties.routes';
import { salesRouter } from './modules/sales/sales.routes';
import { reportsRouter } from './modules/reports/reports.routes';
import { auditRouter } from './modules/audit/audit.routes';
import { publicRouter } from './modules/public/public.routes';
import { bootstrapRouter } from './modules/bootstrap/bootstrap.routes';

const app = express();

// Trust first reverse proxy (Nginx / Cloudflare) so req.ip reflects real client IP for rate limiting & audit logs
app.set('trust proxy', 1);

// P0-1 & P2-8: CORS configured with explicit origin & credentials
const allowedOrigins = new Set([
  env.APP_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  `http://localhost:${env.PORT}`,
  `http://127.0.0.1:${env.PORT}`,
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
      } else {
        callback(new AppError(403, 'CORS_FORBIDDEN', `Origin ${origin} không được phép truy cập API.`));
      }
    },
    credentials: true,
  })
);

// Security headers (Helmet-style lightweight headers)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Issue #5: Capture exact raw body bytes for Payment Webhook HMAC verification
app.use(
  express.json({
    limit: '1mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf.toString('utf8');
    },
  })
);

// Health check & DB status
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    ...getDatabaseStatus(),
    env: env.NODE_ENV,
    devToolsEnabled: env.ENABLE_DEV_TOOLS,
    timestamp: new Date().toISOString(),
  });
});

app.post(
  '/api/health/reconnect-mysql',
  requireAuth,
  asyncHandler(async (_req, res) => {
    await initDatabase();
    res.json({
      status: 'ok',
      ...getDatabaseStatus(),
    });
  })
);

// Public & Webhook endpoints (no staff session required)
app.use('/api/auth', authRouter);
app.use('/api/public', publicRouter);
app.use('/api/webhooks', webhooksRouter);

// Authenticated staff endpoints
app.use('/api/bootstrap', bootstrapRouter);
app.use('/api/users', usersRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/devices', devicesRouter);
app.use('/api', catalogRouter);
app.use('/api/promotions', promotionsRouter);
app.use('/api/parts', partsRouter);
app.use('/api/batches', batchesRouter);
app.use('/api/suppliers', suppliersRouter);
app.use('/api/part-usages', partUsagesRouter);
app.use('/api/tickets', ticketsRouter);
app.use('/api/status-histories', statusHistoriesRouter);
app.use('/api/histories', statusHistoriesRouter);
app.use('/api/diagnostics', diagnosticsRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/checklists', checklistsRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/dev', devWebhookRouter);
app.use('/api/warranties', warrantiesRouter);
app.use('/api/retail-orders', salesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/audit-logs', auditRouter);

// Dev-only sample reset endpoint (Admin only AND strictly requires env.ENABLE_DEV_TOOLS === true, Issue #1)
app.post(
  '/api/reset',
  requireAuth,
  requireRole('admin'),
  asyncHandler(async (_req, res) => {
    if (!env.ENABLE_DEV_TOOLS) {
      throw AppError.forbidden('Chức năng reset dữ liệu mẫu chỉ được bật khi ENABLE_DEV_TOOLS=true trên môi trường Dev.');
    }
    await seedDevelopmentData(true);
    res.json({ ok: true, message: 'Đã khôi phục dữ liệu mẫu MySQL (Drizzle ORM) thành công.' });
  })
);

// 404 handler for unknown /api/* endpoints
app.use('/api/*', (req, _res, next) => {
  next(AppError.notFound(`Không tìm thấy API endpoint: ${req.method} ${req.originalUrl}`));
});

// Central error handler (P0-5 & P2-2)
app.use(errorHandler);

export default app;
