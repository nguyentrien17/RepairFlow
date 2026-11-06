import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import http from 'node:http';
import { eq } from 'drizzle-orm';
import { validateBody } from '../middleware/validate.ts';
import { createRateLimiter } from '../middleware/rateLimit.ts';
import { requireRole } from '../middleware/requireRole.ts';
import { isTransitionAllowedForRole } from '../../shared/statusTransitions.ts';
import {
  hashPassword,
  verifyPassword,
  encryptDevicePassword,
  decryptDevicePassword,
  verifyWebhookSignature,
  signJwt,
} from '../utils/crypto.ts';
import * as schema from '../db/schema.ts';
import { db, initDatabase, closeDatabase, withTransaction } from '../db/pool.ts';
import { seedDevelopmentData } from '../db/seeds/dev.seed.ts';
import { nextSequenceCode } from '../utils/codeGenerator.ts';
import app from '../app.ts';
import { env, parseTrustProxy } from '../config/env.ts';

function runMiddleware(
  mw: any,
  body: Record<string, any>,
  ip = '127.0.0.1',
  user?: any
): Promise<{ nextCalled: boolean; err?: any; body: Record<string, any> }> {
  return new Promise((resolve) => {
    const req: any = { body: { ...body }, ip, params: {}, user, socket: { remoteAddress: ip } };
    const res: any = {};
    mw(req, res, (err?: any) => {
      resolve({ nextCalled: !err, err, body: req.body });
    });
  });
}

test('validateBody parses strict booleans accurately ("false" -> false, "true" -> true)', async () => {
  const mw = validateBody({
    is_active: { type: 'boolean', required: true },
    return_to_stock: { type: 'boolean' },
  });

  const resFalse = await runMiddleware(mw, { is_active: 'false', return_to_stock: '0' });
  assert.equal(resFalse.nextCalled, true);
  assert.equal(resFalse.body.is_active, false);
  assert.equal(resFalse.body.return_to_stock, false);

  const resTrue = await runMiddleware(mw, { is_active: 'true', return_to_stock: 1 });
  assert.equal(resTrue.nextCalled, true);
  assert.equal(resTrue.body.is_active, true);
  assert.equal(resTrue.body.return_to_stock, true);

  const resInvalid = await runMiddleware(mw, { is_active: 'not_a_bool' });
  assert.equal(resInvalid.nextCalled, false);
  assert.equal(resInvalid.err?.code, 'VALIDATION_ERROR');
});

test('isTransitionAllowedForRole enforces strict workflow transitions and role permissions', () => {
  // Normal transition Received -> Diagnosing allowed for technician/receptionist
  assert.equal(isTransitionAllowedForRole('Received', 'Diagnosing', 'technician', false).allowed, true);
  assert.equal(isTransitionAllowedForRole('Received', 'Diagnosing', 'receptionist', false).allowed, true);

  // Skipping stages Received -> Delivered without override is blocked even for admin
  assert.equal(isTransitionAllowedForRole('Received', 'Delivered', 'admin', false).allowed, false);
  assert.equal(isTransitionAllowedForRole('Received', 'Delivered', 'technician', true).allowed, false);

  // Admin/Manager with explicit override can jump stages
  assert.equal(isTransitionAllowedForRole('Received', 'Delivered', 'admin', true).allowed, true);
  assert.equal(isTransitionAllowedForRole('Received', 'Delivered', 'manager', true).allowed, true);

  // Terminal state Delivered cannot transition without override
  assert.equal(isTransitionAllowedForRole('Delivered', 'In_Progress', 'receptionist', false).allowed, false);
});

test('requireRole enforces RBAC for admin/manager-only operations (warranties, custom items, refunds)', async () => {
  const adminManagerOnly = requireRole('admin', 'manager');

  const techRes = await runMiddleware(adminManagerOnly, {}, '127.0.0.1', { sub: 4, role: 'technician' });
  assert.equal(techRes.nextCalled, false);
  assert.equal(techRes.err?.status, 403);

  const recRes = await runMiddleware(adminManagerOnly, {}, '127.0.0.1', { sub: 3, role: 'receptionist' });
  assert.equal(recRes.nextCalled, false);
  assert.equal(recRes.err?.status, 403);

  const mgrRes = await runMiddleware(adminManagerOnly, {}, '127.0.0.1', { sub: 2, role: 'manager' });
  assert.equal(mgrRes.nextCalled, true);

  const admRes = await runMiddleware(adminManagerOnly, {}, '127.0.0.1', { sub: 1, role: 'admin' });
  assert.equal(admRes.nextCalled, true);
});

test('scrypt password hashing, AES-256-GCM device password encryption, and raw-body webhook HMAC', () => {
  const rawPass = 'StrongPass@2026!';
  const hashed = hashPassword(rawPass);
  assert.equal(hashed.startsWith('scrypt$'), true);
  assert.equal(verifyPassword(rawPass, hashed), true);
  assert.equal(verifyPassword('WrongPass@2026!', hashed), false);

  const pin = '135790';
  const encrypted = encryptDevicePassword(pin);
  assert.ok(encrypted);
  assert.equal(encrypted.startsWith('AES256GCM:'), true);
  assert.notEqual(encrypted, pin);
  assert.equal(decryptDevicePassword(encrypted), pin);

  // Verify raw-body HMAC signature verification preserves exact JSON formatting
  const rawBody = '{ "amount": 500000,   "content": "SC-20261106-0001" }';
  const secret = 'webhook_secret_test_key';
  const validHmac = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  assert.equal(verifyWebhookSignature(rawBody, `sha256=${validHmac}`, secret), true);
  assert.equal(verifyWebhookSignature(JSON.stringify(JSON.parse(rawBody)), `sha256=${validHmac}`, secret), false);
});

test('parseTrustProxy defaults to false, accepts hop counts / addresses, and rejects "true"', () => {
  assert.equal(parseTrustProxy(undefined), false);
  assert.equal(parseTrustProxy(''), false);
  assert.equal(parseTrustProxy('false'), false);
  assert.equal(parseTrustProxy('0'), false);
  assert.equal(parseTrustProxy('1'), 1);
  assert.equal(parseTrustProxy('loopback'), 'loopback');
  assert.equal(parseTrustProxy('10.0.0.0/8, 172.16.0.5'), '10.0.0.0/8, 172.16.0.5');
  assert.throws(() => parseTrustProxy('true'));
  assert.throws(() => parseTrustProxy('1; rm -rf'));
});

test('createRateLimiter blocks requests exceeding max within window', async () => {
  const limiter = createRateLimiter({
    namespace: 'test_rate_limit',
    windowMs: 60_000,
    max: 2,
    message: 'Rate limit exceeded',
  });

  const r1 = await runMiddleware(limiter, {}, '10.0.0.5');
  assert.equal(r1.nextCalled, true);

  const r2 = await runMiddleware(limiter, {}, '10.0.0.5');
  assert.equal(r2.nextCalled, true);

  const r3 = await runMiddleware(limiter, {}, '10.0.0.5');
  assert.equal(r3.nextCalled, false);
  assert.equal(r3.err?.status, 429);
  assert.equal(r3.err?.code, 'TOO_MANY_REQUESTS');
});

test('Drizzle MySQL schema exports all required tables', () => {
  const expectedTables = [
    'codeSequences',
    'storeSettings',
    'users',
    'customers',
    'deviceCategories',
    'deviceBrands',
    'customerDevices',
    'suppliers',
    'parts',
    'inventoryBatches',
    'promotions',
    'repairTickets',
    'repairStatusHistories',
    'repairDiagnostics',
    'repairQuotes',
    'repairQuoteItems',
    'qcChecklists',
    'repairPartUsages',
    'payments',
    'warranties',
    'retailSaleOrders',
    'retailSaleOrderItems',
    'auditLogs',
  ];

  for (const tableKey of expectedTables) {
    assert.ok((schema as any)[tableKey], `Missing Drizzle table export: ${tableKey}`);
  }
});

// Helper to send HTTP requests against an active http.Server instance
async function apiRequest(
  baseUrl: string,
  method: string,
  path: string,
  options: {
    token?: string;
    body?: any;
    rawBody?: string;
    headers?: Record<string, string>;
  } = {}
): Promise<{ status: number; data: any; headers: Headers }> {
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };
  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }
  let payload: string | undefined;
  if (options.rawBody !== undefined) {
    payload = options.rawBody;
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  } else if (options.body !== undefined) {
    payload = JSON.stringify(options.body);
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: payload,
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, headers: res.headers };
}

test('End-to-end MySQL & Express API Integration Suite (Items B, C, D, E, G, H, I, J)', async (t) => {
  // SAFETY GUARD: the integration suite calls seedDevelopmentData(true), which DELETES every table.
  // Only run against a dedicated test database (NODE_ENV=test AND DB_NAME ending with "_test").
  if (env.NODE_ENV !== 'test' || !/_test$/i.test(env.DB_NAME)) {
    t.skip(
      `Skipping live MySQL integration tests: requires NODE_ENV=test and DB_NAME ending with "_test" (current: NODE_ENV=${env.NODE_ENV}, DB_NAME=${env.DB_NAME}).`
    );
    return;
  }

  let dbReady = false;
  try {
    await initDatabase();
    await seedDevelopmentData(true);
    dbReady = true;
  } catch (err: any) {
    await closeDatabase().catch(() => {});
    t.skip(`Skipping live MySQL integration tests (${err?.code || err?.message || 'MySQL unreachable'})`);
    return;
  }

  // The test client connects over loopback and simulates distinct client IPs via X-Forwarded-For,
  // exactly like an Nginx running on the same host (TRUST_PROXY=loopback).
  app.set('trust proxy', 'loopback');
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const addr = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${addr.port}`;

  // Everything after the server starts lives inside try/finally so a setup failure can never leave
  // the HTTP server or MySQL pool open (which previously made `npm test` hang forever).
  try {
    const tokenFor = async (username: string) => {
      const [u] = await db.select().from(schema.users).where(eq(schema.users.username, username)).limit(1);
      assert.ok(u, `Seed user "${username}" not found`);
      return {
        user: u,
        token: signJwt({
          id: u.id,
          username: u.username,
          full_name: u.full_name,
          role: u.role as any,
          token_version: Number(u.token_version || 0),
        }),
      };
    };
    const { token: adminToken } = await tokenFor('admin');
    const { token: managerToken } = await tokenFor('manager');
    const { token: recToken } = await tokenFor('letan');
    const { user: techUser, token: techToken } = await tokenFor('kythuat');

    await t.test('1. Parallel code generation on first day produces unique sequential codes without deadlock', async () => {
      const [c1, c2] = await Promise.all([
        withTransaction((tx) => nextSequenceCode(tx, 'TESTP')),
        withTransaction((tx) => nextSequenceCode(tx, 'TESTP')),
      ]);
      assert.notEqual(c1, c2);
    });

    await t.test('2. Technician sending discount_amount receives 403; locked account token immediately receives 401', async () => {
      const [firstTicket] = await db.select().from(schema.repairTickets).limit(1);
      const discountAttempt = await apiRequest(baseUrl, 'PUT', `/api/tickets/${firstTicket.id}`, {
        token: techToken,
        body: { discount_amount: 100000 },
      });
      assert.equal(discountAttempt.status, 403);

      // Lock tech_nam temporarily and verify existing token is rejected with 401
      await db.update(schema.users).set({ is_active: 0 }).where(eq(schema.users.id, techUser.id));
      const lockedAttempt = await apiRequest(baseUrl, 'GET', '/api/tickets', { token: techToken });
      assert.equal(lockedAttempt.status, 401);
      await db.update(schema.users).set({ is_active: 1 }).where(eq(schema.users.id, techUser.id));
    });

    await t.test('3. Inventory FIFO deduction & 409 on insufficient stock without mutating stock', async () => {
      const partRes = await apiRequest(baseUrl, 'POST', '/api/parts', {
        token: managerToken,
        body: {
          sku: `FIFO-${Date.now()}`,
          name: 'Màn hình Test FIFO',
          category: 'Màn hình',
          cost_price: 500000,
          selling_price: 800000,
          stock_quantity: 2,
          min_stock_level: 1,
        },
      });
      assert.equal(partRes.status, 201);
      const partId = partRes.data.id;

      // Add a second batch of 3 units
      const batch2Res = await apiRequest(baseUrl, 'POST', '/api/batches', {
        token: managerToken,
        body: {
          part_id: partId,
          import_quantity: 3,
          cost_price: 520000,
          selling_price: 850000,
        },
      });
      assert.equal(batch2Res.status, 201);

      // Overflow attempt (requesting 10 when total stock is 5) -> 409 Conflict
      const [ticket] = await db.select().from(schema.repairTickets).limit(1);
      const overflowRes = await apiRequest(baseUrl, 'POST', '/api/part-usages', {
        token: techToken,
        body: {
          ticket_id: ticket.id,
          part_id: partId,
          quantity: 10,
        },
      });
      assert.equal(overflowRes.status, 409);

      const [partAfterOverflow] = await db.select().from(schema.parts).where(eq(schema.parts.id, partId));
      assert.equal(partAfterOverflow.stock_quantity, 5);

      // Export 3 units across batches without specifying batch_id -> FIFO depletes batch 1 (2 units) + 1 unit from batch 2
      const fifoExport = await apiRequest(baseUrl, 'POST', '/api/part-usages', {
        token: techToken,
        body: {
          ticket_id: ticket.id,
          part_id: partId,
          quantity: 3,
        },
      });
      assert.equal(fifoExport.status, 201);

      const [partAfterFifo] = await db.select().from(schema.parts).where(eq(schema.parts.id, partId));
      assert.equal(partAfterFifo.stock_quantity, 2);
    });

    await t.test('4. Quote lifecycle (Item E): POST /quotes does not overwrite ticket financials or consume promo until Approved; marks old Sent quotes Superseded', async () => {
      const [cust] = await db.select().from(schema.customers).limit(1);
      const [dev] = await db.select().from(schema.customerDevices).where(eq(schema.customerDevices.customer_id, cust.id)).limit(1);

      const createTicketRes = await apiRequest(baseUrl, 'POST', '/api/tickets', {
        token: recToken,
        body: {
          customer_id: cust.id,
          device_id: dev.id,
          defect_description: 'Test báo giá Item E',
        },
      });
      assert.equal(createTicketRes.status, 201);
      const ticketId = createTicketRes.data.id;

      // Quote v1
      const q1Res = await apiRequest(baseUrl, 'POST', '/api/quotes', {
        token: recToken,
        body: {
          ticket_id: ticketId,
          items: [{ item_type: 'service', name: 'Thay cáp nguồn', quantity: 1, unit_price: 400000, warranty_months: 3 }],
        },
      });
      assert.equal(q1Res.status, 201);
      assert.equal(q1Res.data.version, 1);
      assert.equal(q1Res.data.status, 'Sent');

      // Ticket final_amount must still be 0 before customer approves
      const [ticketBeforeApprove] = await db.select().from(schema.repairTickets).where(eq(schema.repairTickets.id, ticketId));
      assert.equal(Number(ticketBeforeApprove.final_amount), 0);

      // Quote v2 supersedes Quote v1
      const q2Res = await apiRequest(baseUrl, 'POST', '/api/quotes', {
        token: recToken,
        body: {
          ticket_id: ticketId,
          items: [{ item_type: 'service', name: 'Thay cáp nguồn + vệ sinh', quantity: 1, unit_price: 500000, warranty_months: 6 }],
        },
      });
      assert.equal(q2Res.status, 201);
      assert.equal(q2Res.data.version, 2);

      const [q1Row] = await db.select().from(schema.repairQuotes).where(eq(schema.repairQuotes.id, q1Res.data.id));
      assert.equal(q1Row.status, 'Superseded');

      // Approve Quote v2 -> updates ticket final_amount to 500,000 and status to In_Progress
      const approveRes = await apiRequest(baseUrl, 'PUT', `/api/quotes/${q2Res.data.id}/status`, {
        token: recToken,
        body: { status: 'Approved' },
      });
      assert.equal(approveRes.status, 200);

      const [ticketAfterApprove] = await db.select().from(schema.repairTickets).where(eq(schema.repairTickets.id, ticketId));
      assert.equal(Number(ticketAfterApprove.final_amount), 500000);
      assert.equal(ticketAfterApprove.status, 'In_Progress');

      // Online rejection: ticket is cancelled but NO refund payment is auto-recorded (cashier refunds later)
      const rejTicketRes = await apiRequest(baseUrl, 'POST', '/api/tickets', {
        token: recToken,
        body: { customer_id: cust.id, device_id: dev.id, defect_description: 'Test khách từ chối online' },
      });
      const rejTicketId = rejTicketRes.data.id;
      await apiRequest(baseUrl, 'POST', '/api/payments', {
        token: recToken,
        body: { ticket_id: rejTicketId, amount: 50000, payment_method: 'Cash', payment_type: 'Deposit' },
      });
      const rejQuote = await apiRequest(baseUrl, 'POST', '/api/quotes', {
        token: recToken,
        body: { ticket_id: rejTicketId, items: [{ name: 'Thay màn hình', quantity: 1, unit_price: 2000000 }] },
      });
      const custPhoneLast4 = String(cust.phone).replace(/\D/g, '').slice(-4);
      const rejectRes = await apiRequest(baseUrl, 'POST', `/api/public/quotes/${rejQuote.data.id}/respond`, {
        body: { action: 'Reject', reason: 'Giá cao', phone: custPhoneLast4 },
        headers: { 'X-Forwarded-For': '198.51.100.40' },
      });
      assert.equal(rejectRes.status, 200);
      const [rejTicketAfter] = await db.select().from(schema.repairTickets).where(eq(schema.repairTickets.id, rejTicketId));
      assert.equal(rejTicketAfter.status, 'Cancelled');
      assert.equal(Number(rejTicketAfter.paid_amount), 50000);
      const rejRefunds = await db.select().from(schema.payments).where(eq(schema.payments.ticket_id, rejTicketId));
      assert.equal(rejRefunds.filter((p) => p.payment_type === 'Refund').length, 0);
    });

    await t.test('5. Concurrent payments & manual payment verification lock (Item D) & webhook idempotency/HMAC', async () => {
      const [cust] = await db.select().from(schema.customers).limit(1);
      const [dev] = await db.select().from(schema.customerDevices).where(eq(schema.customerDevices.customer_id, cust.id)).limit(1);

      const tRes = await apiRequest(baseUrl, 'POST', '/api/tickets', {
        token: recToken,
        body: { customer_id: cust.id, device_id: dev.id, defect_description: 'Test thanh toán đồng thời' },
      });
      const ticketId = tRes.data.id;
      const ticketCode = tRes.data.ticket_code;

      const qRes = await apiRequest(baseUrl, 'POST', '/api/quotes', {
        token: recToken,
        body: {
          ticket_id: ticketId,
          items: [{ item_type: 'service', name: 'Sửa main', quantity: 1, unit_price: 1000000, warranty_months: 3 }],
        },
      });
      await apiRequest(baseUrl, 'PUT', `/api/quotes/${qRes.data.id}/status`, {
        token: recToken,
        body: { status: 'Approved' },
      });

      // Fire 2 concurrent payments of 300,000 each; client tries to spoof is_auto_verified: true
      const [p1, p2] = await Promise.all([
        apiRequest(baseUrl, 'POST', '/api/payments', {
          token: recToken,
          body: {
            ticket_id: ticketId,
            amount: 300000,
            payment_method: 'Cash',
            type: 'Repair_Payment',
            is_auto_verified: true,
            gateway_provider: 'sepay',
          },
        }),
        apiRequest(baseUrl, 'POST', '/api/payments', {
          token: recToken,
          body: {
            ticket_id: ticketId,
            amount: 300000,
            payment_method: 'Bank_Transfer',
            type: 'Repair_Payment',
            is_auto_verified: true,
          },
        }),
      ]);
      assert.equal(p1.status, 201);
      assert.equal(p2.status, 201);
      // Item D: manual payment never sets is_auto_verified = true
      assert.equal(Boolean(p1.data.is_auto_verified), false);
      const [p1Row] = await db.select().from(schema.payments).where(eq(schema.payments.id, p1.data.id));
      assert.equal(Number(p1Row.is_auto_verified), 0);
      assert.equal(p1Row.gateway_provider, null);

      const [updatedTicket] = await db.select().from(schema.repairTickets).where(eq(schema.repairTickets.id, ticketId));
      assert.equal(Number(updatedTicket.paid_amount), 600000);
      assert.equal(Number(updatedTicket.debt_amount), 400000);

      // Enable webhook with secret and test invalid HMAC (401) + duplicate transaction_ref idempotency
      const webhookSecret = 'integration_test_webhook_secret';
      await db
        .update(schema.storeSettings)
        .set({ auto_payment_enabled: 1, gateway_webhook_secret: webhookSecret })
        .where(eq(schema.storeSettings.id, 1));

      const rawWebhook = JSON.stringify({
        transaction_ref: `TX-IDEMP-${Date.now()}`,
        amount: 400000,
        content: `Thanh toan ${ticketCode}`,
      });

      const badSigRes = await apiRequest(baseUrl, 'POST', '/api/webhooks/payment/sepay', {
        rawBody: rawWebhook,
        headers: { 'x-webhook-signature': 'sha256=invalid_sig' },
      });
      assert.equal(badSigRes.status, 401);

      const validSig = crypto.createHmac('sha256', webhookSecret).update(rawWebhook).digest('hex');
      const wh1 = await apiRequest(baseUrl, 'POST', '/api/webhooks/payment/sepay', {
        rawBody: rawWebhook,
        headers: { 'x-webhook-signature': `sha256=${validSig}` },
      });
      assert.equal(wh1.status, 200);
      assert.equal(wh1.data.processed, true);
      assert.equal(wh1.data.matched, true);
      assert.equal(wh1.data.duplicate, false);

      const wh2 = await apiRequest(baseUrl, 'POST', '/api/webhooks/payment/sepay', {
        rawBody: rawWebhook,
        headers: { 'x-webhook-signature': `sha256=${validSig}` },
      });
      assert.equal(wh2.status, 200);
      assert.equal(wh2.data.duplicate, true);

      const [paidTicket] = await db.select().from(schema.repairTickets).where(eq(schema.repairTickets.id, ticketId));
      assert.equal(Number(paidTicket.paid_amount), 1000000);
      assert.equal(Number(paidTicket.debt_amount), 0);

      // Webhook whose memo has no ticket code -> processed:false AND recorded for manual reconciliation
      const orphanRef = `TX-ORPHAN-${Date.now()}`;
      const rawOrphan = JSON.stringify({ transaction_ref: orphanRef, amount: 99000, content: 'chuyen tien khong ghi ma' });
      const orphanSig = crypto.createHmac('sha256', webhookSecret).update(rawOrphan).digest('hex');
      const orphanRes = await apiRequest(baseUrl, 'POST', '/api/webhooks/payment/sepay', {
        rawBody: rawOrphan,
        headers: { 'x-webhook-signature': orphanSig },
      });
      assert.equal(orphanRes.status, 200);
      assert.equal(orphanRes.data.processed, false);
      const orphanLogs = await db.select().from(schema.auditLogs).where(eq(schema.auditLogs.entity_id, orphanRef));
      assert.equal(orphanLogs.length, 1);
      assert.equal(orphanLogs[0].action, 'WEBHOOK_UNMATCHED');

      // Negative amount spoofing (amount < 0 with a non-Refund type) is rejected
      const negativeRes = await apiRequest(baseUrl, 'POST', '/api/payments', {
        token: recToken,
        body: { ticket_id: ticketId, amount: -500000, payment_method: 'Cash', payment_type: 'Final' },
      });
      assert.equal(negativeRes.status, 400);

      // Unknown payment_type is rejected
      const badTypeRes = await apiRequest(baseUrl, 'POST', '/api/payments', {
        token: recToken,
        body: { ticket_id: ticketId, amount: 1000, payment_method: 'Cash', payment_type: 'Bonus' },
      });
      assert.equal(badTypeRes.status, 400);
    });

    await t.test('6. Delivery preconditions, atomic warranty creation (Item C), and partial refund on Cancel (Item I)', async () => {
      const [cust] = await db.select().from(schema.customers).limit(1);
      const [dev] = await db.select().from(schema.customerDevices).where(eq(schema.customerDevices.customer_id, cust.id)).limit(1);

      const tRes = await apiRequest(baseUrl, 'POST', '/api/tickets', {
        token: recToken,
        body: { customer_id: cust.id, device_id: dev.id, defect_description: 'Test bàn giao & bảo hành nguyên tử' },
      });
      const ticketId = tRes.data.id;

      // Quote + Approve (200,000)
      const qRes = await apiRequest(baseUrl, 'POST', '/api/quotes', {
        token: recToken,
        body: {
          ticket_id: ticketId,
          items: [{ item_type: 'service', name: 'Thay loa trong', quantity: 1, unit_price: 200000, warranty_months: 3 }],
        },
      });
      await apiRequest(baseUrl, 'PUT', `/api/quotes/${qRes.data.id}/status`, {
        token: recToken,
        body: { status: 'Approved' },
      });

      // In_Progress -> Quality_Check (technician)
      const qcStageRes = await apiRequest(baseUrl, 'POST', `/api/tickets/${ticketId}/transition`, {
        token: techToken,
        body: { to_status: 'Quality_Check' },
      });
      assert.equal(qcStageRes.status, 200);

      // Attempting to transition to Ready_For_Pickup without a passing QC checklist -> 400
      const noQcRes = await apiRequest(baseUrl, 'POST', `/api/tickets/${ticketId}/transition`, {
        token: techToken,
        body: { to_status: 'Ready_For_Pickup' },
      });
      assert.equal(noQcRes.status, 400);

      // Submit passing QC checklist -> move to Ready_For_Pickup
      const qcSave = await apiRequest(baseUrl, 'POST', '/api/checklists', {
        token: techToken,
        body: {
          ticket_id: ticketId,
          items: [{ id: '1', title: 'Loa nghe rõ', passed: true }],
        },
      });
      assert.equal(qcSave.status, 200);
      const readyRes = await apiRequest(baseUrl, 'POST', `/api/tickets/${ticketId}/transition`, {
        token: techToken,
        body: { to_status: 'Ready_For_Pickup' },
      });
      assert.equal(readyRes.status, 200);

      // Attempting to Deliver while unpaid (debt = 200,000) -> 400 and NO warranty created
      const unpaidDeliver = await apiRequest(baseUrl, 'POST', `/api/tickets/${ticketId}/transition`, {
        token: recToken,
        body: { to_status: 'Delivered', warranty_days: 90 },
      });
      assert.equal(unpaidDeliver.status, 400);
      const warrantiesBefore = await db.select().from(schema.warranties).where(eq(schema.warranties.ticket_id, ticketId));
      assert.equal(warrantiesBefore.length, 0);

      // Pay full 200,000 and Deliver -> atomically creates Active warranty
      await apiRequest(baseUrl, 'POST', '/api/payments', {
        token: recToken,
        body: { ticket_id: ticketId, amount: 200000, payment_method: 'Cash', type: 'Repair_Payment' },
      });
      const deliverRes = await apiRequest(baseUrl, 'POST', `/api/tickets/${ticketId}/transition`, {
        token: recToken,
        body: { to_status: 'Delivered', warranty_days: 120 },
      });
      assert.equal(deliverRes.status, 200);
      assert.ok(deliverRes.data.warranty);
      assert.equal(deliverRes.data.warranty.status, 'Active');

      // Receptionist can no longer create warranties manually -> 403
      const recWarranty = await apiRequest(baseUrl, 'POST', '/api/warranties', {
        token: recToken,
        body: { ticket_id: ticketId, start_date: '2026-01-01', end_date: '2027-12-31' },
      });
      assert.equal(recWarranty.status, 403);

      // Duplicate POST /warranties for same ticket -> 409 Conflict
      const dupWarranty = await apiRequest(baseUrl, 'POST', '/api/warranties', {
        token: adminToken,
        body: {
          ticket_id: ticketId,
          start_date: '2026-01-01',
          end_date: '2027-12-31',
        },
      });
      assert.equal(dupWarranty.status, 409);

      // Item I: Partial refund on Cancel (retaining inspection fee)
      const tCancelRes = await apiRequest(baseUrl, 'POST', '/api/tickets', {
        token: recToken,
        body: { customer_id: cust.id, device_id: dev.id, defect_description: 'Test hủy phiếu giữ phí kiểm tra' },
      });
      const cancelTicketId = tCancelRes.data.id;
      const depositRes = await apiRequest(baseUrl, 'POST', '/api/payments', {
        token: recToken,
        body: { ticket_id: cancelTicketId, amount: 150000, payment_method: 'Bank_Transfer', payment_type: 'Deposit' },
      });
      assert.equal(depositRes.status, 201);
      const cancelRes = await apiRequest(baseUrl, 'POST', `/api/tickets/${cancelTicketId}/transition`, {
        token: recToken,
        body: { to_status: 'Cancelled', refund_amount: 100000, refund_method: 'Bank_Transfer', note: 'Khách hủy, thu 50k phí kiểm tra' },
      });
      assert.equal(cancelRes.status, 200);
      assert.equal(Number(cancelRes.data.paid_amount), 50000);
      assert.equal(Number(cancelRes.data.final_amount), 50000);
      assert.equal(Number(cancelRes.data.debt_amount), 0);

      // Technician cancelling (unrepairable) must NOT auto-record a cash refund
      const tTechCancel = await apiRequest(baseUrl, 'POST', '/api/tickets', {
        token: recToken,
        body: { customer_id: cust.id, device_id: dev.id, defect_description: 'Test KTV hủy phiếu' },
      });
      const techCancelId = tTechCancel.data.id;
      await apiRequest(baseUrl, 'POST', '/api/payments', {
        token: recToken,
        body: { ticket_id: techCancelId, amount: 100000, payment_method: 'Cash', payment_type: 'Deposit' },
      });
      const toDiag = await apiRequest(baseUrl, 'POST', `/api/tickets/${techCancelId}/transition`, {
        token: techToken,
        body: { to_status: 'Diagnosing' },
      });
      assert.equal(toDiag.status, 200);
      const techRefundAttempt = await apiRequest(baseUrl, 'POST', `/api/tickets/${techCancelId}/transition`, {
        token: techToken,
        body: { to_status: 'Cancelled', refund_amount: 100000, note: 'Cháy main' },
      });
      assert.equal(techRefundAttempt.status, 403);
      const techCancel = await apiRequest(baseUrl, 'POST', `/api/tickets/${techCancelId}/transition`, {
        token: techToken,
        body: { to_status: 'Cancelled', note: 'Cháy main' },
      });
      assert.equal(techCancel.status, 200);
      assert.equal(Number(techCancel.data.paid_amount), 100000);
      const techCancelRefunds = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.ticket_id, techCancelId));
      assert.equal(techCancelRefunds.filter((p) => p.payment_type === 'Refund').length, 0);

      // Cashier later records the actual refund on the cancelled ticket
      const cashierRefund = await apiRequest(baseUrl, 'POST', '/api/payments', {
        token: recToken,
        body: { ticket_id: techCancelId, amount: 100000, payment_method: 'Cash', payment_type: 'Refund' },
      });
      assert.equal(cashierRefund.status, 201);
      const [techCancelAfter] = await db.select().from(schema.repairTickets).where(eq(schema.repairTickets.id, techCancelId));
      assert.equal(Number(techCancelAfter.paid_amount), 0);
    });

    await t.test('7. Retail orders: custom item RBAC (Item B) & partial/full refund validation', async () => {
      // Receptionist attempting custom sale item -> 403
      const recCustomAttempt = await apiRequest(baseUrl, 'POST', '/api/retail-orders', {
        token: recToken,
        body: {
          items: [{ item_type: 'custom', product_name: 'Dán PPF tự nhập', quantity: 1, unit_price: 150000 }],
          payment_method: 'Cash',
          paid_amount: 150000,
        },
      });
      assert.equal(recCustomAttempt.status, 403);

      // Manager creating custom sale item -> 201 and logs CUSTOM_SALE_ITEM
      const mgrCustomRes = await apiRequest(baseUrl, 'POST', '/api/retail-orders', {
        token: managerToken,
        body: {
          items: [{ item_type: 'custom', product_name: 'Dán PPF tự nhập', quantity: 1, unit_price: 200000 }],
          payment_method: 'Cash',
          paid_amount: 200000,
        },
      });
      assert.equal(mgrCustomRes.status, 201);
      const orderId = mgrCustomRes.data.id;

      // Refunding more than paid_amount (e.g. 300,000 > 200,000) -> 400
      const overRefund = await apiRequest(baseUrl, 'POST', `/api/retail-orders/${orderId}/refund`, {
        token: managerToken,
        body: { refund_amount: 300000, reason: 'Hoàn vượt số thu' },
      });
      assert.equal(overRefund.status, 400);

      // Partial refund of 80,000 -> order stays Completed with refund_amount = 80,000
      const partialRefund = await apiRequest(baseUrl, 'POST', `/api/retail-orders/${orderId}/refund`, {
        token: managerToken,
        body: { refund_amount: 80000, reason: 'Hoàn một phần' },
      });
      assert.equal(partialRefund.status, 200);
      assert.equal(partialRefund.data.order_status, 'Completed');
      assert.equal(Number(partialRefund.data.refund_amount), 80000);

      // Refund remaining 120,000 -> order becomes Refunded
      const finalRefund = await apiRequest(baseUrl, 'POST', `/api/retail-orders/${orderId}/refund`, {
        token: managerToken,
        body: { refund_amount: 120000, reason: 'Hoàn phần còn lại' },
      });
      assert.equal(finalRefund.status, 200);
      assert.equal(finalRefund.data.order_status, 'Refunded');

      // Invalid numeric input (quantity "abc") -> 400 instead of inserting NaN
      const nanQty = await apiRequest(baseUrl, 'POST', '/api/retail-orders', {
        token: managerToken,
        body: {
          items: [{ item_type: 'custom', product_name: 'Ốp lưng', quantity: 'abc', unit_price: 50000 }],
          payment_method: 'Cash',
        },
      });
      assert.equal(nanQty.status, 400);
    });

    await t.test('8. Public ticket lookup rate limit (Item G): >8 valid lookups succeed, 8 wrong phone lookups trigger 429', async () => {
      const [ticket] = await db.select().from(schema.repairTickets).limit(1);
      const [cust] = await db.select().from(schema.customers).where(eq(schema.customers.id, ticket.customer_id));
      const last4 = cust.phone.replace(/\D/g, '').slice(-4);

      const lookupPath = `/api/public/tickets/${encodeURIComponent(ticket.ticket_code)}`;
      // Each phase uses its own client IP (app trusts 1 proxy hop) so the per-IP limiter (15/min) does not interfere
      const fromIp = (ip: string) => ({ headers: { 'X-Forwarded-For': ip } });
      const wrongPhone = last4 === '0000' ? '1111' : '0000';

      // 10 valid lookups with right phone digits -> all 200 OK (successes never count toward the lockout)
      for (let i = 0; i < 10; i++) {
        const okRes = await apiRequest(baseUrl, 'GET', `${lookupPath}?phone=${last4}`, fromIp('198.51.100.10'));
        assert.equal(okRes.status, 200);
      }

      // 8 failed lookups with wrong phone digits -> 404 (same response as unknown ticket), then the ticket is locked -> 429
      for (let i = 0; i < 8; i++) {
        const failRes = await apiRequest(baseUrl, 'GET', `${lookupPath}?phone=${wrongPhone}`, fromIp('198.51.100.20'));
        assert.equal(failRes.status, 404);
      }
      const blockedRes = await apiRequest(baseUrl, 'GET', `${lookupPath}?phone=${last4}`, fromIp('198.51.100.30'));
      assert.equal(blockedRes.status, 429);
    });

    await t.test('9. Session revocation (token_version), cookie attributes, health info disclosure & security headers', async () => {
      const freshToken = async (username: string) => (await tokenFor(username)).token;

      // Logout revokes the token server-side: replaying the same token afterwards -> 401 SESSION_REVOKED
      const tokenA = await freshToken('thungan');
      assert.equal((await apiRequest(baseUrl, 'GET', '/api/auth/me', { token: tokenA })).status, 200);
      const logoutRes = await apiRequest(baseUrl, 'POST', '/api/auth/logout', { token: tokenA });
      assert.equal(logoutRes.status, 200);
      const clearCookie = logoutRes.headers.get('set-cookie') || '';
      assert.match(clearCookie, /rf_token=;/);
      assert.match(clearCookie, /Max-Age=0/);
      assert.match(clearCookie, /SameSite=Lax/);
      const replay = await apiRequest(baseUrl, 'GET', '/api/auth/me', { token: tokenA });
      assert.equal(replay.status, 401);
      assert.equal(replay.data.error.code, 'SESSION_REVOKED');

      // Change password: old tokens die, the response re-issues a working cookie for this browser
      const tokenB = await freshToken('thungan');
      const changeRes = await apiRequest(baseUrl, 'POST', '/api/auth/change-password', {
        token: tokenB,
        body: { oldPassword: 'Thungan@123', newPassword: 'Thungan@456' },
      });
      assert.equal(changeRes.status, 200);
      const issuedCookie = changeRes.headers.get('set-cookie') || '';
      assert.match(issuedCookie, /HttpOnly/);
      assert.match(issuedCookie, /SameSite=Lax/);
      assert.match(issuedCookie, /Max-Age=604800/);
      assert.equal((await apiRequest(baseUrl, 'GET', '/api/auth/me', { token: tokenB })).status, 401);
      const reissuedToken = decodeURIComponent(/rf_token=([^;]+)/.exec(issuedCookie)![1]);
      assert.equal(
        (await apiRequest(baseUrl, 'GET', '/api/auth/me', { headers: { Cookie: `rf_token=${encodeURIComponent(reissuedToken)}` } })).status,
        200
      );

      // Admin changing a user's role revokes that user's existing sessions immediately
      const { user: cashier } = await tokenFor('thungan');
      const tokenC = await freshToken('thungan');
      const roleChange = await apiRequest(baseUrl, 'PUT', `/api/users/${cashier.id}`, {
        token: adminToken,
        body: { role: 'technician' },
      });
      assert.equal(roleChange.status, 200);
      assert.equal((await apiRequest(baseUrl, 'GET', '/api/auth/me', { token: tokenC })).status, 401);

      // Tokens without the tv claim (issued before token_version existed) are rejected
      const legacyPayload = Buffer.from(
        JSON.stringify({ sub: cashier.id, username: 'thungan', full_name: 'x', role: 'admin', iat: 0, exp: 9999999999 })
      ).toString('base64url');
      const legacyHeader = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const legacySig = crypto
        .createHmac('sha256', env.JWT_SECRET)
        .update(`${legacyHeader}.${legacyPayload}`)
        .digest('base64url');
      const legacyRes = await apiRequest(baseUrl, 'GET', '/api/auth/me', { token: `${legacyHeader}.${legacyPayload}.${legacySig}` });
      assert.equal(legacyRes.status, 401);

      // Public health check reveals no infrastructure details; details endpoint is admin-only
      const health = await apiRequest(baseUrl, 'GET', '/api/health');
      assert.equal(health.status, 200);
      for (const leakedKey of ['host', 'port', 'database', 'user', 'env', 'devToolsEnabled']) {
        assert.equal(leakedKey in health.data, false, `/api/health must not expose "${leakedKey}"`);
      }
      assert.equal((await apiRequest(baseUrl, 'GET', '/api/health/details', { token: recToken })).status, 403);
      assert.equal((await apiRequest(baseUrl, 'GET', '/api/health/details', { token: adminToken })).status, 200);
      assert.equal((await apiRequest(baseUrl, 'POST', '/api/health/reconnect-mysql', { token: recToken, body: {} })).status, 403);

      // Security headers
      const csp = health.headers.get('content-security-policy') || '';
      assert.match(csp, /script-src 'self'/);
      assert.match(csp, /frame-ancestors 'none'/);
      assert.equal(health.headers.get('x-frame-options'), 'DENY');

      // Cross-site browser request from an unknown origin is refused before reaching the handler (CSRF)
      const foreign = await apiRequest(baseUrl, 'POST', '/api/payments', {
        token: recToken,
        headers: { Origin: 'https://evil.example' },
        body: { ticket_id: 1, amount: 1000 },
      });
      assert.equal(foreign.status, 403);
      assert.equal(foreign.data.error.code, 'CORS_FORBIDDEN');
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (dbReady) {
      await closeDatabase();
    }
  }
});
