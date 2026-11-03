import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { RepairTicket, Customer, CustomerDevice, RepairPriority } from '../../types';
import {
  UserPlus,
  Laptop,
  CheckCircle,
  AlertCircle,
  Printer,
  Calendar,
  Lock,
  Package,
} from 'lucide-react';
import { PrintModal } from '../../components/print/PrintTemplates';

interface IntakePageProps {
  onTicketCreated?: (ticketId: number) => void;
}

export const IntakePage: React.FC<IntakePageProps> = ({ onTicketCreated }) => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const customers = StorageService.getCustomers();
  const categories = StorageService.getCategories();
  const brands = StorageService.getBrands();
  const settings = StorageService.getSettings();

  // Mode: select customer or create new
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(customers[0]?.id || '');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custType, setCustType] = useState<'individual' | 'company'>('individual');
  const [taxNumber, setTaxNumber] = useState('');

  // Device fields
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(categories[0]?.id || 1);
  const [selectedBrandId, setSelectedBrandId] = useState<number>(brands[0]?.id || 1);
  const [modelName, setModelName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [color, setColor] = useState('');

  // Ticket fields
  const [defectDesc, setDefectDesc] = useState('');
  const [initialCond, setInitialCond] = useState('Máy lên nguồn bình thường, sạc vào tốt');
  const [cosmeticCond, setCosmeticCond] = useState('Ngoại quan đẹp, không trầy xước nứt vỡ');
  const [accessories, setAccessories] = useState('Củ sạc, dây cáp zin');
  const [devicePassword, setDevicePassword] = useState('');
  const [priority, setPriority] = useState<RepairPriority>('Normal');
  const [estimatedDays, setEstimatedDays] = useState(2);

  // Print modal trigger
  const [createdTicket, setCreatedTicket] = useState<RepairTicket | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!defectDesc.trim()) {
      showToast('Vui lòng nhập mô tả lỗi thiết bị!', 'error');
      return;
    }

    if (!modelName.trim()) {
      showToast('Vui lòng nhập tên dòng máy (Model)!', 'error');
      return;
    }

    let finalCustomer: Customer;
    if (isNewCustomer) {
      if (!custName.trim() || !custPhone.trim()) {
        showToast('Vui lòng nhập tên và số điện thoại khách hàng!', 'error');
        return;
      }
      finalCustomer = StorageService.addCustomer({
        name: custName.trim(),
        phone: custPhone.trim(),
        email: custEmail.trim() || undefined,
        address: custAddress.trim() || undefined,
        customer_type: custType,
        tax_number: custType === 'company' ? taxNumber.trim() : undefined,
        current_debt: 0,
      });
    } else {
      const found = customers.find((c) => c.id === Number(selectedCustomerId));
      if (!found) {
        showToast('Vui lòng chọn khách hàng!', 'error');
        return;
      }
      finalCustomer = found;
    }

    const categoryObj = categories.find((c) => c.id === selectedCategoryId);
    const brandObj = brands.find((b) => b.id === selectedBrandId);

    // Create device
    const device = StorageService.addDevice({
      customer_id: finalCustomer.id,
      customer_name: finalCustomer.name,
      customer_phone: finalCustomer.phone,
      category_id: selectedCategoryId,
      category_name: categoryObj?.name || 'Thiết bị',
      brand_id: selectedBrandId,
      brand_name: brandObj?.name || 'Hãng',
      model_name: modelName.trim(),
      serial_number: serialNumber.trim() || undefined,
      color: color.trim() || undefined,
    });

    const completionDate = new Date();
    completionDate.setDate(completionDate.getDate() + Number(estimatedDays));

    // Create ticket (UC-08)
    const newTicket = StorageService.createTicket({
      customer_id: finalCustomer.id,
      customer_name: finalCustomer.name,
      customer_phone: finalCustomer.phone,
      customer_address: finalCustomer.address,
      device_id: device.id,
      device_model: device.model_name,
      device_category: categoryObj?.name || 'Thiết bị',
      device_brand: brandObj?.name || 'Hãng',
      device_serial: device.serial_number,
      device_color: device.color,
      created_by_id: currentUser?.id || 1,
      created_by_name: currentUser?.full_name || 'Lễ tân',
      status: 'Received',
      priority,
      defect_description: defectDesc.trim(),
      initial_condition: initialCond.trim(),
      cosmetic_condition: cosmeticCond.trim(),
      accessories_included: accessories.trim(),
      device_password_hint: devicePassword.trim() || undefined,
      estimated_completion: completionDate.toISOString(),
      subtotal_amount: 0,
      discount_amount: 0,
      final_amount: 0,
      paid_amount: 0,
      debt_amount: 0,
      is_warranty_claim: false,
    });

    showToast(`Đã tạo phiếu thành công: ${newTicket.ticket_code}!`, 'success');
    setCreatedTicket(newTicket);
    setShowPrintModal(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tiếp nhận thiết bị sửa chữa (Tạo phiếu mới)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Quy trình UC-08: Ghi nhận thông tin ban đầu, phụ kiện, kiểm tra ngoại quan và in phiếu tiếp nhận.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Customer Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-slate-800 text-sm">1. Thông tin khách hàng</h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsNewCustomer(false)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  !isNewCustomer ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Khách hàng có sẵn
              </button>
              <button
                type="button"
                onClick={() => setIsNewCustomer(true)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  isNewCustomer ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                + Khách hàng mới
              </button>
            </div>
          </div>

          {!isNewCustomer ? (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Chọn khách hàng</label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — SĐT: {c.phone} ({c.customer_type === 'company' ? 'Doanh nghiệp' : 'Cá nhân'})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Họ tên / Tên Doanh nghiệp *</label>
                <input
                  type="text"
                  required
                  placeholder="Nguyễn Văn A / Công ty ABC"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại liên hệ *</label>
                <input
                  type="tel"
                  required
                  placeholder="0901234567"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ</label>
                <input
                  type="text"
                  placeholder="Số nhà, đường, phường, quận..."
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loại khách hàng</label>
                <div className="flex gap-4 pt-1 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={custType === 'individual'}
                      onChange={() => setCustType('individual')}
                    />
                    <span>Khách cá nhân</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      checked={custType === 'company'}
                      onChange={() => setCustType('company')}
                    />
                    <span>Doanh nghiệp (Có MST)</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: Device Info */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Laptop className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">2. Thông tin thiết bị</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Loại thiết bị</label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hãng sản xuất</label>
              <select
                value={selectedBrandId}
                onChange={(e) => setSelectedBrandId(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tên dòng máy (Model) *</label>
              <input
                type="text"
                required
                placeholder="VD: XPS 15 9500, iPhone 14 Pro Max..."
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Số Serial / IMEI</label>
              <input
                type="text"
                placeholder="Tra cứu bảo hành nhanh"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Màu sắc ngoại quan</label>
              <input
                type="text"
                placeholder="Xám, Bạc, Đen, Tím..."
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mật khẩu màn hình / BIOS</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="PIN hoặc mã vẽ (Bảo mật)"
                  value={devicePassword}
                  onChange={(e) => setDevicePassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Defect & Inspection Details */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <AlertCircle className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">3. Tình trạng tiếp nhận & Lỗi mô tả</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả triệu chứng hư hỏng của khách hàng *</label>
            <textarea
              required
              rows={3}
              placeholder="VD: Máy bị rơi vào nước không lên nguồn, hoặc bàn phím kẹt phím Space, quạt kêu to..."
              value={defectDesc}
              onChange={(e) => setDefectDesc(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Tình trạng máy lúc nhận (Nguồn, Màn hình, Sạc)</label>
              <input
                type="text"
                value={initialCond}
                onChange={(e) => setInitialCond(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Ngoại quan (Vết trầy xước, nứt móp vỏ)</label>
              <input
                type="text"
                value={cosmeticCond}
                onChange={(e) => setCosmeticCond(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Phụ kiện gửi kèm (Sạc, cáp, túi, chuột...)</label>
              <input
                type="text"
                placeholder="Củ sạc zin, túi chống sốc..."
                value={accessories}
                onChange={(e) => setAccessories(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mức độ ưu tiên</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RepairPriority)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden font-semibold"
              >
                <option value="Normal">Bình thường</option>
                <option value="High">Ưu tiên cao</option>
                <option value="Urgent">Khẩn cấp (Lấy ngay)</option>
                <option value="Low">Thấp</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Thời gian hẹn trả dự kiến</label>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Dự kiến hoàn thành sau:</span>
              {[1, 2, 3, 5].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setEstimatedDays(days)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    estimatedDays === days
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {days} ngày
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Printer className="w-5 h-5" />
            Tạo phiếu tiếp nhận & In phiếu (A5/A4)
          </button>
        </div>
      </form>

      {/* Print Modal if created */}
      {showPrintModal && createdTicket && (
        <PrintModal
          ticket={createdTicket}
          settings={settings}
          type="intake"
          onClose={() => {
            setShowPrintModal(false);
            onTicketCreated?.(createdTicket.id);
          }}
        />
      )}
    </div>
  );
};
