import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { StoreSettings } from '../../types';
import { Settings, Save, Building, QrCode } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings>(() => StorageService.getSettings());
  const { showToast } = useToast();

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveSettings(settings);
    showToast('Đã lưu cấu hình cửa hàng thành công!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
              <label className="block font-semibold text-slate-700 mb-1">Tên cửa hàng / Trung tâm *</label>
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
              <label className="block font-semibold text-slate-700 mb-1">Hotline liên hệ *</label>
              <input
                type="text"
                required
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">Địa chỉ cửa hàng *</label>
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
              <label className="block font-semibold text-slate-700 mb-1">Tên ngân hàng *</label>
              <input
                type="text"
                required
                value={settings.bank_name}
                onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Số tài khoản nhận tiền *</label>
              <input
                type="text"
                required
                value={settings.bank_account_no}
                onChange={(e) => setSettings({ ...settings, bank_account_no: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-indigo-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên chủ tài khoản (In hoa không dấu) *</label>
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
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" /> Lưu thay đổi cấu hình
          </button>
        </div>
      </form>
    </div>
  );
};
