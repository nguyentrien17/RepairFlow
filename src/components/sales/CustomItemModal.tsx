import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { StorageService } from '../../services/mockStorage';
import { PlusCircle, X, Laptop, ShieldCheck, Tag, Cpu, DollarSign } from 'lucide-react';

export interface CustomSaleItem {
  part_id: number;
  product_name: string;
  sku: string;
  item_type: 'part' | 'device' | 'accessory';
  quantity: number;
  max_stock: number;
  cost_price: number;
  unit_price: number;
  serial_number: string;
  warranty_months: number;
  return_days?: number;
  specs?: string;
}

interface CustomItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCustomItem: (item: CustomSaleItem) => void;
}

export const CustomItemModal: React.FC<CustomItemModalProps> = ({
  isOpen,
  onClose,
  onAddCustomItem,
}) => {
  const { showToast } = useToast();
  const settings = StorageService.getSettings();

  const [productName, setProductName] = useState('');
  const [sku, setSku] = useState('');
  const [itemType, setItemType] = useState<'device' | 'part' | 'accessory'>('device');
  const [serialNumber, setSerialNumber] = useState('');
  const [specs, setSpecs] = useState('');
  const [costPrice, setCostPrice] = useState<number | ''>(0);
  const [unitPrice, setUnitPrice] = useState<number | ''>('');
  const [warrantyMonths, setWarrantyMonths] = useState<number>(6);
  const [returnDays, setReturnDays] = useState<number>(settings.default_return_days || 15);
  const [quantity, setQuantity] = useState<number>(1);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!productName.trim()) {
      showToast('Vui lòng nhập tên sản phẩm / thiết bị!', 'error');
      return;
    }

    if (!unitPrice || Number(unitPrice) <= 0) {
      showToast('Vui lòng nhập giá bán hợp lệ (> 0 đ)!', 'error');
      return;
    }

    const generatedSku = sku.trim() || `CUSTOM-${Date.now().toString().slice(-6)}`;
    const randomTempPartId = 900000 + Math.floor(Math.random() * 99999);

    const newItem: CustomSaleItem = {
      part_id: randomTempPartId,
      product_name: `${productName.trim()}${specs.trim() ? ` (${specs.trim()})` : ''}`,
      sku: generatedSku.toUpperCase(),
      item_type: itemType,
      quantity: quantity > 0 ? quantity : 1,
      max_stock: 999,
      cost_price: Number(costPrice) || 0,
      unit_price: Number(unitPrice),
      serial_number: serialNumber.trim(),
      warranty_months: warrantyMonths,
      return_days: returnDays,
      specs: specs.trim() || undefined,
    };

    onAddCustomItem(newItem);
    showToast(`Đã thêm thiết bị "${newItem.product_name}" vào giỏ hàng!`, 'success');
    onClose();

    // Reset
    setProductName('');
    setSku('');
    setSerialNumber('');
    setSpecs('');
    setCostPrice(0);
    setUnitPrice('');
    setWarrantyMonths(6);
    setQuantity(1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
              <Laptop className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Thêm Thiết Bị / Hàng Bán Ngoài Danh Mục</h3>
              <p className="text-xs text-slate-400">Bán lẻ laptop cũ/mới, máy nguyên chiếc, phụ kiện nhập lẻ</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Type Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold gap-1">
            {[
              { id: 'device', label: 'Laptop / Máy cũ mới' },
              { id: 'part', label: 'Linh kiện đặc biệt' },
              { id: 'accessory', label: 'Phụ kiện / Thiết bị' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setItemType(t.id as any)}
                className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                  itemType === t.id
                    ? 'bg-white text-indigo-700 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:bg-slate-200/50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tên thiết bị / Sản phẩm bán lẻ <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="VD: Laptop Dell XPS 15 9500 Core i7 / 16GB / 512GB (Like New 99%)..."
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Serial / IMEI */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số Serial / IMEI <span className="text-rose-500">* (Cần thiết để xuất phiếu bảo hành)</span>
              </label>
              <input
                type="text"
                required
                placeholder="Nhập mã Serial / IMEI máy..."
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            {/* Custom SKU */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mã SKU / Mã quản lý</label>
              <input
                type="text"
                placeholder="Tự động tạo nếu để trống..."
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Configuration & Condition details */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tình trạng & Thông số chi tiết</label>
            <input
              type="text"
              placeholder="VD: Pin 92%, Màn FHD+, Nguyên bản chưa qua sửa chữa, Kèm sạc zin 130W..."
              value={specs}
              onChange={(e) => setSpecs(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:outline-hidden"
            />
          </div>

          {/* Financials & Warranty */}
          {/* Financials, Warranty & Return Window */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Giá nhập / Giá vốn</label>
              <input
                type="number"
                min={0}
                placeholder="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Giá bán lẻ <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1000}
                placeholder="Giá bán đ..."
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-indigo-300 rounded-lg text-xs font-bold text-indigo-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Thời gian BH (Tùy chỉnh số tháng)</label>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={120}
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-indigo-700 focus:border-indigo-500 focus:outline-hidden"
                    placeholder="Nhập số tháng..."
                  />
                  <span className="text-xs font-bold text-slate-500 shrink-0">tháng</span>
                </div>
                <div className="flex gap-1 overflow-x-auto text-[10px] font-semibold pt-0.5">
                  {[0, 1, 3, 6, 12, 24, 36].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setWarrantyMonths(m)}
                      className={`px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                        warrantyMonths === m
                          ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m === 0 ? '0T' : `${m}T`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Thời hạn đổi trả (Tùy chỉnh số ngày)</label>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={365}
                    value={returnDays}
                    onChange={(e) => setReturnDays(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-amber-700 focus:border-amber-500 focus:outline-hidden"
                    placeholder="Nhập số ngày..."
                  />
                  <span className="text-xs font-bold text-slate-500 shrink-0">ngày</span>
                </div>
                <div className="flex gap-1 overflow-x-auto text-[10px] font-semibold pt-0.5">
                  {[0, 3, 7, 15, 30].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setReturnDays(d)}
                      className={`px-1.5 py-0.5 rounded border transition-all cursor-pointer ${
                        returnDays === d
                          ? 'bg-amber-600 text-white border-amber-600 font-bold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {d === 0 ? 'Không trả' : `${d}N`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Thêm Vào Giỏ Hàng</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
