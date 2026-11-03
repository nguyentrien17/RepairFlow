import React, { useState } from 'react';
import {
  BadgePercent,
  Plus,
  Search,
  Percent,
  DollarSign,
  Calendar,
  Tag,
  Copy,
  Check,
  Edit2,
  Trash2,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { Promotion, DiscountType } from '../../types';
import { StorageService } from '../../services/mockStorage';
import { useToast } from '../../contexts/ToastContext';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { NumberInput } from '../../components/common/NumberInput';

export const PromotionsPage: React.FC = () => {
  const { showToast } = useToast();
  const [promotions, setPromotions] = useState<Promotion[]>(() => StorageService.getPromotions());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'percentage' | 'fixed'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<DiscountType>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(100000);
  const [minOrderAmount, setMinOrderAmount] = useState<number>(200000);
  const [applicableTo, setApplicableTo] = useState<'all' | 'labor' | 'part'>('all');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [usageLimit, setUsageLimit] = useState<number | undefined>(200);
  const [isActive, setIsActive] = useState(true);

  const reloadPromotions = () => {
    setPromotions(StorageService.getPromotions());
  };

  const handleOpenAddModal = () => {
    setEditingPromo(null);
    setCode('');
    setName('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue(10);
    setMaxDiscountAmount(100000);
    setMinOrderAmount(200000);
    setApplicableTo('all');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
    setUsageLimit(200);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Promotion) => {
    setEditingPromo(p);
    setCode(p.code);
    setName(p.name);
    setDescription(p.description || '');
    setDiscountType(p.discount_type);
    setDiscountValue(p.discount_value);
    setMaxDiscountAmount(p.max_discount_amount || 0);
    setMinOrderAmount(p.min_order_amount || 0);
    setApplicableTo(p.applicable_to || 'all');
    setStartDate(p.start_date || new Date().toISOString().slice(0, 10));
    setEndDate(p.end_date || '');
    setUsageLimit(p.usage_limit);
    setIsActive(p.is_active);
    setIsModalOpen(true);
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      showToast('Vui lòng nhập mã ưu đãi (VD: KHACHQUEN, HSSV)!', 'error');
      return;
    }

    if (!name.trim()) {
      showToast('Vui lòng nhập tên chương trình ưu đãi!', 'error');
      return;
    }

    if (discountValue <= 0) {
      showToast('Giá trị giảm giá phải lớn hơn 0!', 'error');
      return;
    }

    if (discountType === 'percentage' && discountValue > 100) {
      showToast('Giảm giá phần trăm không được vượt quá 100%!', 'error');
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      showToast('Ngày bắt đầu không được lớn hơn ngày kết thúc!', 'error');
      return;
    }

    try {
      if (editingPromo) {
        StorageService.updatePromotion(editingPromo.id, {
          code: cleanCode,
          name: name.trim(),
          description: description.trim() || undefined,
          discount_type: discountType,
          discount_value: Number(discountValue),
          max_discount_amount: discountType === 'percentage' && maxDiscountAmount > 0 ? Number(maxDiscountAmount) : undefined,
          min_order_amount: minOrderAmount > 0 ? Number(minOrderAmount) : undefined,
          applicable_to: applicableTo,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          usage_limit: usageLimit && usageLimit > 0 ? Number(usageLimit) : undefined,
          is_active: isActive,
        });
        showToast(`Đã cập nhật mã ưu đãi ${cleanCode} thành công!`, 'success');
      } else {
        StorageService.addPromotion({
          code: cleanCode,
          name: name.trim(),
          description: description.trim() || undefined,
          discount_type: discountType,
          discount_value: Number(discountValue),
          max_discount_amount: discountType === 'percentage' && maxDiscountAmount > 0 ? Number(maxDiscountAmount) : undefined,
          min_order_amount: minOrderAmount > 0 ? Number(minOrderAmount) : undefined,
          applicable_to: applicableTo,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          usage_limit: usageLimit && usageLimit > 0 ? Number(usageLimit) : undefined,
          is_active: isActive,
        });
        showToast(`Đã tạo mã ưu đãi mới: ${cleanCode}!`, 'success');
      }

      setIsModalOpen(false);
      reloadPromotions();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu mã ưu đãi', 'error');
    }
  };

  const handleToggleActive = (p: Promotion) => {
    const updated = StorageService.updatePromotion(p.id, { is_active: !p.is_active });
    showToast(
      updated.is_active
        ? `Đã kích hoạt chương trình ưu đãi ${p.code}!`
        : `Đã tạm dừng chương trình ưu đãi ${p.code}!`,
      'info'
    );
    reloadPromotions();
  };

  const handleDelete = (p: Promotion) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa mã ưu đãi "${p.code}" - ${p.name}?`)) {
      StorageService.deletePromotion(p.id);
      showToast(`Đã xóa mã ưu đãi ${p.code}!`, 'success');
      reloadPromotions();
    }
  };

  const handleCopyCode = (promoCode: string) => {
    navigator.clipboard.writeText(promoCode);
    setCopiedCode(promoCode);
    showToast(`Đã sao chép mã "${promoCode}" vào bộ nhớ tạm!`, 'success');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Filtered promotions
  const today = new Date().toISOString().slice(0, 10);
  const filteredPromotions = promotions.filter((p) => {
    const matchSearch =
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchSearch) return false;

    if (typeFilter !== 'all' && p.discount_type !== typeFilter) return false;

    const isExpired = p.end_date ? today > p.end_date : false;
    if (statusFilter === 'active') return p.is_active && !isExpired;
    if (statusFilter === 'inactive') return !p.is_active;
    if (statusFilter === 'expired') return isExpired;

    return true;
  });

  // Calculate metrics
  const totalPromotions = promotions.length;
  const activeCount = promotions.filter((p) => p.is_active && (!p.end_date || today <= p.end_date)).length;
  const totalUsages = promotions.reduce((acc, p) => acc + (p.usage_count || 0), 0);
  const tickets = StorageService.getTickets();
  const totalDiscountGranted = tickets.reduce((acc, t) => acc + (t.discount_amount || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shadow-xs">
              <BadgePercent className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Ưu đãi & Chương trình Giảm giá
              </h1>
              <p className="text-xs text-slate-500">
                Quản lý mã voucher, mã giảm giá theo %, số tiền mặt và điều kiện áp dụng khi báo giá hoặc thanh toán
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Tạo mã ưu đãi mới
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng chương trình</p>
            <p className="text-xl font-bold text-slate-900">{totalPromotions}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Đang kích hoạt</p>
            <p className="text-xl font-bold text-emerald-600">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Lượt đã áp dụng</p>
            <p className="text-xl font-bold text-slate-900">{totalUsages} lượt</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Tổng tiền đã ưu đãi</p>
            <p className="text-xl font-bold text-rose-600">{totalDiscountGranted.toLocaleString('vi-VN')} đ</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo mã ưu đãi, tên chương trình..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Trạng thái:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="all">Tất cả</option>
              <option value="active">Đang áp dụng</option>
              <option value="inactive">Tạm ngưng</option>
              <option value="expired">Đã hết hạn</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 font-medium">Hình thức:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="all">Tất cả hình thức</option>
              <option value="percentage">Giảm theo %</option>
              <option value="fixed">Giảm tiền mặt (VND)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promotions List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPromotions.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
            <BadgePercent className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">Chưa tìm thấy chương trình ưu đãi nào</p>
            <p className="text-xs text-slate-500 mt-1">
              Thử thay đổi từ khóa tìm kiếm hoặc nhấn nút "Tạo mã ưu đãi mới" ở trên.
            </p>
          </div>
        ) : (
          filteredPromotions.map((p) => {
            const isExpired = p.end_date ? today > p.end_date : false;

            return (
              <div
                key={p.id}
                className={`bg-white rounded-2xl border transition-all shadow-xs p-5 flex flex-col justify-between ${
                  !p.is_active
                    ? 'border-slate-200 bg-slate-50/50 opacity-80'
                    : isExpired
                    ? 'border-rose-200 bg-rose-50/20'
                    : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Bar: Code Badge & Status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        {p.code}
                      </span>
                      <button
                        onClick={() => handleCopyCode(p.code)}
                        title="Sao chép mã"
                        className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
                      >
                        {copiedCode === p.code ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isExpired ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200">
                          Hết hạn
                        </span>
                      ) : p.is_active ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                          Đang chạy
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">
                          Tạm dừng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-slate-900 text-sm">{p.name}</h3>
                  {p.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                  )}

                  {/* Discount Value Display */}
                  <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50/70 to-purple-50/70 rounded-xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-slate-500 font-medium block">Mức giảm:</span>
                      <span className="text-base font-extrabold text-indigo-700">
                        {p.discount_type === 'percentage'
                          ? `Giảm ${p.discount_value}%`
                          : `Giảm ${p.discount_value.toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>
                    {p.discount_type === 'percentage' && p.max_discount_amount && (
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Tối đa</span>
                        <span className="text-xs font-bold text-slate-700">
                          {p.max_discount_amount.toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Conditions & Details */}
                  <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Đơn tối thiểu:</span>
                      <strong className="text-slate-800">
                        {p.min_order_amount && p.min_order_amount > 0
                          ? `${p.min_order_amount.toLocaleString('vi-VN')} đ`
                          : 'Không yêu cầu'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Phạm vi áp dụng:</span>
                      <strong className="text-slate-800">
                        {p.applicable_to === 'labor'
                          ? 'Chỉ tiền công'
                          : p.applicable_to === 'part'
                          ? 'Chỉ linh kiện'
                          : 'Toàn bộ hóa đơn'}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Thời hạn:</span>
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        {p.start_date || 'Bất kỳ'} → {p.end_date || 'Vô thời hạn'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Đã dùng:</span>
                      <span className="font-semibold text-slate-800">
                        {p.usage_count} {p.usage_limit ? `/ ${p.usage_limit}` : ''} lượt
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleActive(p)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-indigo-600 transition-colors"
                  >
                    {p.is_active ? (
                      <ToggleRight className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-slate-400" />
                    )}
                    <span>{p.is_active ? 'Đang bật' : 'Đang tắt'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(p)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Add / Edit Promotion */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BadgePercent className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">
                  {editingPromo ? 'Chỉnh sửa chương trình ưu đãi' : 'Tạo mới chương trình ưu đãi / Voucher'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mã ưu đãi (Voucher Code) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: KHACHQUEN, HSSV2026..."
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono font-bold uppercase text-indigo-700 text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Mã không có khoảng trắng, tự động viết hoa.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên chương trình ưu đãi *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: Ưu đãi Khách hàng thân thiết 10%..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-medium focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mô tả / Điều kiện chi tiết</label>
                <textarea
                  rows={2}
                  placeholder="Ghi chú điều kiện áp dụng, đối tượng nhận ưu đãi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 resize-none focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              {/* Discount Type Radio */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Hình thức giảm giá</label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      discountType === 'percentage'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="discountType"
                      checked={discountType === 'percentage'}
                      onChange={() => setDiscountType('percentage')}
                      className="text-indigo-600"
                    />
                    <Percent className="w-4 h-4 text-indigo-600" />
                    <span>Giảm theo % (Phần trăm)</span>
                  </label>

                  <label
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                      discountType === 'fixed'
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="discountType"
                      checked={discountType === 'fixed'}
                      onChange={() => setDiscountType('fixed')}
                      className="text-indigo-600"
                    />
                    <DollarSign className="w-4 h-4 text-indigo-600" />
                    <span>Giảm tiền mặt (VNĐ)</span>
                  </label>
                </div>
              </div>

              {/* Value and Max Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    {discountType === 'percentage' ? 'Tỷ lệ giảm (%) *' : 'Số tiền giảm (VNĐ) *'}
                  </label>
                  {discountType === 'percentage' ? (
                    <NumberInput
                      min={1}
                      max={100}
                      value={discountValue}
                      onChange={(val) => setDiscountValue(val)}
                      unit="%"
                    />
                  ) : (
                    <CurrencyInput
                      min={1000}
                      value={discountValue}
                      onChange={(val) => setDiscountValue(val)}
                      placeholder="VD: 50.000"
                      showInWords={false}
                      quickPresets={[20000, 30000, 50000, 100000, 200000]}
                    />
                  )}
                </div>

                {discountType === 'percentage' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Giảm tối đa (VNĐ)
                    </label>
                    <CurrencyInput
                      min={0}
                      value={maxDiscountAmount}
                      onChange={(val) => setMaxDiscountAmount(val)}
                      placeholder="0 = Không giới hạn"
                      showInWords={false}
                      quickPresets={[50000, 100000, 150000, 200000]}
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Để 0 nếu không giới hạn mức giảm tối đa.</p>
                  </div>
                )}
              </div>

              {/* Min Order & Applicable scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Giá trị đơn tối thiểu (VNĐ)
                  </label>
                  <CurrencyInput
                    min={0}
                    value={minOrderAmount}
                    onChange={(val) => setMinOrderAmount(val)}
                    placeholder="0 = Không yêu cầu"
                    showInWords={false}
                    quickPresets={[100000, 200000, 300000, 500000]}
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Đơn hàng phải từ số tiền này trở lên mới áp dụng.</p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phạm vi áp dụng</label>
                  <select
                    value={applicableTo}
                    onChange={(e) => setApplicableTo(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                  >
                    <option value="all">Toàn bộ chi phí phiếu sửa chữa</option>
                    <option value="labor">Chỉ áp dụng cho tiền công dịch vụ</option>
                    <option value="part">Chỉ áp dụng cho tiền linh kiện</option>
                  </select>
                </div>
              </div>

              {/* Dates & Limit */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ngày kết thúc</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Giới hạn số lượt dùng</label>
                  <NumberInput
                    min={1}
                    value={usageLimit || 0}
                    onChange={(val) => setUsageLimit(val > 0 ? val : undefined)}
                    unit="lượt"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="font-semibold text-slate-700">Kích hoạt chương trình ngay</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {isActive ? (
                    <ToggleRight className="w-8 h-8 text-emerald-600" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-400" />
                  )}
                  <span className={`text-xs font-bold ${isActive ? 'text-emerald-700' : 'text-slate-500'}`}>
                    {isActive ? 'Đang kích hoạt' : 'Tạm ngưng'}
                  </span>
                </button>
              </div>

              {/* Actions */}
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  {editingPromo ? 'Lưu thay đổi' : 'Tạo mã ưu đãi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
