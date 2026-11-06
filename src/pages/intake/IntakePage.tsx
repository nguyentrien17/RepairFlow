import React, { useState, useMemo } from 'react';
import { StorageService } from '../../services/mockStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { RepairTicket, Customer, RepairPriority } from '../../types';
import {
  UserPlus,
  Laptop,
  AlertCircle,
  Printer,
  Lock,
  Eye,
  EyeOff,
  Calendar,
  Clock,
  Shield,
  Wrench,
  Check,
  ChevronDown,
  ChevronUp,
  Tag,
  PackageCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { PrintModal } from '../../components/print/PrintTemplates';
import { encryptPassword } from '../../utils/crypto';
import { formatDateTime } from '../../utils/formatters';
import { SearchableSelect, SearchableOption } from '../../components/common/SearchableSelect';
import { CurrencyInput } from '../../components/common/CurrencyInput';

interface IntakePageProps {
  onTicketCreated?: (ticketId: number) => void;
}

// Preset suggested conditions based on device category
const CONDITION_PRESETS_BY_CATEGORY: Record<string, string[]> = {
  laptop: [
    'Mở nguồn bình thường',
    'Không kích nguồn (Mất nguồn)',
    'Màn hình sáng đẹp',
    'Màn hình sọc / đốm sáng',
    'Bàn phím gõ tốt',
    'Kẹt / Liệt phím',
    'Touchpad rê mượt',
    'Sạc nhận pin tốt',
    'Pin chai / Phù pin',
    'Loa rõ tiếng',
    'Loa rè / Mất âm thanh',
    'Quạt tản kêu to / Nóng máy',
    'Bản lề chắc chắn',
    'Bung / Gãy bản lề',
  ],
  pc: [
    'Lên nguồn quạt quay',
    'Không kích nguồn',
    'Không xuất hình (No display)',
    'Kêu bíp bíp liên tục',
    'Treo logo khi boot',
    'Quạt nguồn quay êm',
    'Các cổng USB / Audio nhận tốt',
    'Có mùi khét / Bụi bẩn nhiều',
  ],
  phone: [
    'Lên nguồn bình thường',
    'Mất nguồn hoàn toàn',
    'Màn hình sáng nét',
    'Kính nứt / Màn hình sọc',
    'Cảm ứng mượt mà',
    'Liệt / Loạn cảm ứng',
    'Face ID / Vân tay tốt',
    'Mất Face ID / Vân tay',
    'Chân sạc nhận tốt',
    'Sạc chập chờn / Không vào điện',
    'Pin báo bảo trì / Tụt nhanh',
    'Loa trong & ngoài rõ',
    'Camera trước/sau hoạt động tốt',
  ],
  tablet: [
    'Lên nguồn bình thường',
    'Không lên nguồn',
    'Màn hình hiển thị nét',
    'Kính nứt vỡ',
    'Cảm ứng & Bút stylus tốt',
    'Pin tốt',
    'Cổng sạc tiếp xúc tốt',
    'Loa thu phát bình thường',
  ],
  printer: [
    'Lên đèn nguồn',
    'Báo đèn đỏ / Lỗi cơ',
    'Kéo giấy mượt',
    'Kẹt giấy liên tục',
    'Bản in rõ nét',
    'Bản in mờ / Lem mực / Sọc',
    'Cổng USB / Mạng nhận tốt',
  ],
  monitor: [
    'Lên đèn nguồn',
    'Mất nguồn hoàn toàn',
    'Màn hình hiển thị đẹp',
    'Sọc ngang / Sọc dọc',
    'Điểm chết / Ố phản quang',
    'Chớp tắt liên tục',
    'Hỏng cổng HDMI / DisplayPort',
  ],
  other: [
    'Lên nguồn bình thường',
    'Mất nguồn hoàn toàn',
    'Hoạt động chập chờn',
    'Có mùi khét / Chập cháy',
    'Thiết bị bị vào nước / Ẩm',
  ],
};

const ACCESSORY_PRESETS = [
  'Chỉ nhận thân máy (không phụ kiện)',
  'Củ sạc zin theo máy',
  'Cáp sạc Type-C / Lightning',
  'Túi chống sốc',
  'Chuột máy tính',
  'Bút cảm ứng (Stylus)',
  'Khay SIM + Thẻ nhớ',
];

const COSMETIC_PRESETS = [
  'Ngoại quan đẹp 99% không trầy',
  'Trầy xước dăm nhẹ mặt lưng',
  'Cấn nhẹ góc vỏ máy',
  'Vỏ móp méo do va đập',
  'Nứt vỡ kính màn hình',
  'Mất ốc vít / Thiếu nắp che',
];

function getFutureDateTime(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(17, 0, 0, 0); // Mặc định 17:00 cuối giờ làm việc
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getCurrentDateTime(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const IntakePage: React.FC<IntakePageProps> = ({ onTicketCreated }) => {
  const { currentUser, hasRole } = useAuth();
  const { showToast } = useToast();

  const customers = StorageService.getCustomers();
  const categories = StorageService.getCategories();
  const brands = StorageService.getBrands();
  const settings = StorageService.getSettings();
  const technicians = StorageService.getUsers().filter(
    (u) =>
      u.role.toLowerCase() === 'technician' ||
      u.role.toLowerCase() === 'manager' ||
      u.role.toLowerCase() === 'admin'
  );

  // Memoized Searchable Options
  const customerOptions: SearchableOption[] = useMemo(() => {
    return customers.map((c) => ({
      value: c.id,
      label: c.name,
      sublabel: `SĐT: ${c.phone}${c.address ? ` • ${c.address}` : ''}${c.current_debt > 0 ? ` • [Đang nợ: ${c.current_debt.toLocaleString()} đ]` : ''}`,
      badge: c.customer_type === 'company' ? 'Doanh nghiệp' : 'Cá nhân',
      badgeColor:
        c.current_debt > 0
          ? 'bg-rose-50 text-rose-700 border-rose-200'
          : c.customer_type === 'company'
          ? 'bg-blue-50 text-blue-700 border-blue-200'
          : 'bg-slate-100 text-slate-700 border-slate-200',
    }));
  }, [customers]);

  const categoryOptions: SearchableOption[] = useMemo(() => {
    const list: SearchableOption[] = categories.map((cat) => ({
      value: cat.id,
      label: cat.name,
      sublabel: `Mã: ${cat.code}`,
    }));
    const hasOther = list.some(
      (item) => String(item.value) === 'other' || item.label.toLowerCase().includes('khác')
    );
    if (!hasOther) {
      list.push({
        value: 'other',
        label: 'Khác (Tự nhập loại thiết bị mới)',
        sublabel: 'Tự nhập loại thiết bị tùy chỉnh',
      });
    }
    return list;
  }, [categories]);

  const brandOptions: SearchableOption[] = useMemo(() => {
    const list: SearchableOption[] = brands.map((b) => ({
      value: b.id,
      label: b.name,
    }));
    const hasOther = list.some(
      (item) => String(item.value) === 'other' || item.label.toLowerCase().includes('khác')
    );
    if (!hasOther) {
      list.push({
        value: 'other',
        label: 'Khác (Tự nhập tên hãng sản xuất)',
        sublabel: 'Tự nhập hãng sản xuất tùy chỉnh',
      });
    }
    return list;
  }, [brands]);

  const techOptions: SearchableOption[] = useMemo(() => {
    return [
      { value: '', label: '-- Chưa chỉ định (Giao sau) --' },
      ...technicians.map((t) => ({
        value: t.id,
        label: t.full_name,
        sublabel: `SĐT: ${t.phone} • ${t.role}`,
        badge: t.is_active ? 'Sẵn sàng' : 'Vắng',
        badgeColor: t.is_active
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
          : 'bg-slate-100 text-slate-500',
      })),
    ];
  }, [technicians]);

  // Customer state
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(customers[0]?.id || '');
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [custType, setCustType] = useState<'individual' | 'company'>('individual');
  const [taxNumber, setTaxNumber] = useState('');

  // Device state
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | string>(categories[0]?.id || 1);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<number | string>(brands[0]?.id || 1);
  const [customBrandName, setCustomBrandName] = useState('');
  const [modelName, setModelName] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [color, setColor] = useState('');

  // Password state (Requirement 8)
  const [devicePassword, setDevicePassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Customer-provided info (Requirement 3 & 4)
  const [defectDesc, setDefectDesc] = useState('');
  const [accessories, setAccessories] = useState('Củ sạc zin theo máy');

  // Staff-recorded info (Requirement 3 & 9)
  const [selectedConditions, setSelectedConditions] = useState<string[]>([
    'Mở nguồn bình thường',
    'Màn hình sáng đẹp',
  ]);
  const [customConditionNote, setCustomConditionNote] = useState('');
  const [cosmeticCond, setCosmeticCond] = useState('Ngoại quan đẹp 99% không trầy');
  const [priority, setPriority] = useState<RepairPriority>('Normal');

  // Estimated completion date-time (Requirement 7)
  const [estimatedDays, setEstimatedDays] = useState<number | null>(2);
  const [estimatedDateTime, setEstimatedDateTime] = useState<string>(() => getFutureDateTime(2));

  // Technical Diagnostics Section (Requirement 5 & 6)
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [techDefectDescription, setTechDefectDescription] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [proposedSolution, setProposedSolution] = useState('');
  const [technicianId, setTechnicianId] = useState<number | ''>(
    technicians[0]?.id || ''
  );
  const [inspectionTime, setInspectionTime] = useState<string>(getCurrentDateTime());
  const [estimatedCost, setEstimatedCost] = useState<number | ''>('');

  // Print modal state
  const [createdTicket, setCreatedTicket] = useState<RepairTicket | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Custom Category & Brand Check
  const isCustomCategory = useMemo(() => {
    if (selectedCategoryId === 'other') return true;
    if (typeof selectedCategoryId === 'number') {
      const cat = categories.find((c) => c.id === selectedCategoryId);
      if (cat && (cat.code === 'other' || cat.name.toLowerCase().includes('khác'))) {
        return true;
      }
    }
    return false;
  }, [selectedCategoryId, categories]);

  const isCustomBrand = useMemo(() => {
    if (selectedBrandId === 'other') return true;
    if (typeof selectedBrandId === 'number') {
      const b = brands.find((brand) => brand.id === selectedBrandId);
      if (b && b.name.toLowerCase().includes('khác')) {
        return true;
      }
    }
    return false;
  }, [selectedBrandId, brands]);

  // Selected Category Code
  const currentCategoryCode = useMemo(() => {
    if (isCustomCategory) return 'other';
    const cat = categories.find((c) => c.id === Number(selectedCategoryId));
    return cat ? cat.code.toLowerCase() : 'laptop';
  }, [categories, selectedCategoryId, isCustomCategory]);

  // Suggested condition tags for current category
  const suggestedConditions = useMemo(() => {
    return CONDITION_PRESETS_BY_CATEGORY[currentCategoryCode] || CONDITION_PRESETS_BY_CATEGORY.other;
  }, [currentCategoryCode]);

  // Toggle condition tag (Requirement 9: multi-select, does not lose data on category change)
  const handleToggleCondition = (tag: string) => {
    setSelectedConditions((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Quick days selection (Requirement 7)
  const handleSelectQuickDays = (days: number) => {
    setEstimatedDays(days);
    setEstimatedDateTime(getFutureDateTime(days));
  };

  // Custom datetime change (Requirement 7)
  const handleCustomDateTimeChange = (val: string) => {
    setEstimatedDateTime(val);
    setEstimatedDays(null); // Deselect quick button if custom date is modified
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (isCustomCategory && !customCategoryName.trim()) {
      showToast('Vui lòng nhập tên loại thiết bị khác!', 'error');
      return;
    }

    if (isCustomBrand && !customBrandName.trim()) {
      showToast('Vui lòng nhập tên hãng sản xuất khác!', 'error');
      return;
    }

    if (!defectDesc.trim()) {
      showToast('Vui lòng nhập mô tả sự cố từ khách hàng!', 'error');
      return;
    }

    if (!modelName.trim()) {
      showToast('Vui lòng nhập tên dòng máy (Model)!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Customer resolution (server-first so customer.id & code match MySQL)
      let finalCustomer: Customer;
      if (isNewCustomer) {
        if (!custName.trim() || !custPhone.trim()) {
          showToast('Vui lòng nhập tên và số điện thoại khách hàng!', 'error');
          return;
        }
        finalCustomer = await StorageService.addCustomerAsync({
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

      const categoryObj = typeof selectedCategoryId === 'number' ? categories.find((c) => c.id === selectedCategoryId) : null;
      const brandObj = typeof selectedBrandId === 'number' ? brands.find((b) => b.id === selectedBrandId) : null;

      const finalCategoryName = isCustomCategory
        ? (customCategoryName.trim() || 'Thiết bị khác')
        : (categoryObj?.name || 'Thiết bị');

      const finalBrandName = isCustomBrand
        ? (customBrandName.trim() || 'Hãng khác')
        : (brandObj?.name || 'Hãng');

      // Create device on server first so device.id belongs to finalCustomer.id in MySQL
      const device = await StorageService.addDeviceAsync({
        customer_id: finalCustomer.id,
        customer_name: finalCustomer.name,
        customer_phone: finalCustomer.phone,
        category_id: typeof selectedCategoryId === 'number' ? selectedCategoryId : 7,
        category_name: finalCategoryName,
        brand_id: typeof selectedBrandId === 'number' ? selectedBrandId : 999,
        brand_name: finalBrandName,
        model_name: modelName.trim(),
        serial_number: serialNumber.trim() || undefined,
        color: color.trim() || undefined,
      });

      // Combine initial condition (Requirement 9)
      const combinedInitialCondition = [
        ...selectedConditions,
        customConditionNote.trim() ? `Ghi chú: ${customConditionNote.trim()}` : '',
      ]
        .filter(Boolean)
        .join(', ');

      // Encrypt password securely (Requirement 8)
      const encryptedPassword = devicePassword.trim()
        ? encryptPassword(devicePassword.trim())
        : undefined;

      // Check technician assignment
      const assignedTech = technicians.find((t) => t.id === Number(technicianId));

      // Determine initial status: If diagnostic is filled, can move to Diagnosing
      const hasDiagnosis = Boolean(rootCause.trim() || proposedSolution.trim() || techDefectDescription.trim());
      const initialStatus = hasDiagnosis && proposedSolution.trim() ? 'Diagnosing' : 'Received';

      // Create ticket on server first so printed receipt has authoritative id & ticket_code (UC-08)
      const newTicket = await StorageService.createTicketAsync({
        customer_id: finalCustomer.id,
        customer_name: finalCustomer.name,
        customer_phone: finalCustomer.phone,
        customer_address: finalCustomer.address,
        device_id: device.id,
        device_model: device.model_name,
        device_category: finalCategoryName,
        device_brand: finalBrandName,
        device_serial: device.serial_number,
        device_color: device.color,
        created_by_id: currentUser?.id || 1,
        created_by_name: currentUser?.full_name || 'Lễ tân tiếp nhận',
        primary_technician_id: assignedTech ? assignedTech.id : undefined,
        primary_technician_name: assignedTech ? assignedTech.full_name : undefined,
        status: initialStatus,
        priority,
        defect_description: defectDesc.trim(),
        initial_condition: combinedInitialCondition || 'Máy kiểm tra sơ bộ ban đầu',
        cosmetic_condition: cosmeticCond.trim(),
        accessories_included: accessories.trim(),
        device_password_hint: encryptedPassword,
        estimated_completion: estimatedDateTime ? new Date(estimatedDateTime).toISOString() : undefined,
        subtotal_amount: estimatedCost ? Number(estimatedCost) : 0,
        discount_amount: 0,
        final_amount: estimatedCost ? Number(estimatedCost) : 0,
        paid_amount: 0,
        debt_amount: estimatedCost ? Number(estimatedCost) : 0,
        is_warranty_claim: false,
      });

      // Save technical diagnosis if entered (Requirement 5)
      if (hasDiagnosis && assignedTech) {
        await StorageService.addDiagnosticAsync({
          ticket_id: newTicket.id,
          technician_id: assignedTech.id,
          technician_name: assignedTech.full_name,
          root_cause: rootCause.trim() || 'Kỹ thuật tiếp nhận chẩn đoán sơ bộ',
          proposed_solution: proposedSolution.trim() || 'Kiểm tra chi tiết linh kiện',
          estimated_cost: estimatedCost ? Number(estimatedCost) : 0,
          estimated_hours: 1,
          notes: techDefectDescription.trim() || undefined,
        });
      }

      showToast(`Đã tạo phiếu tiếp nhận thành công: ${newTicket.ticket_code}!`, 'success');
      setCreatedTicket(newTicket);
      setShowPrintModal(true);
    } catch (err: any) {
      showToast(err?.message || 'Không thể tạo phiếu tiếp nhận. Vui lòng thử lại!', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-100 text-indigo-700">
              QUY TRÌNH UC-08
            </span>
            <span className="text-xs text-slate-500">Mã tiếp nhận tự sinh chuẩn ISO</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mt-1">
            Tiếp nhận thiết bị sửa chữa (Tạo phiếu mới)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ghi nhận thông tin khách hàng, tình trạng ngoại quan, sự cố ban đầu và in phiếu hẹn A5/A4 kèm mã QR tra cứu.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ========================================================
            SECTION 1: THÔNG TIN KHÁCH HÀNG
        ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">1. Thông tin khách hàng</h3>
                <p className="text-[11px] text-slate-500">Tìm kiếm khách hàng cũ theo SĐT hoặc thêm khách hàng mới</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsNewCustomer(false)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  !isNewCustomer
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Khách hàng có sẵn
              </button>
              <button
                type="button"
                onClick={() => setIsNewCustomer(true)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition-all ${
                  isNewCustomer
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                + Khách hàng mới
              </button>
            </div>
          </div>

          {!isNewCustomer ? (
            <div>
              <SearchableSelect
                label="Chọn khách hàng từ hệ thống (Nhập tên hoặc SĐT tìm nhanh):"
                options={customerOptions}
                value={selectedCustomerId}
                onChange={(val) => setSelectedCustomerId(val ? Number(val) : '')}
                placeholder="-- Gõ tên khách hàng, công ty hoặc số điện thoại --"
                searchPlaceholder="Tìm theo tên, SĐT, địa chỉ hoặc mã khách..."
                emptyMessage="Không tìm thấy khách hàng nào"
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ tên / Tên Doanh nghiệp <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Nguyễn Văn An / Cty TNHH VinaTech"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Số điện thoại liên hệ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="VD: 0901234567"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa chỉ liên hệ / Giao trả máy
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường, phường, quận..."
                  value={custAddress}
                  onChange={(e) => setCustAddress(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phân loại khách hàng
                </label>
                <div className="flex gap-4 pt-1 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      checked={custType === 'individual'}
                      onChange={() => setCustType('individual')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Khách cá nhân</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-700">
                    <input
                      type="radio"
                      checked={custType === 'company'}
                      onChange={() => setCustType('company')}
                      className="text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Doanh nghiệp (Có MST)</span>
                  </label>
                </div>
                {custType === 'company' && (
                  <input
                    type="text"
                    placeholder="Nhập Mã số thuế công ty..."
                    value={taxNumber}
                    onChange={(e) => setTaxNumber(e.target.value)}
                    className="w-full mt-2 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            SECTION 2: THÔNG TIN THIẾT BỊ
        ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">2. Thông tin thiết bị</h3>
              <p className="text-[11px] text-slate-500">Phân loại máy, hãng sản xuất, dòng máy và mã định danh Serial/IMEI</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <SearchableSelect
                label="Loại thiết bị"
                required
                options={categoryOptions}
                value={selectedCategoryId}
                onChange={(val) => {
                  setSelectedCategoryId(val === 'other' ? 'other' : (isNaN(Number(val)) ? val : Number(val)));
                }}
                placeholder="-- Chọn loại máy --"
                searchPlaceholder="Tìm laptop, điện thoại, PC..."
              />
            </div>

            {isCustomCategory && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-semibold text-indigo-900 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Nhập loại thiết bị khác <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Tai nghe Bluetooth, Máy chiếu, Loa Marshall, PS5..."
                  value={customCategoryName}
                  onChange={(e) => setCustomCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-indigo-50/60 border border-indigo-300 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <SearchableSelect
                label="Hãng sản xuất"
                required
                options={brandOptions}
                value={selectedBrandId}
                onChange={(val) => {
                  setSelectedBrandId(val === 'other' ? 'other' : (isNaN(Number(val)) ? val : Number(val)));
                }}
                placeholder="-- Chọn hãng --"
                searchPlaceholder="Tìm Dell, Apple, Asus, HP..."
              />
            </div>

            {isCustomBrand && (
              <div className="animate-fadeIn">
                <label className="block text-xs font-semibold text-indigo-900 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  Nhập tên hãng sản xuất khác <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Sony, Xiaomi, Dyson, Nintendo, Sharp..."
                  value={customBrandName}
                  onChange={(e) => setCustomBrandName(e.target.value)}
                  className="w-full px-3.5 py-2 bg-indigo-50/60 border border-indigo-300 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-600 focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên dòng máy (Model) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: XPS 15 9500, iPhone 14 Pro Max..."
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số Serial / IMEI
              </label>
              <input
                type="text"
                placeholder="Dùng để đối soát và tra cứu bảo hành"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Màu sắc ngoại quan
              </label>
              <input
                type="text"
                placeholder="Xám không gian, Bạc, Đen, Tím..."
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:bg-white focus:border-indigo-500 focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* ========================================================
            SECTION 3: TÌNH TRẠNG TIẾP NHẬN & MÔ TẢ SỰ CỐ (Requirement 2 & 3)
        ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                3. Tình trạng tiếp nhận & Mô tả sự cố
              </h3>
              <p className="text-[11px] text-slate-500">
                Phân định rõ ràng giữa mô tả của khách hàng và kết quả kiểm tra sơ bộ của nhân viên
              </p>
            </div>
          </div>

          {/* NHÓM A: THÔNG TIN DO KHÁCH HÀNG CUNG CẤP (Requirement 3 & 4) */}
          <div className="p-4 bg-blue-50/40 rounded-xl border border-blue-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-blue-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                  A. Thông tin do khách hàng cung cấp
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                Khách khai báo
              </span>
            </div>

            {/* Trường 1: Lỗi khách hàng mô tả (Requirement 4: Giữ riêng biệt, không gộp) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800">
                  Lỗi khách hàng mô tả (Sự cố cần sửa chữa) <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-slate-500 italic">Bắt buộc nhập chính xác</span>
              </div>
              <textarea
                required
                rows={3}
                placeholder="Mô tả chi tiết biểu hiện lỗi theo lời kể của khách hàng (VD: Máy đang dùng 10 phút sập nguồn đột ngột, bàn phím kẹt phím Space, màn hình chớp nháy...)"
                value={defectDesc}
                onChange={(e) => setDefectDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs leading-relaxed focus:border-indigo-600 focus:ring-1 focus:ring-indigo-500 focus:outline-hidden transition-all shadow-xs"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trường 2: Phụ kiện khách gửi kèm */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Phụ kiện khách gửi kèm
                </label>
                <input
                  type="text"
                  placeholder="VD: Củ sạc zin 65W, cáp dù, túi chống sốc..."
                  value={accessories}
                  onChange={(e) => setAccessories(e.target.value)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:border-indigo-500 focus:outline-hidden"
                />
                {/* Accessory quick tags */}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {ACCESSORY_PRESETS.map((acc) => (
                    <button
                      key={acc}
                      type="button"
                      onClick={() => {
                        if (accessories.includes(acc)) return;
                        setAccessories(accessories ? `${accessories}, ${acc}` : acc);
                      }}
                      className="text-[10px] px-2 py-0.5 bg-white hover:bg-blue-50 text-slate-600 border border-slate-200 rounded-md transition-colors"
                    >
                      + {acc}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trường 3: Mật khẩu thiết bị / BIOS (Requirement 8) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    Mật khẩu thiết bị / BIOS (Nếu có)
                  </label>
                  <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                    Bảo mật mã hóa
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mã PIN, mật khẩu chữ, hình vẽ mở máy..."
                    value={devicePassword}
                    onChange={(e) => setDevicePassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:border-indigo-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-indigo-500 shrink-0" />
                  Mật khẩu được mã hóa an toàn, không hiển thị trên phiếu in hoặc cổng tra cứu công khai.
                </p>
              </div>
            </div>
          </div>

          {/* NHÓM B: THÔNG TIN DO NHÂN VIÊN TIẾP NHẬN GHI NHẬN (Requirement 3 & 9) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/90 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  B. Thông tin do nhân viên tiếp nhận ghi nhận
                </h4>
              </div>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                Kiểm tra đối chiếu lúc nhận
              </span>
            </div>

            {/* Trường 1: Tình trạng máy lúc nhận (Requirement 9: Presets theo loại máy, multi-select, giữ data khi đổi category) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-600" />
                  Tình trạng máy lúc nhận (Nguồn, Màn hình, Âm thanh, Sạc...)
                </label>
                <span className="text-[10px] text-slate-500">
                  Gợi ý cho {categories.find((c) => c.id === selectedCategoryId)?.name || 'thiết bị'}:
                </span>
              </div>

              {/* Tag preset suggestions */}
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-white rounded-xl border border-slate-200">
                {suggestedConditions.map((cond) => {
                  const isSelected = selectedConditions.includes(cond);
                  return (
                    <button
                      key={cond}
                      type="button"
                      onClick={() => handleToggleCondition(cond)}
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      {cond}
                    </button>
                  );
                })}
              </div>

              {/* Custom notes for condition */}
              <div>
                <input
                  type="text"
                  placeholder="Ghi chú thêm tình trạng máy lúc nhận (tùy chỉnh)..."
                  value={customConditionNote}
                  onChange={(e) => setCustomConditionNote(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs focus:border-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>

            {/* Trường 2: Ngoại quan thiết bị */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Ngoại quan thiết bị (Vết trầy xước, nứt móp, cấn vỏ)
              </label>
              <input
                type="text"
                value={cosmeticCond}
                onChange={(e) => setCosmeticCond(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:border-indigo-500 focus:outline-hidden"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {COSMETIC_PRESETS.map((cos) => (
                  <button
                    key={cos}
                    type="button"
                    onClick={() => setCosmeticCond(cos)}
                    className="text-[10px] px-2 py-0.5 bg-white hover:bg-slate-200 text-slate-600 border border-slate-200 rounded-md transition-colors"
                  >
                    {cos}
                  </button>
                ))}
              </div>
            </div>

            {/* Trường 3 & 4: Mức độ ưu tiên & Thời gian hẹn trả (Requirement 7) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Mức độ ưu tiên xử lý
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as RepairPriority)}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:border-indigo-500 focus:outline-hidden"
                >
                  <option value="Normal">Bình thường (Tiêu chuẩn)</option>
                  <option value="High">Ưu tiên cao</option>
                  <option value="Urgent">Khẩn cấp (Lấy ngay trong ngày)</option>
                  <option value="Low">Thấp (Xử lý khi rảnh)</option>
                </select>
              </div>

              {/* Requirement 7: Lựa chọn nhanh + Datetime cụ thể + Tự động đồng bộ */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Thời gian hẹn trả dự kiến
                </label>

                {/* Quick days selector buttons */}
                <div className="flex items-center gap-1.5 mb-2">
                  {[1, 2, 3, 5].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => handleSelectQuickDays(days)}
                      className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold border transition-all text-center ${
                        estimatedDays === days
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      +{days} ngày
                    </button>
                  ))}
                </div>

                {/* Specific Datetime Input */}
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="datetime-local"
                    value={estimatedDateTime}
                    onChange={(e) => handleCustomDateTimeChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                {estimatedDateTime && (
                  <p className="text-[10px] text-indigo-900 font-medium mt-1">
                    Dự kiến trả: <strong>{formatDateTime(new Date(estimatedDateTime).toISOString())}</strong>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================
            SECTION 4: KIỂM TRA & CHẨN ĐOÁN KỸ THUẬT (Requirement 5, 6, 10)
            Dạng Accordion mở rộng / thu gọn, không bắt buộc ban đầu
        ======================================================== */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all">
          <button
            type="button"
            onClick={() => setIsDiagnosticOpen(!isDiagnosticOpen)}
            className="w-full p-6 text-left flex items-center justify-between hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Wrench className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    4. Kiểm tra & Chẩn đoán kỹ thuật
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                    Tùy chọn bổ sung
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Nhập nếu thiết bị đã được kỹ thuật viên kiểm tra sơ bộ ngay tại quầy (Không bắt buộc khi tạo phiếu)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-indigo-600 hidden sm:inline">
                {isDiagnosticOpen ? 'Thu gọn' : 'Mở rộng chi tiết'}
              </span>
              {isDiagnosticOpen ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </div>
          </button>

          {isDiagnosticOpen && (
            <div className="p-6 pt-0 border-t border-slate-100 space-y-4 text-xs animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                {/* Kỹ thuật viên phụ trách */}
                <div>
                  <SearchableSelect
                    label="Kỹ thuật viên phụ trách kiểm tra"
                    options={techOptions}
                    value={technicianId}
                    onChange={(val) => setTechnicianId(val ? Number(val) : '')}
                    placeholder="-- Chọn hoặc tìm kiếm kỹ thuật viên --"
                    searchPlaceholder="Nhập tên hoặc SĐT kỹ thuật viên..."
                  />
                </div>

                {/* Thời gian kiểm tra */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Thời gian kiểm tra
                  </label>
                  <div className="relative">
                    <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="datetime-local"
                      value={inspectionTime}
                      onChange={(e) => setInspectionTime(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Kỹ thuật mô tả lỗi */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kỹ thuật mô tả lỗi (Góc nhìn chuyên môn)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ghi nhận chuyên môn của KTV (VD: Đo dòng ăn 0.05A không nhảy áp, chập đường 19V...)"
                  value={techDefectDescription}
                  onChange={(e) => setTechDefectDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nguyên nhân lỗi */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nguyên nhân lỗi (Root Cause)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="VD: Chập tụ lọc nguồn, đứt cáp tín hiệu màn hình..."
                    value={rootCause}
                    onChange={(e) => setRootCause(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>

                {/* Phương án sửa chữa đề xuất */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phương án sửa chữa đề xuất
                  </label>
                  <textarea
                    rows={2}
                    placeholder="VD: Thay thế tụ lọc nguồn 19V, vệ sinh sấy khô mạch..."
                    value={proposedSolution}
                    onChange={(e) => setProposedSolution(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:border-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Dự toán chi phí sơ bộ */}
              <div className="max-w-xs">
                <label className="block font-semibold text-slate-700 mb-1">
                  Ước tính chi phí sơ bộ (VND)
                </label>
                <CurrencyInput
                  value={estimatedCost}
                  onChange={(val) => setEstimatedCost(val)}
                  min={0}
                  placeholder="VD: 500.000"
                  showInWords={false}
                  quickPresets={[200000, 350000, 500000, 1000000]}
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-500">
            * Sau khi tạo phiếu, hệ thống sẽ mở bản in phiếu tiếp nhận A5/A4 kèm mã QR tra cứu.
          </p>
          <button
            type="submit"
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer text-sm"
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
