import { initDatabase } from '../pool.js';
import { seedDevelopmentData } from './dev.seed.js';

async function main() {
  await initDatabase();
  await seedDevelopmentData();
  console.log('✅ Hoàn tất khởi tạo và nạp dữ liệu mẫu SQL.');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Lỗi khi chạy seed:', err);
  process.exit(1);
});

