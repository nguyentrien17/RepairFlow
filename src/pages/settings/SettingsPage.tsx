import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { StoreSettings } from '../../types';
import { Settings, Save, Building, QrCode } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>(() => StorageService.getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const { showToast } = useToast();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await StorageService.saveSettingsAsync(settings);
      setSettings(updated);
      showToast('Đã lưu cấu hình cửa hàng thành công!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Không thể lưu cấu hình cửa hàng!', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Cấu hình thông tin cửa hàng & Mẫu in (UC-04, UC-33)</h2>
        <p className="text-xs text-slate-500 mt-0.5">Tùy chỉnh thông tin thương hiệu, tài khoản nhận chuyển khoản VietQR và điều khoản in phiếu.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Info */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Building className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">1. Nhận diện thương hiệu & Liên hệ</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Tên cửa hàng / Trung tâm <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Khẩu hiệu (Slogan)</label>
              <input
                type="text"
                value={settings.store_slogan}
                onChange={(e) => setSettings({ ...settings, store_slogan: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Hotline liên hệ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Địa chỉ cửa hàng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mã số thuế</label>
              <input
                type="text"
                value={settings.tax_number}
                onChange={(e) => setSettings({ ...settings, tax_number: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tiền tố mã phiếu sửa chữa</label>
              <input
                type="text"
                value={settings.ticket_prefix}
                onChange={(e) => setSettings({ ...settings, ticket_prefix: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Thời hạn bảo hành đổi trả mặc định (ngày) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={365}
                required
                value={settings.default_return_days ?? 15}
                onChange={(e) => setSettings({ ...settings, default_return_days: Math.max(0, parseInt(e.target.value) || 0) })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono text-indigo-700"
              />
            </div>
          </div>
        </div>

        {/* Bank & VietQR */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <QrCode className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">2. Tài khoản nhận thanh toán VietQR</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên ngân hàng <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.bank_name}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số tài khoản nhận tiền <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.bank_account_no}
                onChange={(e) => setSettings({ ...settings, bank_account_no: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-indigo-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tên chủ tài khoản (In hoa không dấu) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={settings.bank_account_name}
                onChange={(e) => setSettings({ ...settings, bank_account_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold uppercase"
              />
            </div>
          </div>
        </div>

        {/* Payment Gateway & SmartPOS Integration */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-sm">⚡</span>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">3. Tích hợp Cổng thanh toán tự động (Auto VietQR & SmartPOS)</h3>
                <p className="text-[11px] text-slate-500">Tự động nhận diện biến động số dư ngân hàng và đẩy lệnh thanh toán sang máy quẹt thẻ POS.</p>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-xs font-semibold text-slate-700">Kích hoạt tự động:</span>
              <input
                type="checkbox"
                checked={settings.auto_payment_enabled ?? true}
                onChange={(e) => setSettings({ ...settings, auto_payment_enabled: e.target.checked })}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Cổng nhận diện Chuyển khoản (Open Banking)</label>
              <select
                value={settings.payment_gateway_provider || 'sepay'}
                onChange={(e) => setSettings({ ...settings, payment_gateway_provider: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold text-slate-800"
              >
                <option value="sepay">SePAY (Khuyên dùng — Hỗ trợ 20+ ngân hàng VN)</option>
                <option value="payos">PayOS (Cổng thanh toán tự động)</option>
                <option value="casso">Casso.vn (Biến động số dư tự động)</option>
                <option value="direct_bank">Open API trực tiếp (VietinBank / MB / BIDV)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">API Key / Token Cổng thanh toán</label>
              <input
                type="password"
                placeholder="SP_LIVE_API_KEY_..."
                value={settings.gateway_api_key || ''}
                onChange={(e) => setSettings({ ...settings, gateway_api_key: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Webhook Secret Key (Bảo mật xác thực)</label>
              <input
                type="password"
                placeholder="whsec_..."
                value={settings.gateway_webhook_secret || ''}
                onChange={(e) => setSettings({ ...settings, gateway_webhook_secret: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">URL Webhook nhận dữ liệu (Cấu hình trên SePAY / Bank)</label>
              <input
                type="text"
                readOnly
                value="https://repairflow-app.vn/api/webhook/bank-transfer"
                className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl font-mono text-indigo-700 text-xs select-all cursor-copy"
                title="Sao chép URL này dán vào cấu hình Webhook trên trang quản trị SePAY/Casso"
              />
            </div>

            <div className="md:col-span-2 pt-2 border-t border-slate-100">
              <h4 className="font-bold text-slate-700 text-xs mb-2">Liên kết Máy quẹt thẻ SmartPOS tại quầy</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã định danh máy POS (Terminal ID) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: VNPAY_POS_Q1_01 hoặc MPOS_DEV_09"
                    value={settings.pos_terminal_id || 'VNPAY_POS_Q1_01'}
                    onChange={(e) => setSettings({ ...settings, pos_terminal_id: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Địa chỉ IP kết nối Socket LAN (Tùy chọn)</label>
                  <input
                    type="text"
                    placeholder="192.168.1.188:8080"
                    value={settings.pos_ip_address || '192.168.1.188:8080'}
                    onChange={(e) => setSettings({ ...settings, pos_ip_address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Terms for Print templates */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm pb-2 border-b border-slate-100">3. Điều khoản in trên phiếu tiếp nhận & bảo hành</h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Điều khoản phiếu tiếp nhận</label>
              <textarea
                rows={3}
                value={settings.terms_intake}
                onChange={(e) => setSettings({ ...settings, terms_intake: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Chính sách bảo hành sửa chữa</label>
              <textarea
                rows={3}
                value={settings.terms_warranty}
                onChange={(e) => setSettings({ ...settings, terms_warranty: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Đang lưu cấu hình...' : 'Lưu thay đổi cấu hình'}
          </button>
        </div>
      </form>
    </div>
  );
};
