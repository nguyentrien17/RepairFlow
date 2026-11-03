import React, { useState } from 'react';
import { StorageService, INITIAL_SUPPLIERS } from '../../services/mockStorage';
import { Part, Supplier } from '../../types';
import { formatVND } from '../../utils/formatters';
import { Search, Plus, Boxes, PackagePlus, AlertTriangle, Truck } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { NumberInput } from '../../components/common/NumberInput';

export const InventoryPage: React.FC = () => {
  const [parts, setParts] = useState<Part[]>(() => StorageService.getParts());
  const [suppliers] = useState<Supplier[]>(() => INITIAL_SUPPLIERS);
  const [search, setSearch] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'parts' | 'suppliers'>('parts');

  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPartForReceipt, setSelectedPartForReceipt] = useState<Part | null>(null);
  const [receiptQty, setReceiptQty] = useState(5);

  const { showToast } = useToast();
  const reload = () => setParts(StorageService.getParts());

  // Add Part Form
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('Linh kiện chung');
  const [compatible, setCompatible] = useState('');
  const [costPrice, setCostPrice] = useState(200000);
  const [sellingPrice, setSellingPrice] = useState(400000);
  const [stockQty, setStockQty] = useState(5);
  const [minAlert, setMinAlert] = useState(3);
  const [location, setLocation] = useState('Kệ A1');

  const filtered = parts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreatePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      showToast('Vui lòng điền mã SKU và tên linh kiện!', 'error');
      return;
    }
    const newPart = StorageService.addPart({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category_id: 1,
      category_name: categoryName,
      compatible_models: compatible.trim() || undefined,
      cost_price: Number(costPrice),
      selling_price: Number(sellingPrice),
      stock_quantity: Number(stockQty),
      min_stock_alert: Number(minAlert),
      location: location.trim(),
    });

    showToast(`Đã thêm linh kiện ${newPart.name} vào kho!`, 'success');
    setShowAddPartModal(false);
    setSku('');
    setName('');
    reload();
  };

  const handleReceiptStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartForReceipt || receiptQty <= 0) return;

    StorageService.updatePartStock(selectedPartForReceipt.id, Number(receiptQty));
    StorageService.addAuditLog(
      'INVENTORY_RECEIPT',
      'parts',
      selectedPartForReceipt.sku,
      `Nhập kho thêm +${receiptQty} ${selectedPartForReceipt.name}`
    );
    showToast(`Đã nhập thêm +${receiptQty} cái vào tồn kho!`, 'success');
    setShowReceiptModal(false);
    setSelectedPartForReceipt(null);
    reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Quản lý kho & Linh kiện vật tư (UC-15, UC-16)</h2>
          <p className="text-xs text-slate-500 mt-0.5">Theo dõi SKU, giá vốn, giá bán, vị trí kệ và nhập/xuất kho tự động.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddPartModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Thêm linh kiện mới
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-4 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('parts')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeSubTab === 'parts' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Danh mục linh kiện ({parts.length})
        </button>
        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`pb-2.5 transition-colors border-b-2 ${
            activeSubTab === 'suppliers' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Nhà cung cấp ({suppliers.length})
        </button>
      </div>

      {activeSubTab === 'parts' && (
        <div className="space-y-4">
          {/* Search toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên linh kiện, mã SKU, danh mục..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden"
              />
            </div>
          </div>

          {/* Parts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Mã SKU</th>
                  <th className="py-3 px-4">Tên linh kiện</th>
                  <th className="py-3 px-4">Danh mục</th>
                  <th className="py-3 px-4 text-right">Giá vốn</th>
                  <th className="py-3 px-4 text-right">Giá bán</th>
                  <th className="py-3 px-4 text-center">Tồn kho</th>
                  <th className="py-3 px-4">Vị trí</th>
                  <th className="py-3 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => {
                  const isLow = p.stock_quantity <= p.min_stock_alert;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{p.sku}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-400">{p.compatible_models || 'Tương thích nhiều dòng máy'}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.category_name}</td>
                      <td className="py-3 px-4 text-right text-slate-600">{formatVND(p.cost_price)}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatVND(p.selling_price)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1 ${
                          isLow ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isLow && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                          {p.stock_quantity} cái
                        </span>
                        {isLow && <span className="text-[10px] text-rose-600 block mt-0.5">Sắp hết hàng</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{p.location || 'Kho'}</td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setSelectedPartForReceipt(p);
                            setShowReceiptModal(true);
                          }}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition-colors"
                        >
                          + Nhập kho
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeSubTab === 'suppliers' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
              <tr>
                <th className="py-3 px-4">Mã NCC</th>
                <th className="py-3 px-4">Tên nhà cung cấp</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Địa chỉ kho hàng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-mono font-bold text-indigo-700">{s.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                  <td className="py-3 px-4 font-mono">{s.phone}</td>
                  <td className="py-3 px-4 text-slate-600">{s.email || '---'}</td>
                  <td className="py-3 px-4 text-slate-600">{s.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Part Modal */}
      {showAddPartModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">Thêm linh kiện mới vào danh mục</h3>
            <form onSubmit={handleCreatePart} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mã SKU *</label>
                <input
                  type="text"
                  required
                  placeholder="VD: LK-MH-DELL-5580"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl uppercase font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên linh kiện *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá vốn nhập (VND)</label>
                  <CurrencyInput
                    value={costPrice}
                    onChange={(val) => setCostPrice(val)}
                    min={0}
                    placeholder="VD: 300.000"
                    showInWords={false}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giá bán ra (VND)</label>
                  <CurrencyInput
                    value={sellingPrice}
                    onChange={(val) => setSellingPrice(val)}
                    min={0}
                    placeholder="VD: 550.000"
                    showInWords={false}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Số lượng ban đầu</label>
                  <NumberInput
                    min={0}
                    value={stockQty}
                    onChange={(val) => setStockQty(val)}
                    unit="cái"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngưỡng báo sắp hết</label>
                  <NumberInput
                    min={0}
                    value={minAlert}
                    onChange={(val) => setMinAlert(val)}
                    unit="cái"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPartModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30"
                >
                  Lưu linh kiện
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Receipt Modal (UC-16) */}
      {showReceiptModal && selectedPartForReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-2 border-b border-slate-100">
              Nhập kho linh kiện (UC-16)
            </h3>
            <p className="text-xs text-slate-600 font-semibold">{selectedPartForReceipt.name}</p>
            <form onSubmit={handleReceiptStock} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Số lượng nhập thêm *</label>
                <NumberInput
                  min={1}
                  required
                  value={receiptQty}
                  onChange={(val) => setReceiptQty(Math.max(1, val))}
                  unit="cái"
                  className="font-bold text-sm text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiptModal(false);
                    setSelectedPartForReceipt(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold shadow-md shadow-emerald-600/30"
                >
                  Xác nhận nhập kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
