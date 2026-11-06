import { RepairStatus, UserRole } from './types/index.js';
import { STATUS_CONFIG } from './constants.js';

export interface StatusTransitionOption {
  targetStatus: RepairStatus;
  label: string;
  shortLabel: string;
  description: string;
  badge?: string;
  variant: 'primary' | 'success' | 'warning' | 'danger' | 'purple' | 'info' | 'amber';
  isReverse?: boolean;
}

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: 'Quản trị viên',
  manager: 'Quản lý cửa hàng',
  technician: 'Kỹ thuật viên',
  receptionist: 'Lễ tân / Tiếp nhận (kiêm thu ngân)',
  cashier: 'Thu ngân',
};

export function getAllowedTransitions(
  currentStatus: RepairStatus,
  userRole: UserRole,
  isOverrideMode: boolean = false
): StatusTransitionOption[] {
  const rawRole = (userRole || 'receptionist').toLowerCase() as UserRole;
  const role: UserRole = rawRole === 'cashier' ? 'receptionist' : rawRole;
  const isAdminOrManager = role === 'admin' || role === 'manager';

  if (isAdminOrManager && isOverrideMode) {
    const allStatuses: RepairStatus[] = [
      'Received',
      'Diagnosing',
      'Waiting_Approval',
      'Waiting_Parts',
      'In_Progress',
      'Quality_Check',
      'Completed',
      'Ready_For_Pickup',
      'Delivered',
      'Cancelled',
    ];

    return allStatuses
      .filter((st) => st !== currentStatus)
      .map((st) => {
        const cfg = STATUS_CONFIG[st];
        const isCancel = st === 'Cancelled';
        const isBackward = cfg.step < (STATUS_CONFIG[currentStatus]?.step ?? 0);
        return {
          targetStatus: st,
          label: isCancel ? 'Hủy phiếu (Quản trị can thiệp)' : `Chuyển sang: ${cfg.label}`,
          shortLabel: cfg.label,
          description: `Quản trị can thiệp chuyển trực tiếp sang ${cfg.label}`,
          badge: 'Quản trị viên',
          variant: isCancel ? 'danger' : isBackward ? 'warning' : 'primary',
          isReverse: isBackward,
        };
      });
  }

  // --- 1. RECEIVED (Đã tiếp nhận) ---
  if (currentStatus === 'Received') {
    if (role === 'technician') {
      return [
        {
          targetStatus: 'Diagnosing',
          label: 'Nhận máy & Bắt đầu kiểm tra',
          shortLabel: 'Bắt đầu kiểm tra',
          description: 'Kỹ thuật viên nhận thiết bị vào bàn kỹ thuật và tiến hành tháo máy/đo kiểm',
          badge: 'Nhiệm vụ KTV',
          variant: 'primary',
        },
      ];
    }
    if (role === 'receptionist') {
      return [
        {
          targetStatus: 'Diagnosing',
          label: 'Bàn giao Kỹ thuật kiểm tra',
          shortLabel: 'Chuyển kiểm tra',
          description: 'Giao thiết bị cho Kỹ thuật viên phụ trách để chẩn đoán sự cố',
          badge: 'Lễ tân',
          variant: 'primary',
        },
        {
          targetStatus: 'Cancelled',
          label: 'Khách đổi ý hủy tiếp nhận',
          shortLabel: 'Hủy tiếp nhận',
          description: 'Khách hàng quyết định mang máy về ngay lúc nhận',
          badge: 'Hủy phiếu',
          variant: 'danger',
        },
      ];
    }
    return [
      {
        targetStatus: 'Diagnosing',
        label: 'Phân công & Chuyển kiểm tra',
        shortLabel: 'Chuyển kiểm tra',
        description: 'Chỉ định KTV và bắt đầu quy trình chẩn đoán lỗi',
        badge: 'Quản lý',
        variant: 'primary',
      },
      {
        targetStatus: 'Cancelled',
        label: 'Hủy phiếu sửa chữa',
        shortLabel: 'Hủy phiếu',
        description: 'Hủy phiếu tiếp nhận ban đầu',
        badge: 'Hủy phiếu',
        variant: 'danger',
      },
    ];
  }

  // --- 2. DIAGNOSING (Đang kiểm tra) ---
  if (currentStatus === 'Diagnosing') {
    if (role === 'technician') {
      return [
        {
          targetStatus: 'Waiting_Approval',
          label: 'Hoàn tất chẩn đoán & Gửi duyệt',
          shortLabel: 'Chờ khách duyệt',
          description: 'Đã xác định rõ lỗi, phương án khắc phục và chi phí ước tính',
          badge: 'Nhiệm vụ KTV',
          variant: 'warning',
        },
        {
          targetStatus: 'Waiting_Parts',
          label: 'Chờ đặt linh kiện đặc thù',
          shortLabel: 'Chờ linh kiện',
          description: 'Thiếu linh kiện hiếm/chuyên biệt cần đặt hàng từ kho tổng hoặc nhà cung cấp',
          badge: 'Kho / Linh kiện',
          variant: 'purple',
        },
        {
          targetStatus: 'Cancelled',
          label: 'Không thể sửa (Báo trả máy)',
          shortLabel: 'Không thể sửa',
          description: 'Thiết bị hư hỏng quá nặng/cháy nổ mainboard không còn khả năng khắc phục',
          badge: 'KTV đề xuất',
          variant: 'danger',
        },
      ];
    }
    if (role === 'receptionist') {
      return [
        {
          targetStatus: 'Waiting_Approval',
          label: 'Gửi báo giá & Chờ khách duyệt',
          shortLabel: 'Chờ khách duyệt',
          description: 'Cập nhật chẩn đoán của KTV và thông báo chi phí tới khách',
          badge: 'Lễ tân',
          variant: 'warning',
        },
        {
          targetStatus: 'Cancelled',
          label: 'Khách lấy lại máy không kiểm tra nữa',
          shortLabel: 'Khách lấy lại máy',
          description: 'Khách hàng đổi ý, yêu cầu ráp lại máy để lấy về',
          badge: 'Lễ tân',
          variant: 'danger',
        },
      ];
    }
    return [
      {
        targetStatus: 'Waiting_Approval',
        label: 'Chuyển Chờ khách duyệt',
        shortLabel: 'Chờ khách duyệt',
        description: 'Đã có kết quả kiểm tra, chờ khách hàng phản hồi',
        badge: 'Quản lý',
        variant: 'warning',
      },
      {
        targetStatus: 'In_Progress',
        label: 'Duyệt sửa ngay (Bỏ qua chờ)',
        shortLabel: 'Tiến hành sửa ngay',
        description: 'Khách VIP hoặc bảo hành cam kết từ trước, bắt đầu sửa chữa ngay',
        badge: 'Duyệt ngoại lệ',
        variant: 'primary',
      },
      {
        targetStatus: 'Cancelled',
        label: 'Hủy phiếu sửa chữa',
        shortLabel: 'Hủy phiếu',
        description: 'Hủy phiếu và hoàn trả thiết bị',
        badge: 'Hủy phiếu',
        variant: 'danger',
      },
    ];
  }

  // --- 3. WAITING_APPROVAL (Chờ khách duyệt) ---
  if (currentStatus === 'Waiting_Approval') {
    if (role === 'receptionist') {
      return [
        {
          targetStatus: 'In_Progress',
          label: 'Khách đã đồng ý - Bắt đầu sửa chữa',
          shortLabel: 'Khách đã duyệt (Sửa ngay)',
          description: 'Khách đã xác nhận qua điện thoại, Zalo hoặc ký duyệt báo giá',
          badge: 'Nhiệm vụ Lễ tân',
          variant: 'success',
        },
        {
          targetStatus: 'Waiting_Parts',
          label: 'Khách duyệt - Chờ linh kiện',
          shortLabel: 'Chờ linh kiện',
          description: 'Khách đồng ý sửa nhưng cần đợi linh kiện nhập về',
          badge: 'Lễ tân',
          variant: 'purple',
        },
        {
          targetStatus: 'Cancelled',
          label: 'Khách từ chối sửa - Hoàn trả máy',
          shortLabel: 'Khách từ chối (Hủy)',
          description: 'Khách hàng không đồng ý với chi phí hoặc phương án sửa chữa',
          badge: 'Hủy phiếu',
          variant: 'danger',
        },
      ];
    }
    if (role === 'technician') {
      return [
        {
          targetStatus: 'In_Progress',
          label: 'Khách đồng ý - Bắt đầu sửa chữa',
          shortLabel: 'Bắt đầu sửa chữa',
          description: 'Tiến hành thay thế linh kiện và sửa chữa theo báo giá đã duyệt',
          badge: 'KTV',
          variant: 'success',
        },
      ];
    }
    return [
      {
        targetStatus: 'In_Progress',
        label: 'Duyệt báo giá & Bắt đầu sửa',
        shortLabel: 'Bắt đầu sửa',
        description: 'Xác nhận khách đã đồng ý và chuyển KTV tiến hành',
        badge: 'Quản lý',
        variant: 'success',
      },
      {
        targetStatus: 'Waiting_Parts',
        label: 'Chờ linh kiện',
        shortLabel: 'Chờ linh kiện',
        description: 'Chờ đặt hàng linh kiện phục vụ sửa chữa',
        badge: 'Kho linh kiện',
        variant: 'purple',
      },
      {
        targetStatus: 'Cancelled',
        label: 'Khách từ chối - Hủy phiếu',
        shortLabel: 'Hủy phiếu',
        description: 'Hủy phiếu và làm thủ tục hoàn trả thiết bị',
        badge: 'Hủy phiếu',
        variant: 'danger',
      },
    ];
  }

  // --- 4. WAITING_PARTS (Chờ linh kiện) ---
  if (currentStatus === 'Waiting_Parts') {
    if (role === 'technician') {
      return [
        {
          targetStatus: 'In_Progress',
          label: 'Linh kiện đã về - Tiến hành sửa chữa',
          shortLabel: 'Linh kiện đã về (Sửa)',
          description: 'Đã nhận linh kiện từ kho hoặc nhà cung cấp, bắt đầu lắp ráp sửa chữa',
          badge: 'KTV',
          variant: 'success',
        },
        {
          targetStatus: 'Cancelled',
          label: 'Không có linh kiện - Hủy phiếu',
          shortLabel: 'Hết linh kiện (Hủy)',
          description: 'Nhà cung cấp báo hết hàng hoặc không tìm được linh kiện thay thế',
          badge: 'Hủy phiếu',
          variant: 'danger',
        },
      ];
    }
    if (role === 'receptionist') {
      return [
        {
          targetStatus: 'In_Progress',
          label: 'Kho đã giao linh kiện cho KTV',
          shortLabel: 'Đã có linh kiện',
          description: 'Xác nhận đã có linh kiện và bàn giao KTV sửa',
          badge: 'Lễ tân',
          variant: 'success',
        },
        {
          targetStatus: 'Cancelled',
          label: 'Khách không chờ được - Hủy phiếu',
          shortLabel: 'Khách không đợi (Hủy)',
          description: 'Khách đợi quá lâu hoặc cần máy gấp, yêu cầu trả lại máy',
          badge: 'Hủy phiếu',
          variant: 'danger',
        },
      ];
    }
    return [
      {
        targetStatus: 'In_Progress',
        label: 'Linh kiện sẵn sàng - Bắt đầu sửa',
        shortLabel: 'Tiến hành sửa',
        description: 'Chuyển thiết bị sang trạng thái sửa chữa',
        badge: 'Quản lý',
        variant: 'success',
      },
      {
        targetStatus: 'Cancelled',
        label: 'Hủy phiếu sửa chữa',
        shortLabel: 'Hủy phiếu',
        description: 'Hủy phiếu do không có phương án linh kiện phù hợp',
        badge: 'Hủy phiếu',
        variant: 'danger',
      },
    ];
  }

  // --- 5. IN_PROGRESS (Đang sửa chữa) ---
  if (currentStatus === 'In_Progress') {
    if (role === 'technician') {
      return [
        {
          targetStatus: 'Quality_Check',
          label: 'Hoàn tất sửa & Chuyển sang QC',
          shortLabel: 'Chuyển kiểm tra QC',
          description: 'Kỹ thuật viên đã sửa xong phần cứng/phần mềm, bàn giao máy sang bộ phận QC',
          badge: 'Nhiệm vụ KTV',
          variant: 'primary',
        },
        {
          targetStatus: 'Waiting_Parts',
          label: 'Phát sinh thiếu linh kiện',
          shortLabel: 'Chờ thêm linh kiện',
          description: 'Cần bổ sung thêm linh kiện phụ phát sinh trong quá trình sửa',
          badge: 'KTV',
          variant: 'purple',
        },
      ];
    }
    if (role === 'receptionist') {
      return [];
    }
    return [
      {
        targetStatus: 'Quality_Check',
        label: 'Chuyển sang Kiểm tra chất lượng (QC)',
        shortLabel: 'Chuyển QC',
        description: 'Xác nhận KTV hoàn tất và đưa vào quy trình kiểm định chất lượng',
        badge: 'Quản lý',
        variant: 'primary',
      },
      {
        targetStatus: 'Waiting_Approval',
        label: 'Phát sinh lỗi mới - Chờ duyệt lại',
        shortLabel: 'Báo lỗi phát sinh',
        description: 'Phát hiện thêm pan bệnh phức tạp hơn, cần tạm dừng để báo giá bổ sung',
        badge: 'Phát sinh',
        variant: 'warning',
      },
      {
        targetStatus: 'Cancelled',
        label: 'Hư hỏng không sửa được - Hủy phiếu',
        shortLabel: 'Hủy phiếu',
        description: 'Quản lý duyệt hủy khi quá trình sửa phát sinh sự cố không thể khắc phục',
        badge: 'Quản lý',
        variant: 'danger',
      },
    ];
  }

  // --- 6. QUALITY_CHECK (Kiểm tra chất lượng - QC) ---
  if (currentStatus === 'Quality_Check') {
    if (role === 'technician') {
      return [
        {
          targetStatus: 'Ready_For_Pickup',
          label: 'QC Đạt chuẩn - Báo khách đến nhận',
          shortLabel: 'QC Đạt (Chờ nhận)',
          description: 'Đã hoàn thành kiểm tra checklist đạt 100% tiêu chuẩn xuất xưởng',
          badge: 'Nhiệm vụ KTV',
          variant: 'success',
        },
        {
          targetStatus: 'In_Progress',
          label: 'QC Chưa đạt - Trả lại sửa thêm',
          shortLabel: 'QC Chưa đạt (Sửa lại)',
          description: 'Phát hiện chức năng chưa ổn định, trả lại để KTV tinh chỉnh sửa lại',
          badge: 'Yêu cầu làm lại',
          variant: 'warning',
          isReverse: true,
        },
      ];
    }
    if (role === 'receptionist') {
      return [
        {
          targetStatus: 'Ready_For_Pickup',
          label: 'Xác nhận QC Đạt & Báo khách nhận máy',
          shortLabel: 'Chờ khách nhận',
          description: 'Nhận máy từ khu kỹ thuật đưa ra tủ quầy và gửi tin nhắn/gọi khách đến nhận',
          badge: 'Lễ tân',
          variant: 'success',
        },
      ];
    }
    return [
      {
        targetStatus: 'Ready_For_Pickup',
        label: 'Duyệt QC Đạt - Chờ khách nhận',
        shortLabel: 'Chờ khách nhận',
        description: 'Duyệt xuất kho kỹ thuật sang quầy tiếp tân',
        badge: 'Quản lý',
        variant: 'success',
      },
      {
        targetStatus: 'In_Progress',
        label: 'QC Chưa đạt - Yêu cầu làm lại',
        shortLabel: 'Yêu cầu làm lại',
        description: 'Yêu cầu KTV khắc phục triệt để lỗi chưa đạt',
        badge: 'Yêu cầu làm lại',
        variant: 'warning',
        isReverse: true,
      },
    ];
  }

  // --- 7. READY_FOR_PICKUP (Chờ khách nhận) or COMPLETED ---
  if (currentStatus === 'Ready_For_Pickup' || currentStatus === 'Completed') {
    if (role === 'receptionist') {
      return [
        {
          targetStatus: 'Delivered',
          label: 'Thu đủ tiền & Bàn giao cho khách',
          shortLabel: 'Bàn giao máy & Thu tiền',
          description: 'Kiểm tra máy cùng khách hàng, thu số tiền còn lại, in hóa đơn và bàn giao',
          badge: 'Nhiệm vụ Lễ tân',
          variant: 'success',
        },
        {
          targetStatus: 'Quality_Check',
          label: 'Khách test phát hiện lỗi - Trả lại QC',
          shortLabel: 'Khách test có lỗi (Trả lại)',
          description: 'Khách kiểm tra tại quầy phát hiện chức năng chưa ưng ý, chuyển KTV kiểm tra lại',
          badge: 'Trả lại kỹ thuật',
          variant: 'warning',
          isReverse: true,
        },
      ];
    }
    if (role === 'technician') {
      return [];
    }
    return [
      {
        targetStatus: 'Delivered',
        label: 'Bàn giao máy cho khách (Duyệt thu/nợ)',
        shortLabel: 'Bàn giao cho khách',
        description: 'Xác nhận bàn giao và phê duyệt bảo lãnh công nợ nếu có',
        badge: 'Quản lý',
        variant: 'success',
      },
      {
        targetStatus: 'Quality_Check',
        label: 'Trả lại bộ phận Kỹ thuật / QC',
        shortLabel: 'Trả lại Kỹ thuật',
        description: 'Đưa máy quay lại bàn kỹ thuật kiểm tra lại',
        badge: 'Trả lại',
        variant: 'warning',
        isReverse: true,
      },
    ];
  }

  if (currentStatus === 'Delivered' || currentStatus === 'Cancelled') {
    return [];
  }

  return [];
}

export function isTransitionAllowedForRole(
  currentStatus: RepairStatus,
  targetStatus: RepairStatus,
  userRole: UserRole,
  isOverrideMode: boolean = false
): { allowed: boolean; reason?: string } {
  const rawRole = (userRole || 'receptionist').toLowerCase() as UserRole;
  const role: UserRole = rawRole === 'cashier' ? 'receptionist' : rawRole;
  if ((role === 'admin' || role === 'manager') && isOverrideMode) {
    return { allowed: true };
  }

  const allowedList = getAllowedTransitions(currentStatus, role, false);
  const isFound = allowedList.some((opt) => opt.targetStatus === targetStatus);

  if (isFound) {
    return { allowed: true };
  }

  const roleTitle = ROLE_DISPLAY_NAMES[role] || role;
  const targetLabel = STATUS_CONFIG[targetStatus]?.label || targetStatus;

  if (role === 'technician' && targetStatus === 'Delivered') {
    return {
      allowed: false,
      reason:
        'Kỹ thuật viên không có thẩm quyền bàn giao máy trực tiếp tại quầy và thu tiền. Trách nhiệm này thuộc về bộ phận Lễ tân / Tiếp nhận (kiêm thu ngân) hoặc Quản lý.',
    };
  }

  if (role === 'receptionist' && targetStatus === 'Quality_Check') {
    return {
      allowed: false,
      reason:
        'Giai đoạn Kiểm tra chất lượng (QC) và xác nhận linh kiện thuộc về Kỹ thuật viên phụ trách sửa chữa.',
    };
  }

  return {
    allowed: false,
    reason: `Tài khoản vai trò [${roleTitle}] không có quyền chuyển sang [${targetLabel}] ở giai đoạn này.`,
  };
}

export function getRoleAwaitingNotice(
  currentStatus: RepairStatus,
  userRole: UserRole
): { title: string; message: string; responsibleRole: string } | null {
  const rawRole = (userRole || 'receptionist').toLowerCase() as UserRole;
  const role: UserRole = rawRole === 'cashier' ? 'receptionist' : rawRole;

  if (currentStatus === 'In_Progress' && role === 'receptionist') {
    return {
      title: 'Thiết bị đang được Kỹ thuật viên sửa chữa',
      message:
        'Kỹ thuật viên đang xử lý phần cứng/phần mềm trên bàn kỹ thuật. Khi KTV hoàn tất và chuyển sang bước tiếp theo, bạn sẽ có quyền tiếp nhận để bàn giao cho khách.',
      responsibleRole: 'Kỹ thuật viên',
    };
  }

  if (currentStatus === 'Ready_For_Pickup' && role === 'technician') {
    return {
      title: 'Thiết bị đã chuyển ra quầy tiếp tân',
      message:
        'Thiết bị đã đạt tiêu chuẩn QC và đang được giữ tại quầy dịch vụ. Bộ phận Lễ tân / Tiếp nhận (kiêm thu ngân) sẽ đón khách, thu tiền và bàn giao máy.',
      responsibleRole: 'Lễ tân / Tiếp nhận (Thu ngân)',
    };
  }

  if (currentStatus === 'Delivered') {
    return {
      title: 'Thiết bị đã bàn giao hoàn tất',
      message:
        'Phiếu sửa chữa đã hoàn tất bàn giao cho khách hàng, đã thu tiền và kích hoạt thời hạn bảo hành điện tử.',
      responsibleRole: 'Hoàn tất quy trình',
    };
  }

  if (currentStatus === 'Cancelled') {
    return {
      title: 'Phiếu sửa chữa đã hủy',
      message:
        'Phiếu này đã được ghi nhận hủy và thiết bị đã hoàn trả cho khách hàng kèm biên bản lý do hủy.',
      responsibleRole: 'Đã đóng phiếu',
    };
  }

  return null;
}
