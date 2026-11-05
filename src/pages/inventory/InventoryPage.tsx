import React, { useState } from 'react';
import { StorageService } from '../../services/mockStorage';
import { Part, Supplier, InventoryBatch } from '../../types';
import { formatVND, formatDate } from '../../utils/formatters';
import {
  Search,
  Plus,
  Boxes,
  PackagePlus,
  AlertTriangle,
  Truck,
  Building2,
  Pencil,
  Trash2,
  Eye,
  Filter,
  X,
  CheckCircle2,
  Layers,
  Calendar,
  History,
  Tag,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { NumberInput } from '../../components/common/NumberInput';
import { SearchableSelect, SearchableOption } from '../../components/common/SearchableSelect';

export const InventoryPage: React.FC = () => {
  const [parts, setParts] = useState<Part[]>(() => StorageService.getParts());
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [batches, setBatches] = useState<InventoryBatch[]>(() => StorageService.getBatches());

  const [search, setSearch] = useState('');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<number | 'all'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'parts' | 'batches' | 'suppliers'>('parts');

  // Interactive Batch Accordion per Part Row State
  const [expandedPartIds, setExpandedPartIds] = useState<number[]>([]);

  const toggleExpandPart = (partId: number) => {
    setExpandedPartIds((prev) =>
      prev.includes(partId) ? prev.filter((id) => id !== partId) : [...prev, partId]
    );
  };

  // Modals state
  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [editingPart, setEditingPart] = useState<Part | null>(null);

  // Stock Receipt / Batch Import Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPartForReceipt, setSelectedPartForReceipt] = useState<Part | null>(null);
  const [receiptQty, setReceiptQty] = useState(5);
  const [batchCode, setBatchCode] = useState('');
  const [batchSupplierId, setBatchSupplierId] = useState<number | ''>('');
  const [batchCostPrice, setBatchCostPrice] = useState(0);
  const [batchSellingPrice, setBatchSellingPrice] = useState(0);
  const [batchImportDate, setBatchImportDate] = useState(new Date().toISOString().slice(0, 10));
  const [batchNotes, setBatchNotes] = useState('');

  // Batch Edit Modal State
  const [showEditBatchModal, setShowEditBatchModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<InventoryBatch | null>(null);
  const [editBatchCode, setEditBatchCode] = useState('');
  const [editBatchSupplierId, setEditBatchSupplierId] = useState<number | ''>('');
  const [editBatchImportQty, setEditBatchImportQty] = useState(0);
  const [editBatchRemainingQty, setEditBatchRemainingQty] = useState(0);
  const [editBatchCostPrice, setEditBatchCostPrice] = useState(0);
  const [editBatchSellingPrice, setEditBatchSellingPrice] = useState(0);
  const [editBatchImportDate, setEditBatchImportDate] = useState('');
  const [editBatchNotes, setEditBatchNotes] = useState('');

  const openEditBatchModal = (batch: InventoryBatch) => {
    setEditingBatch(batch);
    setEditBatchCode(batch.batch_code);
    setEditBatchSupplierId(batch.supplier_id || '');
    setEditBatchImportQty(batch.import_quantity);
    setEditBatchRemainingQty(batch.remaining_quantity);
    setEditBatchCostPrice(batch.cost_price);
    setEditBatchSellingPrice(batch.selling_price);
    setEditBatchImportDate(batch.import_date);
    setEditBatchNotes(batch.notes || '');
    setShowEditBatchModal(true);
  };

  // View Batches for a specific Part Modal
  const [viewingPartBatches, setViewingPartBatches] = useState<Part | null>(null);

  // Supplier Modals State
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplierParts, setViewingSupplierParts] = useState<Supplier | null>(null);

  const { showToast } = useToast();

  const reloadData = () => {
    setParts(StorageService.getParts());
    setSuppliers(StorageService.getSuppliers());
    setBatches(StorageService.getBatches());
  };

  // Part Form State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [categoryName, setCategoryName] = useState('Linh kiện chung');
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [compatible, setCompatible] = useState('');
  const [costPrice, setCostPrice] = useState(200000);
  const [sellingPrice, setSellingPrice] = useState(400000);
  const [stockQty, setStockQty] = useState(5);
  const [minAlert, setMinAlert] = useState(3);
  const [location, setLocation] = useState('Kệ A1');

  // Supplier Form State
  const [suppName, setSuppName] = useState('');
  const [suppPhone, setSuppPhone] = useState('');
  const [suppEmail, setSuppEmail] = useState('');
  const [suppAddress, setSuppAddress] = useState('');

  const openAddPartModal = () => {
    setEditingPart(null);
    setSku('');
    setName('');
    setCategoryName('Linh kiện chung');
    setSupplierId(suppliers.length > 0 ? suppliers[0].id : '');
    setCompatible('');
    setCostPrice(200000);
    setSellingPrice(400000);
    setStockQty(5);
    setMinAlert(3);
    setLocation('Kệ A1');
    setShowAddPartModal(true);
  };

  const openEditPartModal = (part: Part) => {
    setEditingPart(part);
    setSku(part.sku);
    setName(part.name);
    setCategoryName(part.category_name);
    setSupplierId(part.supplier_id || '');
    setCompatible(part.compatible_models || '');
    setCostPrice(part.cost_price);
    setSellingPrice(part.selling_price);
    setStockQty(part.stock_quantity);
    setMinAlert(part.min_stock_alert);
    setLocation(part.location || 'Kho');
    setShowAddPartModal(true);
  };

  const openReceiptModalForPart = (part: Part) => {
    setSelectedPartForReceipt(part);
    const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const defaultBatchCode = `LOT-${todayStr}-${String(batches.length + 1).padStart(3, '0')}`;
    setBatchCode(defaultBatchCode);
    setReceiptQty(5);
    setBatchSupplierId(part.supplier_id || (suppliers.length > 0 ? suppliers[0].id : ''));
    setBatchCostPrice(part.cost_price);
    setBatchSellingPrice(part.selling_price);
    setBatchImportDate(new Date().toISOString().slice(0, 10));
    setBatchNotes('');
    setShowReceiptModal(true);
  };

  const openAddSupplierModal = () => {
    setEditingSupplier(null);
    setSuppName('');
    setSuppPhone('');
    setSuppEmail('');
    setSuppAddress('');
    setShowSupplierModal(true);
  };

  const openEditSupplierModal = (supp: Supplier) => {
    setEditingSupplier(supp);
    setSuppName(supp.name);
    setSuppPhone(supp.phone);
    setSuppEmail(supp.email || '');
    setSuppAddress(supp.address || '');
    setShowSupplierModal(true);
  };

  // Filter parts based on search and supplier
  const filteredParts = parts.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category_name.toLowerCase().includes(search.toLowerCase()) ||
      (p.supplier_name && p.supplier_name.toLowerCase().includes(search.toLowerCase()));

    const matchSupplier = selectedSupplierFilter === 'all' || p.supplier_id === Number(selectedSupplierFilter);

    return matchSearch && matchSupplier;
  });

  // Filter batches based on search
  const filteredBatches = batches.filter(
    (b) =>
      b.batch_code.toLowerCase().includes(search.toLowerCase()) ||
      b.part_name.toLowerCase().includes(search.toLowerCase()) ||
      b.sku.toLowerCase().includes(search.toLowerCase()) ||
      (b.supplier_name && b.supplier_name.toLowerCase().includes(search.toLowerCase()))
  );

  const handleSavePart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku.trim() || !name.trim()) {
      showToast('Vui lòng điền mã SKU và tên linh kiện!', 'error');
      return;
    }

    const selectedSupp = suppliers.find((s) => s.id === Number(supplierId));

    if (editingPart) {
      StorageService.updatePart(editingPart.id, {
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category_name: categoryName,
        supplier_id: selectedSupp ? selectedSupp.id : undefined,
        supplier_name: selectedSupp ? selectedSupp.name : undefined,
        compatible_models: compatible.trim() || undefined,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        stock_quantity: Number(stockQty),
        min_stock_alert: Number(minAlert),
        location: location.trim(),
      });
      showToast(`Đã cập nhật linh kiện ${name.trim()}!`, 'success');
    } else {
      const newPart = StorageService.addPart({
        sku: sku.trim().toUpperCase(),
        name: name.trim(),
        category_id: 1,
        category_name: categoryName,
        supplier_id: selectedSupp ? selectedSupp.id : undefined,
        supplier_name: selectedSupp ? selectedSupp.name : undefined,
        compatible_models: compatible.trim() || undefined,
        cost_price: Number(costPrice),
        selling_price: Number(sellingPrice),
        stock_quantity: Number(stockQty),
        min_stock_alert: Number(minAlert),
        location: location.trim(),
      });

      // Also auto create initial batch for this part if stockQty > 0
      if (stockQty > 0) {
        const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        StorageService.addInventoryBatch({
          part_id: newPart.id,
          part_name: newPart.name,
          sku: newPart.sku,
          supplier_id: selectedSupp?.id,
          supplier_name: selectedSupp?.name,
          import_quantity: stockQty,
          cost_price: Number(costPrice),
          selling_price: Number(sellingPrice),
          import_date: new Date().toISOString().slice(0, 10),
          notes: 'Lô đợt khởi tạo ban đầu khi tạo mã linh kiện mới',
          custom_batch_code: `LOT-${todayStr}-INIT`,
        });
      }

      showToast(`Đã thêm linh kiện ${newPart.name} và tạo lô kho ban đầu!`, 'success');
    }

    setShowAddPartModal(false);
    reloadData();
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!suppName.trim() || !suppPhone.trim()) {
      showToast('Vui lòng nhập tên nhà cung cấp và số điện thoại!', 'error');
      return;
    }

    if (editingSupplier) {
      StorageService.updateSupplier(editingSupplier.id, {
        name: suppName.trim(),
        phone: suppPhone.trim(),
        email: suppEmail.trim() || undefined,
        address: suppAddress.trim() || undefined,
      });
      showToast(`Đã cập nhật nhà cung cấp ${suppName.trim()}!`, 'success');
    } else {
      const newSupp = StorageService.addSupplier({
        name: suppName.trim(),
        phone: suppPhone.trim(),
        email: suppEmail.trim() || undefined,
        address: suppAddress.trim() || undefined,
        is_active: true,
      });
      showToast(`Đã thêm nhà cung cấp ${newSupp.name}!`, 'success');
    }

    setShowSupplierModal(false);
    reloadData();
  };

  const handleDeleteSupplier = (supp: Supplier) => {
    const linkedPartsCount = parts.filter((p) => p.supplier_id === supp.id).length;
    if (linkedPartsCount > 0) {
      showToast(`Không thể xóa nhà cung cấp này vì đang có ${linkedPartsCount} linh kiện liên kết!`, 'error');
      return;
    }
    if (confirm(`Bạn có chắc chắn muốn xóa nhà cung cấp ${supp.name}?`)) {
      StorageService.deleteSupplier(supp.id);
      showToast(`Đã xóa nhà cung cấp ${supp.name}!`, 'success');
      reloadData();
    }
  };

  const handleReceiptStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartForReceipt || receiptQty <= 0) return;

    const selectedSupp = suppliers.find((s) => s.id === Number(batchSupplierId));

    StorageService.addInventoryBatch({
      part_id: selectedPartForReceipt.id,
      part_name: selectedPartForReceipt.name,
      sku: selectedPartForReceipt.sku,
      supplier_id: selectedSupp?.id,
      supplier_name: selectedSupp?.name,
      import_quantity: Number(receiptQty),
      cost_price: Number(batchCostPrice),
      selling_price: Number(batchSellingPrice),
      import_date: batchImportDate,
      notes: batchNotes.trim() || undefined,
      custom_batch_code: batchCode.trim() || undefined,
    });

    showToast(`Đã nhập lô đợt mới (+${receiptQty} cái) cho ${selectedPartForReceipt.name}!`, 'success');
    setShowReceiptModal(false);
    setSelectedPartForReceipt(null);
    reloadData();
  };

  const handleSaveBatchEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch) return;

    const supp = suppliers.find((s) => s.id === Number(editBatchSupplierId));

    try {
      StorageService.updateInventoryBatch(editingBatch.id, {
        batch_code: editBatchCode.trim() || editingBatch.batch_code,
        supplier_id: supp?.id,
        supplier_name: supp?.name,
        import_quantity: Number(editBatchImportQty),
        remaining_quantity: Number(editBatchRemainingQty),
        cost_price: Number(editBatchCostPrice),
        selling_price: Number(editBatchSellingPrice),
        import_date: editBatchImportDate,
        notes: editBatchNotes.trim() || undefined,
      });

      showToast(`Đã cập nhật thành công đợt nhập kho ${editBatchCode}!`, 'success');
      setShowEditBatchModal(false);
      setEditingBatch(null);
      reloadData();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi cập nhật đợt nhập kho', 'error');
    }
  };

  const handleDeleteBatch = (batch: InventoryBatch) => {
    if (confirm(`Bạn có chắc chắn muốn xóa đợt nhập ${batch.batch_code} của linh kiện "${batch.part_name}"?`)) {
      StorageService.deleteInventoryBatch(batch.id);
      showToast(`Đã xóa đợt nhập kho ${batch.batch_code}!`, 'success');
      reloadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Boxes className="w-6 h-6 text-indigo-600" />
            Quản lý kho & Linh kiện vật tư (UC-15, UC-16)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Quản lý danh mục linh kiện, theo dõi các đợt/lô nhập kho, liên kết nhà cung cấp & trừ tồn kho tự động.
          </p>
        </div>
        <div className="flex gap-2">
          {activeSubTab === 'suppliers' ? (
            <button
              onClick={openAddSupplierModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm nhà cung cấp
            </button>
          ) : (
            <button
              onClick={openAddPartModal}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Thêm linh kiện mới
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('parts')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'parts'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Danh mục linh kiện ({parts.length})
        </button>
        <button
          onClick={() => setActiveSubTab('batches')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'batches'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-600" />
          Đợt nhập kho / Lô hàng ({batches.length})
        </button>
        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`pb-3 transition-colors border-b-2 flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'suppliers'
              ? 'border-indigo-600 text-indigo-700 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Nhà cung cấp vật tư ({suppliers.length})
        </button>
      </div>

      {/* TAB 1: PARTS DIRECTORY */}
      {activeSubTab === 'parts' && (
        <div className="space-y-4">
          {/* Toolbar: Search + Supplier Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên linh kiện, mã SKU, danh mục, nhà cung cấp..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden font-medium"
              />
            </div>

            <div className="flex items-center gap-2 text-xs w-full sm:w-80">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="text-slate-600 font-bold shrink-0">Lọc NCC:</span>
              <div className="flex-1">
                <SearchableSelect
                  options={[
                    { value: 'all', label: 'Tất cả nhà cung cấp', sublabel: `${parts.length} linh kiện` },
                    ...suppliers.map((s) => ({
                      value: s.id,
                      label: s.name,
                      sublabel: `Mã: ${s.code} • ${parts.filter((p) => p.supplier_id === s.id).length} linh kiện`,
                    })),
                  ]}
                  value={selectedSupplierFilter}
                  onChange={(val) => setSelectedSupplierFilter(val === 'all' || !val ? 'all' : Number(val))}
                  placeholder="-- Tất cả NCC --"
                  searchPlaceholder="Tìm NCC..."
                />
              </div>
            </div>
          </div>

          {/* Parts Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3.5 px-2 w-10 text-center"></th>
                  <th className="py-3.5 px-4">Mã SKU</th>
                  <th className="py-3.5 px-4">Tên linh kiện & Tương thích</th>
                  <th className="py-3.5 px-4">Nhà cung cấp</th>
                  <th className="py-3.5 px-4 text-right">Giá vốn</th>
                  <th className="py-3.5 px-4 text-right">Giá bán</th>
                  <th className="py-3.5 px-4 text-center">Tổng tồn kho</th>
                  <th className="py-3.5 px-4 text-center">Các đợt nhập (Lô)</th>
                  <th className="py-3.5 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      Không tìm thấy linh kiện nào phù hợp với điều kiện tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredParts.map((p) => {
                    const isLow = p.stock_quantity <= p.min_stock_alert;
                    const isExpanded = expandedPartIds.includes(p.id);
                    const partBatches = batches.filter((b) => b.part_id === p.id);

                    return (
                      <React.Fragment key={p.id}>
                        {/* Parent Part Row */}
                        <tr
                          className={`hover:bg-slate-50 transition-colors ${
                            isExpanded ? 'bg-amber-50/40 border-l-4 border-l-amber-500 font-medium' : ''
                          }`}
                        >
                          <td className="py-3.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => toggleExpandPart(p.id)}
                              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                                isExpanded
                                  ? 'bg-amber-600 text-white shadow-2xs'
                                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                              }`}
                              title={isExpanded ? 'Thu gọn danh sách đợt nhập' : 'Mở rộng xem các đợt nhập'}
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform duration-200 ${
                                  isExpanded ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{p.sku}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {p.compatible_models || 'Tương thích nhiều dòng máy'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {p.supplier_name ? (
                              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg font-semibold text-[11px] inline-flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-indigo-500" />
                                {p.supplier_name}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">Chưa gán NCC</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right text-slate-600 font-mono">
                            {formatVND(p.cost_price)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                            {formatVND(p.selling_price)}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full font-bold text-xs inline-flex items-center gap-1 ${
                                isLow ? 'bg-rose-100 text-rose-800 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isLow && <AlertTriangle className="w-3 h-3 text-rose-600" />}
                              {p.stock_quantity} cái
                            </span>
                            {isLow && <span className="text-[10px] text-rose-600 block mt-0.5 font-semibold">Sắp hết hàng</span>}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {partBatches.length === 0 ? (
                              <span className="text-slate-400 text-[11px] italic">Chưa có đợt nhập</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => toggleExpandPart(p.id)}
                                className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs ${
                                  isExpanded
                                    ? 'bg-amber-600 text-white shadow-amber-600/30'
                                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300'
                                }`}
                                title="Bấm để mở danh sách chi tiết các đợt nhập bên dưới"
                              >
                                <Layers className="w-3.5 h-3.5" />
                                <span>{partBatches.length} đợt nhập</span>
                                <ChevronDown
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    isExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => openReceiptModalForPart(p)}
                                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <PackagePlus className="w-3.5 h-3.5" />
                                + Nhập đợt mới
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditPartModal(p)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Chỉnh sửa thông tin linh kiện"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expandable Accordion Sub-Table Row */}
                        {isExpanded && (
                          <tr key={`expanded-${p.id}`} className="bg-slate-50/80">
                            <td colSpan={9} className="p-0 border-b border-amber-200">
                              <div className="p-4 bg-gradient-to-r from-amber-50/70 via-slate-50 to-indigo-50/30 border-y border-amber-200/80 space-y-3 animate-in fade-in duration-150">
                                {/* Accordion Header Info Bar */}
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                                      <Layers className="w-4 h-4 text-amber-700" />
                                    </span>
                                    <div>
                                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                                        Danh sách các đợt nhập kho / lô hàng của:
                                        <span className="text-indigo-700 font-extrabold text-sm">{p.name}</span>
                                      </h4>
                                      <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                        Mã SKU: <strong className="text-indigo-900">{p.sku}</strong> • Tổng tồn kho hệ thống:{' '}
                                        <strong className="text-emerald-700">{p.stock_quantity} cái</strong> • Số lô đợt:{' '}
                                        <strong className="text-amber-800">{partBatches.length} đợt nhập</strong>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openReceiptModalForPart(p)}
                                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                                    >
                                      <PackagePlus className="w-3.5 h-3.5" />
                                      + Nhập kho đợt mới cho mã này
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => toggleExpandPart(p.id)}
                                      className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                                      title="Thu gọn danh sách đợt nhập"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Sub-Table for Import Batches */}
                                <div className="bg-white rounded-xl border border-amber-200/80 shadow-xs overflow-hidden">
                                  <table className="w-full text-left text-xs">
                                    <thead className="bg-amber-100/70 border-b border-amber-200 text-amber-950 font-bold uppercase text-[11px]">
                                      <tr>
                                        <th className="py-2.5 px-3 text-center w-10">STT</th>
                                        <th className="py-2.5 px-3">Mã Lô Đợt Nhập</th>
                                        <th className="py-2.5 px-3">Ngày Nhập Kho</th>
                                        <th className="py-2.5 px-3">Nhà Cung Cấp Đợt</th>
                                        <th className="py-2.5 px-3 text-center">SL Ban Đầu</th>
                                        <th className="py-2.5 px-3 text-center">Tồn Khả Dụng</th>
                                        <th className="py-2.5 px-3 text-right">Giá Vốn Lô</th>
                                        <th className="py-2.5 px-3 text-right">Giá Bán Lô</th>
                                        <th className="py-2.5 px-3">Ghi Chú Đợt Nhập</th>
                                        <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                                        <th className="py-2.5 px-3 text-center">Thao Tác</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-amber-100/60 bg-white">
                                      {partBatches.length === 0 ? (
                                        <tr>
                                          <td colSpan={11} className="py-6 text-center text-slate-500 italic">
                                            Chưa có lô đợt nhập kho riêng biệt nào được ghi nhận cho linh kiện này.
                                          </td>
                                        </tr>
                                      ) : (
                                        partBatches.map((b, bIdx) => (
                                          <tr key={b.id} className="hover:bg-amber-50/40 transition-colors">
                                            <td className="py-2.5 px-3 text-center font-bold text-slate-400">{bIdx + 1}</td>
                                            <td className="py-2.5 px-3 font-mono font-extrabold text-amber-800">
                                              <span className="px-2 py-0.5 bg-amber-50 border border-amber-300 rounded-md shadow-2xs">
                                                {b.batch_code}
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-3 font-mono text-slate-600">{b.import_date}</td>
                                            <td className="py-2.5 px-3 text-slate-800 font-medium">
                                              {b.supplier_name ? (
                                                <span className="flex items-center gap-1">
                                                  <Building2 className="w-3 h-3 text-indigo-500 shrink-0" />
                                                  <span>{b.supplier_name}</span>
                                                </span>
                                              ) : (
                                                '---'
                                              )}
                                            </td>
                                            <td className="py-2.5 px-3 text-center font-extrabold text-slate-800">{b.import_quantity} cái</td>
                                            <td className="py-2.5 px-3 text-center">
                                              <span
                                                className={`px-2.5 py-0.5 rounded-full font-extrabold text-[11px] ${
                                                  b.remaining_quantity > 0
                                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                    : 'bg-rose-50 text-rose-600 border border-rose-200 line-through'
                                                }`}
                                              >
                                                {b.remaining_quantity} cái
                                              </span>
                                            </td>
                                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatVND(b.cost_price)}</td>
                                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatVND(b.selling_price)}</td>
                                            <td className="py-2.5 px-3 text-slate-500 text-[11px] max-w-xs truncate">{b.notes || '---'}</td>
                                            <td className="py-2.5 px-3 text-center">
                                              {b.remaining_quantity > 0 ? (
                                                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded font-bold text-[10px]">
                                                  Khả dụng
                                                </span>
                                              ) : (
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded font-bold text-[10px]">
                                                  Đã hết
                                                </span>
                                              )}
                                            </td>
                                            <td className="py-2.5 px-3 text-center">
                                              <div className="flex items-center justify-center gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => openEditBatchModal(b)}
                                                  className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                                                  title="Chỉnh sửa thông tin đợt nhập này"
                                                >
                                                  <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteBatch(b)}
                                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                                  title="Xóa đợt nhập này"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INVENTORY BATCHES / ĐỢT NHẬP KHO */}
      {activeSubTab === 'batches' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex justify-between items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo mã lô (LOT-...), tên linh kiện, SKU, NCC..."
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden font-medium"
              />
            </div>
            <span className="text-xs text-slate-500 font-medium">
              Tổng số đợt nhập: <strong className="text-indigo-700 font-bold">{batches.length} lô</strong>
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3.5 px-4">Mã Đợt / Lô</th>
                  <th className="py-3.5 px-4">Mã SKU & Linh kiện</th>
                  <th className="py-3.5 px-4">Nhà cung cấp đợt này</th>
                  <th className="py-3.5 px-4">Ngày nhập</th>
                  <th className="py-3.5 px-4 text-center">SL Nhập</th>
                  <th className="py-3.5 px-4 text-center">Tồn đợt này</th>
                  <th className="py-3.5 px-4 text-right">Giá vốn đợt</th>
                  <th className="py-3.5 px-4 text-right">Giá bán quy định</th>
                  <th className="py-3.5 px-4">Ghi chú đợt</th>
                  <th className="py-3.5 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-8 text-center text-slate-500">
                      Chưa có lô đợt nhập kho nào phù hợp với tìm kiếm.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-extrabold text-amber-700 bg-amber-50/50">
                        <span className="px-2 py-0.5 rounded border border-amber-200 inline-block">
                          {b.batch_code}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-indigo-700">{b.sku}</div>
                        <div className="font-semibold text-slate-900">{b.part_name}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {b.supplier_name ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span>{b.supplier_name}</span>
                          </div>
                        ) : (
                          '---'
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{b.import_date}</td>
                      <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">{b.import_quantity}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                            b.remaining_quantity > 0
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-500 line-through'
                          }`}
                        >
                          {b.remaining_quantity} cái
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600">{formatVND(b.cost_price)}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{formatVND(b.selling_price)}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                        {b.notes || '---'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditBatchModal(b)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                            title="Sửa thông tin đợt nhập này"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteBatch(b)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa đợt nhập này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIERS MANAGEMENT */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3.5 px-4">Mã NCC</th>
                  <th className="py-3.5 px-4">Tên nhà cung cấp</th>
                  <th className="py-3.5 px-4">Số điện thoại</th>
                  <th className="py-3.5 px-4">Email liên hệ</th>
                  <th className="py-3.5 px-4">Địa chỉ kho hàng</th>
                  <th className="py-3.5 px-4 text-center">Linh kiện liên kết</th>
                  <th className="py-3.5 px-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      Chưa có nhà cung cấp nào trong danh mục. Bấm "Thêm nhà cung cấp" để bổ sung.
                    </td>
                  </tr>
                ) : (
                  suppliers.map((s) => {
                    const linkedParts = parts.filter((p) => p.supplier_id === s.id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">{s.code}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{s.name}</td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{s.phone}</td>
                        <td className="py-3.5 px-4 text-slate-600">{s.email || '---'}</td>
                        <td className="py-3.5 px-4 text-slate-600">{s.address || '---'}</td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setViewingSupplierParts(s)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-full text-xs transition-colors cursor-pointer"
                          >
                            {linkedParts.length} linh kiện
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setViewingSupplierParts(s)}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                              title="Xem các linh kiện của nhà cung cấp này"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditSupplierModal(s)}
                              className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Chỉnh sửa nhà cung cấp"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSupplier(s)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa nhà cung cấp"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT PART */}
      {showAddPartModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                {editingPart ? 'Chỉnh sửa linh kiện' : 'Thêm linh kiện mới vào kho'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddPartModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePart} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Mã SKU linh kiện <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: LK-MH-DELL-5580"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên linh kiện vật tư <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Màn hình Dell XPS 15 9500 FHD+"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Gán Nhà cung cấp vật tư <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={suppliers.map((s) => ({
                    value: s.id,
                    label: s.name,
                    sublabel: `Mã NCC: ${s.code} • SĐT: ${s.phone}`,
                  }))}
                  value={supplierId}
                  onChange={(val) => setSupplierId(val ? Number(val) : '')}
                  placeholder="-- Gõ tên NCC để tìm kiếm & chọn --"
                  searchPlaceholder="Tìm nhà cung cấp..."
                  emptyMessage="Không tìm thấy nhà cung cấp"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dòng máy tương thích</label>
                <input
                  type="text"
                  placeholder="VD: Dell XPS 15 9500, XPS 9510..."
                  value={compatible}
                  onChange={(e) => setCompatible(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá vốn nhập (VND)</label>
                  <CurrencyInput
                    value={costPrice}
                    onChange={(val) => setCostPrice(val)}
                    min={0}
                    placeholder="VD: 300.000"
                    showInWords={false}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá bán ra (VND)</label>
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
                  <label className="block font-bold text-slate-700 mb-1">Số lượng nhập đợt đầu</label>
                  <NumberInput
                    min={0}
                    value={stockQty}
                    onChange={(val) => setStockQty(val)}
                    unit="cái"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ngưỡng báo hết hàng</label>
                  <NumberInput
                    min={0}
                    value={minAlert}
                    onChange={(val) => setMinAlert(val)}
                    unit="cái"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Vị trí kệ kho</label>
                <input
                  type="text"
                  placeholder="VD: Kệ A2 - Ngăn 04"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPartModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  {editingPart ? 'Lưu thay đổi' : 'Thêm linh kiện & Tạo lô'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: BATCH STOCK RECEIPT / NHẬP KHO THEO ĐỢT (UC-16) */}
      {showReceiptModal && selectedPartForReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Nhập kho theo Đợt / Lô hàng (UC-16)
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    SKU: {selectedPartForReceipt.sku} • {selectedPartForReceipt.name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowReceiptModal(false);
                  setSelectedPartForReceipt(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReceiptStock} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã Đợt / Lô hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={batchCode}
                    onChange={(e) => setBatchCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    placeholder="VD: LOT-20261103-001"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold uppercase text-amber-800"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày nhập kho <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={batchImportDate}
                    onChange={(e) => setBatchImportDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nhà cung cấp cho đợt nhập này <span className="text-rose-500">*</span>
                </label>
                <SearchableSelect
                  options={suppliers.map((s) => ({
                    value: s.id,
                    label: s.name,
                    sublabel: `Mã NCC: ${s.code} • SĐT: ${s.phone}`,
                  }))}
                  value={batchSupplierId}
                  onChange={(val) => setBatchSupplierId(val ? Number(val) : '')}
                  placeholder="-- Chọn nhà cung cấp đợt này --"
                  searchPlaceholder="Tìm NCC..."
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số lượng nhập <span className="text-rose-500">*</span>
                  </label>
                  <NumberInput
                    min={1}
                    required
                    value={receiptQty}
                    onChange={(val) => setReceiptQty(Math.max(1, val))}
                    unit="cái"
                    className="font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá vốn đợt này</label>
                  <CurrencyInput
                    value={batchCostPrice}
                    onChange={(val) => setBatchCostPrice(val)}
                    min={0}
                    showInWords={false}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá bán ra</label>
                  <CurrencyInput
                    value={batchSellingPrice}
                    onChange={(val) => setBatchSellingPrice(val)}
                    min={0}
                    showInWords={false}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú đợt nhập kho</label>
                <input
                  type="text"
                  placeholder="VD: Nhập lô hàng theo Hóa đơn GTGT #88219..."
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              {/* Total Calculation */}
              <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-100 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-700">Tổng giá trị lô hàng nhập:</span>
                <span className="font-extrabold text-indigo-700 text-base font-mono">
                  {formatVND(batchCostPrice * receiptQty)}
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowReceiptModal(false);
                    setSelectedPartForReceipt(null);
                  }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md shadow-emerald-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Xác nhận Nhập Kho Đợt Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: VIEW PART BATCHES */}
      {viewingPartBatches && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Lịch sử các đợt/lô nhập kho của: {viewingPartBatches.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Mã SKU: {viewingPartBatches.sku} • Tổng tồn kho hiện tại: {viewingPartBatches.stock_quantity} cái
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingPartBatches(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Mã Lô Đợt</th>
                    <th className="py-2.5 px-3">Ngày nhập</th>
                    <th className="py-2.5 px-3">Nhà cung cấp đợt đó</th>
                    <th className="py-2.5 px-3 text-center">SL Ban đầu</th>
                    <th className="py-2.5 px-3 text-center">Tồn đợt</th>
                    <th className="py-2.5 px-3 text-right">Giá vốn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.filter((b) => b.part_id === viewingPartBatches.id).length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-slate-500">
                        Chưa có lô đợt nhập kho riêng biệt nào được ghi nhận cho linh kiện này.
                      </td>
                    </tr>
                  ) : (
                    batches
                      .filter((b) => b.part_id === viewingPartBatches.id)
                      .map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-extrabold text-amber-700">{b.batch_code}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">{b.import_date}</td>
                          <td className="py-2.5 px-3 text-slate-700">{b.supplier_name || '---'}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-800">{b.import_quantity}</td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                                b.remaining_quantity > 0
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-500 line-through'
                              }`}
                            >
                              {b.remaining_quantity} cái
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-700">{formatVND(b.cost_price)}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingPartBatches(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD / EDIT SUPPLIER */}
      {showSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                {editingSupplier ? 'Chỉnh sửa nhà cung cấp' : 'Thêm nhà cung cấp vật tư mới'}
              </h3>
              <button
                type="button"
                onClick={() => setShowSupplierModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Tên nhà cung cấp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Công ty TNHH Phân Phối Linh Kiện Sài Gòn"
                  value={suppName}
                  onChange={(e) => setSuppName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Số điện thoại liên hệ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: 028.3999.7777"
                  value={suppPhone}
                  onChange={(e) => setSuppPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email kinh doanh</label>
                <input
                  type="email"
                  placeholder="VD: kinhdoanh@supplier.vn"
                  value={suppEmail}
                  onChange={(e) => setSuppEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Địa chỉ kho hàng / Trụ sở</label>
                <textarea
                  rows={2}
                  placeholder="VD: 158 Bùi Thị Xuân, Q.1, TP.HCM"
                  value={suppAddress}
                  onChange={(e) => setSuppAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  {editingSupplier ? 'Lưu cập nhật' : 'Thêm nhà cung cấp'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: VIEW SUPPLIER PARTS */}
      {viewingSupplierParts && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Danh sách linh kiện do: {viewingSupplierParts.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Mã NCC: {viewingSupplierParts.code} • SĐT: {viewingSupplierParts.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingSupplierParts(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Mã SKU</th>
                    <th className="py-2.5 px-3">Tên linh kiện</th>
                    <th className="py-2.5 px-3 text-right">Giá vốn</th>
                    <th className="py-2.5 px-3 text-right">Giá bán</th>
                    <th className="py-2.5 px-3 text-center">Tồn kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parts.filter((p) => p.supplier_id === viewingSupplierParts.id).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-500">
                        Chưa có linh kiện nào được gán cho nhà cung cấp này.
                      </td>
                    </tr>
                  ) : (
                    parts
                      .filter((p) => p.supplier_id === viewingSupplierParts.id)
                      .map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-indigo-700">{p.sku}</td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatVND(p.cost_price)}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatVND(p.selling_price)}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-slate-900">{p.stock_quantity}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingSupplierParts(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: EDIT INVENTORY BATCH */}
      {showEditBatchModal && editingBatch && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Chỉnh sửa Đợt nhập kho / Lô hàng</h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Linh kiện: {editingBatch.part_name} ({editingBatch.sku})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowEditBatchModal(false);
                  setEditingBatch(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchEdit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mã đợt / Lô hàng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editBatchCode}
                    onChange={(e) => setEditBatchCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold text-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Ngày nhập kho <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={editBatchImportDate}
                    onChange={(e) => setEditBatchImportDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nhà cung cấp cho đợt này</label>
                <SearchableSelect
                  options={[
                    { value: '', label: '-- Không gán NCC đợt --' },
                    ...suppliers.map((s) => ({
                      value: s.id,
                      label: s.name,
                      sublabel: `SĐT: ${s.phone}`,
                    })),
                  ]}
                  value={editBatchSupplierId}
                  onChange={(val) => setEditBatchSupplierId(val ? Number(val) : '')}
                  placeholder="-- Chọn nhà cung cấp --"
                  searchPlaceholder="Tìm tên NCC..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Số lượng nhập ban đầu</label>
                  <NumberInput
                    min={1}
                    value={editBatchImportQty}
                    onChange={(val) => setEditBatchImportQty(val)}
                    unit="cái"
                    className="font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Số lượng tồn khả dụng hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <NumberInput
                    min={0}
                    value={editBatchRemainingQty}
                    onChange={(val) => setEditBatchRemainingQty(val)}
                    unit="cái"
                    className="font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá vốn lô (VNĐ)</label>
                  <CurrencyInput
                    value={editBatchCostPrice}
                    onChange={(val) => setEditBatchCostPrice(val)}
                    min={0}
                    showInWords={false}
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá bán lô (VNĐ)</label>
                  <CurrencyInput
                    value={editBatchSellingPrice}
                    onChange={(val) => setEditBatchSellingPrice(val)}
                    min={0}
                    showInWords={false}
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi chú đợt nhập kho</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú đợt nhập..."
                  value={editBatchNotes}
                  onChange={(e) => setEditBatchNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditBatchModal(false);
                    setEditingBatch(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md shadow-indigo-600/30 cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Lưu cập nhật đợt nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
