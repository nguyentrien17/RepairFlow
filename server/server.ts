import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import app from './app';
import { env } from './config/env';
import { initDatabase, getDatabaseStatus } from './db/pool';
import { seedDevelopmentData } from './db/seeds/dev.seed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  try {
    console.log('⏳ Đang khởi tạo kết nối cơ sở dữ liệu MySQL qua Drizzle ORM...');
    await initDatabase();

    // Issue #1: Only auto-seed development data when ENABLE_DEV_TOOLS is explicitly enabled
    if (env.ENABLE_DEV_TOOLS) {
      await seedDevelopmentData();
    }

    // P2-8: Serve static frontend build in production
    const distPath = path.resolve(__dirname, '../dist');
    if (env.NODE_ENV === 'production' || fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
          next();
          return;
        }
        const indexPath = path.join(distPath, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          next();
        }
      });
    }

    const dbInfo = getDatabaseStatus();
    app.listen(env.PORT, () => {
      console.log('====================================================');
      console.log(`🚀 RepairFlow Backend API đang chạy tại: http://localhost:${env.PORT}`);
      console.log(`🗄️  ORM & Database: ${dbInfo.engine} (${dbInfo.host}:${dbInfo.port}/${dbInfo.database})`);
      console.log(`🔒 Chế độ môi trường: ${env.NODE_ENV} (Dev Tools: ${env.ENABLE_DEV_TOOLS ? 'ON' : 'OFF'})`);
      console.log(`🔗 Health Check: http://localhost:${env.PORT}/api/health`);
      console.log('====================================================');
    });
  } catch (error) {
    console.error('❌ Lỗi khởi động Backend Server (Kiểm tra cấu hình .env & kết nối MySQL):', error);
    process.exit(1);
  }
}

startServer();
