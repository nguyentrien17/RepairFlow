import React, { useState, useMemo } from 'react';
import { StorageService } from '../../services/mockStorage';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import {
  Part,
  InventoryBatch,
  Customer,
  PaymentMethod,
  RetailSaleOrder,
  RetailSaleOrderItem,
  User as UserType,
} from '../../types';
import {
  Store,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Printer,
  BadgePercent,
  CheckCircle2,
  CreditCard,
  QrCode,
  UserPlus,
  Tag,
  Boxes,
  Laptop,
  Sparkles,
  Receipt,
  RotateCcw,
  UserCheck,
  PlusCircle,
  ArrowRightLeft,
  ShieldCheck,
  Filter,
  Undo2,
} from 'lucide-react';
import { SearchableSelect, SearchableOption } from '../../components/common/SearchableSelect';
import { CurrencyInput } from '../../components/common/CurrencyInput';
import { formatVND, formatDateTime } from '../../utils/formatters';
import { RetailSalePrintModal } from '../../components/print/RetailSalePrintModal';
import { QuickAddCustomerModal } from '../../components/customers/QuickAddCustomerModal';
import { CustomItemModal, CustomSaleItem } from '../../components/sales/CustomItemModal';
import { RefundOrderModal } from '../../components/sales/RefundOrderModal';

export const RetailSalesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'pos' | 'history'>('pos');

  // Master Data
  const [parts, setParts] = useState<Part[]>(() => StorageService.getParts());
  const [customersList, setCustomersList] = useState<Customer[]>(() => StorageService.getCustomers());
  const storeUsers = StorageService.getUsers();
  const settings = StorageService.getSettings();

  // Modals State
  const [isQuickCustomerOpen, setIsQuickCustomerOpen] = useState(false);
  const [isCustomItemOpen, setIsCustomItemOpen] = useState(false);
  const [refundingOrder, setRefundingOrder] = useState<RetailSaleOrder | null>(null);

  // Filter Catalog State
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<'all' | 'part' | 'device' | 'accessory'>('all');

  // Customer State for POS Cart
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(2); // Default: Anh Hoàng Tuấn Minh
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [customCustomerName, setCustomCustomerName] = useState('Khách vãng lai');
  const [customCustomerPhone, setCustomCustomerPhone] = useState('0900000000');

  // Salesperson / Cashier
  const [selectedSalespersonId, setSelectedSalespersonId] = useState<number>(currentUser?.id || 1);

  // Cart Items State
  const [cartItems, setCartItems] = useState<
    {
      part_id: number;
      batch_id?: number;
      batch_code?: string;
      product_name: string;
      sku: string;
      item_type: 'part' | 'device' | 'accessory';
      quantity: number;
      max_stock: number;
      cost_price: number;
      unit_price: number;
      serial_number: string;
      warranty_months: number;
      return_days: number;
      specs?: string;
    }[]
  >([]);

  // Trade-In (Thu cũ đổi mới)
  const [enableTradeIn, setEnableTradeIn] = useState(false);
  const [tradeInDeviceName, setTradeInDeviceName] = useState('');
  const [tradeInSerial, setTradeInSerial] = useState('');
  const [tradeInAllowance, setTradeInAllowance] = useState<number | ''>('');

  // Checkout Financial State
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [promoCodeInput, setPromoCodeInput] = useState<string>('');
  const [appliedPromo, setAppliedPromo] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Bank_Transfer');
  const [paidAmountInput, setPaidAmountInput] = useState<number | ''>('');
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Print Modal
  const [printedOrder, setPrintedOrder] = useState<RetailSaleOrder | null>(null);

  // Retail Orders History State
  const [ordersHistory, setOrdersHistory] = useState<RetailSaleOrder[]>(() => StorageService.getRetailOrders());
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'Paid' | 'Unpaid' | 'Partial'>('all');

  // Searchable Customer Options
  const customerOptions: SearchableOption[] = useMemo(() => {
    return customersList.map((c) => ({
      value: c.id,
      label: c.name,
      sublabel: `SĐT: ${c.phone}${c.current_debt > 0 ? ` • [Đang nợ: ${formatVND(c.current_debt)}]` : ''}`,
    }));
  }, [customersList]);

  // Combine Part & Batch Catalogs for POS Item Selection
  const posCatalog = useMemo(() => {
    const list: {
      part: Part;
      batch?: InventoryBatch;
      displayTitle: string;
      categoryType: 'part' | 'device' | 'accessory';
      batchCode?: string;
      remainingStock: number;
      price: number;
      cost: number;
    }[] = [];

    parts.forEach((p) => {
      const batches = StorageService.getBatches(p.id).filter((b) => b.remaining_quantity > 0);
      if (batches.length > 0) {
        batches.forEach((b) => {
          const isDev = p.category_name.toLowerCase().includes('máy') || p.category_name.toLowerCase().includes('laptop') || p.category_name.toLowerCase().includes('màn hình');
          const isAcc = p.category_name.toLowerCase().includes('sạc') || p.category_name.toLowerCase().includes('túi') || p.category_name.toLowerCase().includes('cáp');
          list.push({
            part: p,
            batch: b,
            displayTitle: `${p.name} [Lô ${b.batch_code}]`,
            categoryType: isDev ? 'device' : isAcc ? 'accessory' : 'part',
            batchCode: b.batch_code,
            remainingStock: b.remaining_quantity,
            price: b.selling_price || p.selling_price,
            cost: b.cost_price || p.cost_price,
          });
        });
      } else {
        const isDev = p.category_name.toLowerCase().includes('máy') || p.category_name.toLowerCase().includes('laptop') || p.category_name.toLowerCase().includes('màn hình');
        const isAcc = p.category_name.toLowerCase().includes('sạc') || p.category_name.toLowerCase().includes('túi') || p.category_name.toLowerCase().includes('cáp');
        list.push({
          part: p,
          displayTitle: p.name,
          categoryType: isDev ? 'device' : isAcc ? 'accessory' : 'part',
          remainingStock: p.stock_quantity,
          price: p.selling_price,
          cost: p.cost_price,
        });
      }
    });

    return list.filter((item) => {
      const matchSearch =
        item.displayTitle.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.part.sku.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        (item.part.compatible_models && item.part.compatible_models.toLowerCase().includes(catalogSearch.toLowerCase()));

      const matchCat =
        catalogCategory === 'all' ? true : item.categoryType === catalogCategory;

      return matchSearch && matchCat;
    });
  }, [parts, catalogSearch, catalogCategory]);

  // Cart Total Calculations
  const subtotalCart = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
  }, [cartItems]);

  const tradeInDeduction = useMemo(() => {
    if (!enableTradeIn || !tradeInAllowance) return 0;
    return Number(tradeInAllowance);
  }, [enableTradeIn, tradeInAllowance]);

  const finalPayableCart = useMemo(() => {
    const payable = subtotalCart - discountAmount - tradeInDeduction;
    return Math.max(0, payable);
  }, [subtotalCart, discountAmount, tradeInDeduction]);

  const actualPaidCart = useMemo(() => {
    if (paidAmountInput === '' || paidAmountInput === undefined) return finalPayableCart;
    return Number(paidAmountInput);
  }, [paidAmountInput, finalPayableCart]);

  const debtRemainingCart = useMemo(() => {
    return Math.max(0, finalPayableCart - actualPaidCart);
  }, [finalPayableCart, actualPaidCart]);

  // Add Item to Cart
  const handleAddToCart = (item: (typeof posCatalog)[0]) => {
    if (item.remainingStock <= 0) {
      showToast('Mặt hàng này đã hết tồn kho!', 'error');
      return;
    }

    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (ci) => ci.part_id === item.part.id && ci.batch_id === item.batch?.id
      );

      if (existingIdx >= 0) {
        const copy = [...prev];
        if (copy[existingIdx].quantity + 1 > item.remainingStock) {
          showToast(`Chỉ còn ${item.remainingStock} sản phẩm trong kho/lô này!`, 'error');
          return prev;
        }
        copy[existingIdx].quantity += 1;
        return copy;
      } else {
        return [
          ...prev,
          {
            part_id: item.part.id,
            batch_id: item.batch?.id,
            batch_code: item.batch?.batch_code,
            product_name: item.part.name,
            sku: item.part.sku,
            item_type: item.categoryType,
            quantity: 1,
            max_stock: item.remainingStock,
            cost_price: item.cost,
            unit_price: item.price,
            serial_number: '',
            warranty_months: item.categoryType === 'device' ? 12 : 6,
            return_days: item.categoryType === 'device' ? (settings.default_return_days || 15) : (settings.default_return_days || 7),
          },
        ];
      }
    });

    showToast(`Đã thêm ${item.part.name} vào giỏ hàng!`, 'success');
  };

  // Add Custom Item (Pre-owned device / custom item)
  const handleAddCustomItem = (customItem: CustomSaleItem) => {
    setCartItems((prev) => [
      ...prev,
      {
        ...customItem,
        return_days: customItem.return_days ?? (settings.default_return_days || 15),
      },
    ]);
  };

  // Remove / Update Cart Item
  const handleRemoveCartItem = (idx: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateCartQty = (idx: number, qty: number) => {
    setCartItems((prev) => {
      const copy = [...prev];
      if (qty > copy[idx].max_stock) {
        showToast(`Tồn kho chỉ còn ${copy[idx].max_stock} cái!`, 'error');
        copy[idx].quantity = copy[idx].max_stock;
      } else {
        copy[idx].quantity = Math.max(1, qty);
      }
      return copy;
    });
  };

  // Apply Voucher Promo
  const handleApplyVoucher = (code: string) => {
    if (!code.trim()) return;
    const res = StorageService.validateAndCalculatePromotion(code, subtotalCart);
    if (!res.valid) {
      showToast(res.message || 'Mã ưu đãi không hợp lệ.', 'error');
      return;
    }
    setDiscountAmount(res.discountAmount);
    setAppliedPromo(code.toUpperCase());
    showToast(res.message || 'Áp dụng mã ưu đãi thành công.', 'success');
  };

  // Complete POS Order Checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      showToast('Giỏ hàng chưa có sản phẩm nào!', 'error');
      return;
    }

    let customerObj: Customer | undefined;
    if (isWalkIn) {
      if (!customCustomerName.trim() || !customCustomerPhone.trim()) {
        showToast('Vui lòng nhập tên và số điện thoại khách lẻ!', 'error');
        return;
      }
      customerObj = StorageService.addCustomer({
        name: customCustomerName.trim(),
        phone: customCustomerPhone.trim(),
        customer_type: 'individual',
        current_debt: 0,
      });
      // Refresh customer list
      setCustomersList(StorageService.getCustomers());
    } else {
      customerObj = customersList.find((c) => c.id === Number(selectedCustomerId));
      if (!customerObj) {
        showToast('Vui lòng chọn hoặc thêm mới khách hàng!', 'error');
        return;
      }
    }

    const salespersonObj = storeUsers.find((u) => u.id === selectedSalespersonId) || currentUser;

    const orderItemsList: RetailSaleOrderItem[] = cartItems.map((ci, idx) => ({
      id: idx + 1,
      item_type: ci.item_type,
      part_id: ci.part_id,
      batch_id: ci.batch_id,
      batch_code: ci.batch_code,
      product_name: ci.product_name,
      sku: ci.sku,
      serial_number: ci.serial_number.trim() || undefined,
      quantity: ci.quantity,
      cost_price: ci.cost_price,
      unit_price: ci.unit_price,
      subtotal: ci.unit_price * ci.quantity,
      warranty_months: ci.warranty_months,
      return_days: ci.return_days ?? (settings.default_return_days || 15),
    }));

    // Generate trade-in notes string if applicable
    let fullNotes = orderNotes.trim();
    if (enableTradeIn && tradeInAllowance) {
      const tradeNote = `[Thu cũ đổi mới]: ${tradeInDeviceName.trim() || 'Thiết bị cũ'} (Serial: ${tradeInSerial.trim() || 'KĐC'}) - Trợ giá thu mua: -${formatVND(Number(tradeInAllowance))}`;
      fullNotes = fullNotes ? `${fullNotes} | ${tradeNote}` : tradeNote;
    }

    const newOrder = StorageService.createRetailOrder({
      customer_id: customerObj.id,
      customer_name: customerObj.name,
      customer_phone: customerObj.phone,
      customer_address: customerObj.address,
      created_by_id: salespersonObj?.id || 1,
      created_by_name: salespersonObj?.full_name || 'Thu ngân tại quầy',
      subtotal_amount: subtotalCart,
      discount_amount: discountAmount + tradeInDeduction,
      promotion_code: appliedPromo || (enableTradeIn ? 'THU_CU_DOI_MOI' : undefined),
      final_amount: finalPayableCart,
      paid_amount: actualPaidCart,
      debt_amount: debtRemainingCart,
      payment_method: paymentMethod,
      payment_status: debtRemainingCart > 0 ? (actualPaidCart > 0 ? 'Partial' : 'Unpaid') : 'Paid',
      notes: fullNotes || undefined,
      warranty_months: Math.max(...cartItems.map((ci) => ci.warranty_months)),
      return_days: Math.max(...cartItems.map((ci) => ci.return_days ?? (settings.default_return_days || 15))),
      items: orderItemsList,
    });

    showToast(`Thanh toán đơn hàng ${newOrder.order_code} thành công!`, 'success');

    // Reset Form
    setCartItems([]);
    setDiscountAmount(0);
    setAppliedPromo('');
    setPromoCodeInput('');
    setPaidAmountInput('');
    setOrderNotes('');
    setEnableTradeIn(false);
    setTradeInDeviceName('');
    setTradeInSerial('');
    setTradeInAllowance('');
    setParts(StorageService.getParts());
    setOrdersHistory(StorageService.getRetailOrders());

    // Print Receipt
    setPrintedOrder(newOrder);
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return ordersHistory.filter((o) => {
      const matchSearch =
        o.order_code.toLowerCase().includes(historySearch.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(historySearch.toLowerCase()) ||
        o.customer_phone.includes(historySearch);

      const matchStatus =
        historyStatusFilter === 'all' ? true : o.payment_status === historyStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [ordersHistory, historySearch, historyStatusFilter]);

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
              POS BÁN HÀNG TẠI QUẦY
            </span>
            <span className="text-xs text-slate-500">Bán máy cũ/mới, linh kiện, phụ kiện & quản lý khách hàng</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2">
            <Store className="w-6 h-6 text-indigo-600" />
            <span>Bán Hàng & Bán Thiết Bị Tại Quầy</span>
          </h2>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'pos'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Màn hình Bán hàng (POS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Lịch sử hóa đơn ({ordersHistory.length})</span>
          </button>
        </div>
      </div>

      {activeTab === 'pos' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT 7 COLS: Catalog & Items Picker */}
          <div className="lg:col-span-7 space-y-4">
            {/* Search, Filter & Quick Add Custom Device */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Gõ tên máy, linh kiện, phụ kiện hoặc mã SKU để tìm nhanh..."
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 bg-slate-50 text-xs rounded-xl border border-slate-300 focus:bg-white focus:border-indigo-500 focus:outline-hidden font-medium"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setIsCustomItemOpen(true)}
                  className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Bán Máy/Hàng Ngoài Danh Mục</span>
                </button>
              </div>

              {/* Category Chips */}
              <div className="flex gap-1.5 overflow-x-auto text-xs font-bold pt-1 custom-scrollbar">
                {[
                  { id: 'all', label: 'Tất cả mặt hàng' },
                  { id: 'device', label: 'Laptop / Máy cũ mới' },
                  { id: 'part', label: 'Linh kiện thay thế' },
                  { id: 'accessory', label: 'Phụ kiện & Sạc' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCatalogCategory(cat.id as any)}
                    className={`px-3 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
                      catalogCategory === cat.id
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-2xs font-extrabold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
              {posCatalog.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-slate-500 px-1.5 py-0.2 bg-slate-100 rounded">
                        {item.part.sku}
                      </span>
                      {item.batchCode && (
                        <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200">
                          Lô: {item.batchCode}
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-indigo-600">
                      {item.displayTitle}
                    </h4>
                    {item.part.compatible_models && (
                      <p className="text-[10px] text-slate-500 line-clamp-1">Tương thích: {item.part.compatible_models}</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-extrabold text-indigo-700 block">{formatVND(item.price)}</span>
                      <span className={`text-[10px] font-semibold ${item.remainingStock > 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {item.remainingStock > 0 ? `Tồn kho: ${item.remainingStock} cái` : 'Hết hàng'}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={item.remainingStock <= 0}
                      onClick={() => handleAddToCart(item)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 shadow-2xs transition-all ${
                        item.remainingStock > 0
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Thêm
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT 5 COLS: POS Cart & Checkout */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Giỏ hàng thanh toán ({cartItems.length})</h3>
              </div>
              {cartItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCartItems([])}
                  className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Xóa giỏ
                </button>
              )}
            </div>

            {/* Customer Picker with "+ Thêm mới khách" Button */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <span>Khách hàng mua:</span>
                  <span className="text-rose-500">*</span>
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsWalkIn(false)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${!isWalkIn ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    Khách quen / Đã có
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsWalkIn(true)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${isWalkIn ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                  >
                    Khách vãng lai
                  </button>
                </div>
              </div>

              {!isWalkIn ? (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <div className="flex-1">
                      <SearchableSelect
                        options={customerOptions}
                        value={selectedCustomerId}
                        onChange={(val) => setSelectedCustomerId(val ? Number(val) : '')}
                        placeholder="-- Chọn khách mua hàng --"
                        searchPlaceholder="Tìm theo tên hoặc SĐT..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsQuickCustomerOpen(true)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] flex items-center gap-1 cursor-pointer whitespace-nowrap shadow-2xs"
                      title="Thêm nhanh khách hàng mới vào hệ thống"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>+ Khách Mới</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Họ tên khách <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Nguyễn Văn A *"
                      value={customCustomerName}
                      onChange={(e) => setCustomCustomerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-0.5">
                      Số điện thoại <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="0987654321 *"
                      value={customCustomerPhone}
                      onChange={(e) => setCustomCustomerPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-semibold"
                    />
                  </div>
                </div>
              )}

              {/* Salesperson Selection */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>NV Bán hàng / Tư vấn:</span>
                </span>
                <select
                  value={selectedSalespersonId}
                  onChange={(e) => setSelectedSalespersonId(Number(e.target.value))}
                  className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
                >
                  {storeUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cart Items List */}
            {cartItems.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto opacity-30" />
                <p className="font-medium">Chưa chọn sản phẩm nào trong giỏ hàng</p>
                <p className="text-[11px]">Bấm "+ Thêm" bên danh mục hoặc "+ Bán Máy Ngoài Danh Mục" để bắt đầu</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
                {cartItems.map((ci, idx) => (
                  <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h5 className="font-bold text-slate-900">{ci.product_name}</h5>
                        {ci.batch_code && (
                          <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200 mr-1">
                            Lô: {ci.batch_code}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-slate-500">SKU: {ci.sku}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCartItem(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="Xóa khỏi giỏ hàng"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Serial/IMEI, Warranty & Return Days */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">
                          Mã Serial / IMEI {ci.item_type === 'device' && <span className="text-rose-500">*</span>}:
                        </span>
                        <input
                          type="text"
                          placeholder="Mã máy..."
                          value={ci.serial_number}
                          onChange={(e) => {
                            const copy = [...cartItems];
                            copy[idx].serial_number = e.target.value;
                            setCartItems(copy);
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-300 rounded font-mono text-[11px] font-bold"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Bảo hành (tháng):</span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={120}
                              value={ci.warranty_months}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                const copy = [...cartItems];
                                copy[idx].warranty_months = val;
                                setCartItems(copy);
                              }}
                              className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded font-bold text-[11px] font-mono text-indigo-700 focus:border-indigo-500 focus:outline-hidden"
                              placeholder="Số tháng..."
                            />
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">th</span>
                          </div>
                          <div className="flex gap-0.5 overflow-x-auto text-[9px] font-semibold">
                            {[0, 1, 3, 6, 12, 24, 36].map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => {
                                  const copy = [...cartItems];
                                  copy[idx].warranty_months = m;
                                  setCartItems(copy);
                                }}
                                className={`px-1 py-0.2 rounded border transition-all cursor-pointer ${
                                  ci.warranty_months === m
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
                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Đổi trả (ngày):</span>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={365}
                              value={ci.return_days ?? (settings.default_return_days || 15)}
                              onChange={(e) => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                const copy = [...cartItems];
                                copy[idx].return_days = val;
                                setCartItems(copy);
                              }}
                              className="w-full px-2 py-0.5 bg-white border border-slate-300 rounded font-bold text-[11px] font-mono text-amber-700 focus:border-amber-500 focus:outline-hidden"
                              placeholder="Số ngày..."
                            />
                            <span className="text-[10px] font-bold text-slate-500 shrink-0">N</span>
                          </div>
                          <div className="flex gap-0.5 overflow-x-auto text-[9px] font-semibold">
                            {[0, 3, 7, 15, 30].map((d) => (
                              <button
                                key={d}
                                type="button"
                                onClick={() => {
                                  const copy = [...cartItems];
                                  copy[idx].return_days = d;
                                  setCartItems(copy);
                                }}
                                className={`px-1 py-0.2 rounded border transition-all cursor-pointer ${
                                  ci.return_days === d
                                    ? 'bg-amber-600 text-white border-amber-600 font-bold'
                                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {d === 0 ? '0N' : `${d}N`}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Unit Price & Qty Controls */}
                    <div className="flex items-center justify-between pt-1 font-bold">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(idx, ci.quantity - 1)}
                          className="p-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-bold font-mono">{ci.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(idx, ci.quantity + 1)}
                          className="p-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="text-indigo-700 font-extrabold">{formatVND(ci.unit_price * ci.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Trade-In / Thu cũ đổi mới */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableTradeIn}
                  onChange={(e) => setEnableTradeIn(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <ArrowRightLeft className="w-3.5 h-3.5 text-purple-600" />
                  <span>Áp dụng Thu Cũ Đổi Mới (Trợ giá máy thu lại)</span>
                </span>
              </label>

              {enableTradeIn && (
                <div className="space-y-2 pt-2 border-t border-slate-200 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Tên máy cũ thu lại *"
                      value={tradeInDeviceName}
                      onChange={(e) => setTradeInDeviceName(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                    />
                    <input
                      type="text"
                      placeholder="Serial/IMEI máy cũ"
                      value={tradeInSerial}
                      onChange={(e) => setTradeInSerial(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-500 font-bold block mb-0.5">Số tiền trợ giá / thu mua máy cũ (đ):</span>
                    <CurrencyInput
                      value={tradeInAllowance}
                      onChange={(val) => setTradeInAllowance(val)}
                      min={0}
                      placeholder="VD: 2.000.000"
                      showInWords={false}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Voucher & Discounts */}
            <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2 text-xs">
              <span className="font-bold text-indigo-950 block">Mã giảm giá / Voucher khuyến mãi:</span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nhập mã (VD: KHACHMOI30K)..."
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono font-bold uppercase text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleApplyVoucher(promoCodeInput)}
                  className="px-3 py-1.5 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 cursor-pointer text-xs"
                >
                  Áp dụng
                </button>
              </div>
            </div>

            {/* Checkout Totals */}
            <div className="space-y-2 pt-2 border-t border-slate-200 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Tổng tiền hàng:</span>
                <span className="font-bold">{formatVND(subtotalCart)}</span>
              </div>

              {tradeInDeduction > 0 && (
                <div className="flex justify-between text-purple-700 font-bold">
                  <span>Trừ giá thu máy cũ:</span>
                  <span>-{formatVND(tradeInDeduction)}</span>
                </div>
              )}

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Giảm giá / Voucher:</span>
                  <span>-{formatVND(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between font-extrabold text-sm text-slate-900 border-t border-slate-100 pt-1">
                <span>Khách phải thanh toán:</span>
                <span className="text-indigo-700 text-base">{formatVND(finalPayableCart)}</span>
              </div>

              {/* Payment Method Selector */}
              <div className="pt-2">
                <span className="font-bold text-slate-700 block mb-1">Phương thức thanh toán:</span>
                <div className="grid grid-cols-3 gap-1.5 font-bold">
                  {[
                    { id: 'Bank_Transfer', label: 'VietQR' },
                    { id: 'Cash', label: 'Tiền mặt' },
                    { id: 'POS_Card', label: 'Thẻ POS' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                      className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                        paymentMethod === m.id
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Received / Debt Calculation */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Số tiền khách đưa:</span>
                  <CurrencyInput
                    value={actualPaidCart}
                    onChange={(val) => setPaidAmountInput(val)}
                    min={0}
                    placeholder="VD: 1.000.000"
                    showInWords={false}
                  />
                </div>
                <div>
                  <span className="text-[11px] text-slate-500 font-semibold block">Ghi nợ lại:</span>
                  <div className={`px-3 py-2 rounded-xl border font-mono font-bold text-xs ${debtRemainingCart > 0 ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                    {debtRemainingCart > 0 ? formatVND(debtRemainingCart) : '0 đ (Đủ)'}
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Action Button */}
            <button
              type="button"
              disabled={cartItems.length === 0}
              onClick={handleCheckout}
              className={`w-full py-3 text-white font-extrabold rounded-xl text-sm shadow-md flex items-center justify-center gap-2 transition-all ${
                cartItems.length > 0
                  ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30 cursor-pointer active:scale-98'
                  : 'bg-slate-300 opacity-60 cursor-not-allowed shadow-none'
              }`}
            >
              <Receipt className="w-5 h-5" />
              <span>Thanh toán & In Hóa Đơn Hàng</span>
            </button>
          </div>
        </div>
      ) : (
        /* TAB 2: Sales History */
        <div className="space-y-4">
          {/* History Search & Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Tìm theo mã hóa đơn (HD-...), tên khách, số điện thoại..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 bg-slate-50 text-xs rounded-xl border border-slate-200 focus:bg-white focus:outline-hidden font-medium"
              />
            </div>

            <div className="flex items-center gap-2 text-xs font-bold w-full sm:w-auto">
              <span className="text-slate-500 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Trạng thái:</span>
              </span>
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="all">Tất cả hóa đơn</option>
                <option value="Paid">Đã thanh toán đủ</option>
                <option value="Partial">Thanh toán một phần / Nợ</option>
                <option value="Unpaid">Chưa thanh toán</option>
              </select>

              <span className="text-slate-400 ml-2">Tìm thấy {filteredHistory.length} hóa đơn</span>
            </div>
          </div>

          {/* History Orders Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
                <tr>
                  <th className="py-3 px-4">Mã Hóa đơn</th>
                  <th className="py-3 px-4">Ngày bán</th>
                  <th className="py-3 px-4">Khách hàng</th>
                  <th className="py-3 px-4">Sản phẩm bán</th>
                  <th className="py-3 px-4">Người bán</th>
                  <th className="py-3 px-4">Tổng thanh toán</th>
                  <th className="py-3 px-4">Trạng thái</th>
                  <th className="py-3 px-4 text-right">In hóa đơn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      Không tìm thấy hóa đơn bán lẻ phù hợp.
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((o) => (
                    <tr key={o.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-indigo-700">{o.order_code}</td>
                      <td className="py-3 px-4 text-slate-500">{formatDateTime(o.created_at)}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{o.customer_name}</div>
                        <div className="text-[11px] font-mono text-slate-500">{o.customer_phone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 max-w-xs">
                          {o.items.map((it, idx) => (
                            <div key={idx} className="text-[11px] font-medium text-slate-800">
                              • {it.product_name} (x{it.quantity})
                              {it.serial_number && <span className="text-purple-700 font-mono ml-1">[S/N: {it.serial_number}]</span>}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{o.created_by_name}</td>
                      <td className="py-3 px-4 font-mono font-extrabold text-slate-900">{formatVND(o.final_amount)}</td>
                      <td className="py-3 px-4">
                        {o.order_status === 'Refunded' ? (
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-rose-100 text-rose-800 border border-rose-200">
                            Đã hoàn trả ({formatVND(o.refund_amount || o.final_amount)})
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${o.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                            {o.payment_status === 'Paid' ? 'Đã thu đủ' : `Còn nợ: ${formatVND(o.debt_amount)}`}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => setPrintedOrder(o)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg border border-indigo-200 flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            In HD
                          </button>

                          {o.order_status === 'Refunded' ? (
                            <span className="text-[10px] font-bold text-rose-600 italic px-1">Đã trả hàng</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setRefundingOrder(o)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-lg border border-rose-200 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Khách hàng đổi ý/lỗi hàng, làm thủ tục trả hàng & hoàn tiền"
                            >
                              <Undo2 className="w-3.5 h-3.5" />
                              Trả hàng
                            </button>
                          )}
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

      {/* Quick Add Customer Modal */}
      <QuickAddCustomerModal
        isOpen={isQuickCustomerOpen}
        onClose={() => setIsQuickCustomerOpen(false)}
        onCustomerCreated={(newCustomer) => {
          setCustomersList(StorageService.getCustomers());
          setSelectedCustomerId(newCustomer.id);
          setIsWalkIn(false);
        }}
      />

      {/* Custom Item / Pre-owned Device Modal */}
      <CustomItemModal
        isOpen={isCustomItemOpen}
        onClose={() => setIsCustomItemOpen(false)}
        onAddCustomItem={handleAddCustomItem}
      />

      {/* Refund / Return Order Modal */}
      {refundingOrder && (
        <RefundOrderModal
          order={refundingOrder}
          onClose={() => setRefundingOrder(null)}
          onRefundSuccess={() => {
            setOrdersHistory(StorageService.getRetailOrders());
            setParts(StorageService.getParts());
          }}
        />
      )}

      {/* Print Invoice Modal */}
      {printedOrder && (
        <RetailSalePrintModal
          order={printedOrder}
          settings={settings}
          onClose={() => setPrintedOrder(null)}
        />
      )}
    </div>
  );
};
