import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  HiOutlineExclamationCircle,
  HiOutlineCube,
  HiOutlineMagnifyingGlass,
  HiOutlineXMark,
  HiOutlineTruck,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineCalendarDays,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineUsers,
} from "react-icons/hi2";
import api from "../../api/config";
import { useAuth } from "../../context/auth-store";
import { useMaster } from "../../context/MasterContext";
import PaymentModal from "../../components/Payment/PaymentModal";
import ConfirmationModal from "../../components/Common/ConfirmationModal";
import { getDisplayName } from "../../utils/namePrivacy";
import { formatDate, formatTime } from "../../utils/dateFormat"; // Import utils
import OrderHeader from "../../components/Order/OrderHeader";
import OrderStatusBar from "../../components/Order/OrderStatusBar";
import OrderInfoCards from "../../components/Order/OrderInfoCards";
import OrderItemTable from "../../components/Order/OrderItemTable";
import OrderTechnicalSpecs from "../../components/Order/OrderTechnicalSpecs";
import OrderSidebar from "../../components/Order/OrderSidebar";

const OrderDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { getStatusLabel, statusColors, roleLabels } = useMaster();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Form states for Graphic specs
  const [editSpecs, setEditSpecs] = useState([]);
  const [uploadingField, setUploadingField] = useState(null); // 'artwork' or 'production'

  // Library states
  const [blocks, setBlocks] = useState([]);
  const [searchBlock, setSearchBlock] = useState("");
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);

  // Sales Action states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showStockIssueModal, setShowStockIssueModal] = useState(false);
  const [stockIssueReason, setStockIssueReason] = useState("");
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const [urgentNote, setUrgentNote] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [trackingNo, setTrackingNo] = useState("");

  // Rejection/Fail states
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectData, setRejectData] = useState({
    targetRole: "",
    reason: "",
    damagedCount: 0,
    isSalesError: false,
  });

  const [showBufferModal, setShowBufferModal] = useState(false);
  const [bufferLevel, setBufferLevel] = useState(0);

  // Production Worker Assignment Modal
  const [showProductionWorkerModal, setShowProductionWorkerModal] =
    useState(false);
  const [workerNameInput, setWorkerNameInput] = useState("");

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isDangerous: false,
    confirmLabel: "ยืนยัน (Confirm)",
  });

  const openConfirmModal = ({
    title,
    message,
    onConfirm,
    isDangerous = false,
    confirmLabel = "ยืนยัน (Confirm)",
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      isDangerous,
      confirmLabel,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/orders/${orderId}`);
      if (res.data.success) {
        const fetchedOrder = res.data.data.order;
        setOrder(fetchedOrder);
        setEditSpecs(fetchedOrder.positions || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "ไม่สามารถโหลดข้อมูลออเดอร์ได้");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const downloadJobSheet = async () => {
    try {
      const response = await api.get(`/orders/${orderId}/download/jobsheet`, {
        responseType: "blob",
      });

      if (response.data.type === "application/json") {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        alert(`เกิดข้อผิดพลาด: ${errorData.message}`);
        return;
      }

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `JobSheet-${order.jobId.replace("/", "-")}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("ไม่สามารถดาวน์โหลด Job Sheet ได้");
    }
  };

  const downloadCustomerProof = async () => {
    try {
      const response = await api.get(`/orders/${orderId}/download/proof`, {
        responseType: "blob",
      });

      if (response.data.type === "application/json") {
        const text = await response.data.text();
        const errorData = JSON.parse(text);
        alert(`เกิดข้อผิดพลาด: ${errorData.message}`);
        return;
      }

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `ProofSheet-${order.jobId.replace("/", "-")}.pdf`,
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      alert("ไม่สามารถดาวน์โหลด Proof Sheet ได้");
    }
  };

  const executeStatusUpdate = async (endpoint, payload = {}) => {
    try {
      setIsUpdating(true);

      let mappedEndpoint = endpoint;
      if (endpoint === "PENDING_STOCK_CHECK") mappedEndpoint = "print-signal";
      else if (endpoint === "STOCK_RECHECKED") mappedEndpoint = "stock-recheck";
      else if (endpoint === "PRODUCTION_FINISHED") {
        if (payload.pass !== undefined) mappedEndpoint = "qc-pass";
        else mappedEndpoint = "production-finish";
      } else if (endpoint === "READY_TO_SHIP") mappedEndpoint = "ready-to-ship";
      else if (endpoint === "COMPLETED") mappedEndpoint = "complete";
      else if (endpoint === "DIGITIZING_FINISHED")
        mappedEndpoint = "embroidery";
      // cancel and urgent already match backend routes

      await api.patch(`/orders/${orderId}/${mappedEndpoint}`, payload);
      await fetchOrder();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartProduction = async () => {
    if (!workerNameInput.trim()) {
      alert("กรุณาระบุชื่อผู้รับผิดชอบอย่างน้อย 1 คน");
      return;
    }
    const workers = workerNameInput
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    try {
      setIsUpdating(true);
      await api.patch(`/orders/${orderId}/production-start`, {
        workerNames: workers,
      });
      setShowProductionWorkerModal(false);
      await fetchOrder();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to start production");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateStatus = async (endpoint, payload = {}) => {
    let title = "ยืนยันการเปลี่ยนสถานะ";
    let message = "คุณต้องการเปลี่ยนสถานะออเดอร์ใช่หรือไม่?";
    let confirmLabel = "ยืนยัน (Confirm)";
    let shouldConfirm = false;

    switch (endpoint) {
      case "PENDING_STOCK_CHECK":
        title = "ยืนยันส่งฝ่ายสต็อก (Send to Stock)";
        message =
          "คุณตรวจสอบรายละเอียดครบถ้วนแล้ว และต้องการส่งออเดอร์นี้ให้ฝ่ายสต็อกดำเนินการต่อใช่หรือไม่?";
        confirmLabel = "ส่งสต็อก (Send)";
        shouldConfirm = true;
        break;
      case "STOCK_RECHECKED":
        title = "ยืนยันสต็อกครบ (Confirm Stock)";
        message =
          "คุณยืนยันว่าสินค้าในสต็อกมีเพียงพอและพร้อมสำหรับการผลิต/ดำเนินการต่อใช่หรือไม่?";
        confirmLabel = "ยืนยัน (Confirm)";
        shouldConfirm = true;
        break;
      case "PRODUCTION_FINISHED":
        if (payload.pass) {
          title = "ยืนยันผ่าน QC (QC Pass)";
          message =
            "คุณตรวจสอบงานแล้วว่ามีคุณภาพถูกต้องตามสเปค และพร้อมส่งต่อให้ฝ่ายจัดส่งใช่หรือไม่?";
          confirmLabel = "ผ่าน QC (Pass)";
        } else {
          title = "ยืนยันผลิตเสร็จ (Production Finished)";
          message =
            "คุณดำเนินการผลิตเสร็จเรียบร้อยและพร้อมส่งต่องานให้ฝ่าย QC ตรวจสอบใช่หรือไม่?";
          confirmLabel = "ยืนยัน (Confirm)";
        }
        shouldConfirm = true;
        break;
      case "READY_TO_SHIP":
        title = "ยืนยันรับงานเข้าฝ่ายจัดส่ง";
        message =
          "คุณได้รับสินค้าจากฝ่ายผลิต/QC เรียบร้อยแล้ว และพร้อมสำหรับการแพ็ค/จัดส่งใช่หรือไม่?";
        confirmLabel = "รับงาน (Receive)";
        shouldConfirm = true;
        break;
      case "COMPLETED": {
        title = "ยืนยันการจัดส่ง (Complete Order)";
        const trackingMsg = payload.trackingNo
          ? `เลขพัสดุ: ${payload.trackingNo}`
          : "";
        message = `คุณได้ทำการจัดส่งสินค้าเรียบร้อยแล้วใช่หรือไม่? ${trackingMsg}`;
        confirmLabel = "ยืนยันจัดส่ง (Complete)";
        shouldConfirm = true;
        break;
      }
      case "DIGITIZING_FINISHED":
        title = "ยืนยันการบันทึกงานตีลายเสร็จ";
        message =
          "คุณได้อัปโหลดไฟล์ตีลาย (.EMB) ครบถ้วนและพร้อมส่งต่องานแล้วใช่หรือไม่?";
        confirmLabel = "บันทึกเสร็จ (Finish)";
        shouldConfirm = true;
        break;
      case "cancel": // Handle cancel via existing modal structure, but if called directly:
        // note: bump urgent / cancel usually called via specific handlers, but if routed here:
        shouldConfirm = false;
        break;
      default:
        shouldConfirm = false;
    }

    if (shouldConfirm) {
      openConfirmModal({
        title,
        message,
        confirmLabel,
        onConfirm: () => executeStatusUpdate(endpoint, payload),
      });
    } else {
      executeStatusUpdate(endpoint, payload);
    }
  };

  const handleUpdateSpecs = async () => {
    try {
      setIsUpdating(true);
      await api.patch(`/orders/${orderId}/specs`, {
        embroideryDetails: editSpecs,
      });
      await fetchOrder();
    } catch {
      console.error("Failed to update specs");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateBuffer = async () => {
    try {
      setIsUpdating(true);
      await api.patch(`/orders/${orderId}/sla-buffer`, {
        bufferLevel: bufferLevel,
      });
      setShowBufferModal(false);
      await fetchOrder();
      alert("ปรับระดับ Buffer เรียบร้อยแล้ว");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update buffer");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReject = async () => {
    if (!rejectData.reason.trim()) return alert("กรุณาระบุเหตุผลที่ตีกลับ");
    if (!rejectData.targetRole) return alert("กรุณาระบุฝ่ายที่จะรับงานต่อ");

    openConfirmModal({
      title: "ยืนยันการตีกลับงาน (Confirm Return)",
      message: `คุณกำลังจะตีกลับงานนี้ไปยัง "${rejectData.targetRole === "GRAPHIC" ? "ฝ่ายกราฟิก" : rejectData.targetRole === "PRODUCTION" ? "ฝ่ายผลิต" : rejectData.targetRole === "STOCK" ? "ฝ่ายสต็อก" : "ฝ่ายตีลาย"}" พร้อมเหตุผลใช่หรือไม่?`,
      confirmLabel: "ยืนยันการคืนงาน",
      isDangerous: true,
      onConfirm: async () => {
        try {
          setIsUpdating(true);
          await api.patch(`/orders/${orderId}/reject`, rejectData);
          setShowRejectModal(false);
          setRejectData({
            targetRole: "",
            reason: "",
            damagedCount: 0,
            isSalesError: false,
          });
          await fetchOrder();
          alert("ตีกลับงานเรียบร้อยแล้ว");
        } catch (err) {
          alert(err.response?.data?.message || "บันทึกข้อมูลไม่สำเร็จ");
        } finally {
          setIsUpdating(false);
        }
      },
    });
  };

  const handleUpdatePurchasingInfo = async (eta, reason) => {
    try {
      setIsUpdating(true);
      await api.patch(`/orders/${orderId}/purchasing`, {
        purchasingEta: eta,
        purchasingReason: reason,
      });
      await fetchOrder();
    } catch (err) {
      alert(
        err.response?.data?.message || "ไม่สามารถอัปเดตข้อมูลการจัดซื้อได้",
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmArrival = async () => {
    openConfirmModal({
      title: "ยืนยันสินค้าเข้าคลัง (Confirm Delivery)",
      message:
        "คุณต้องการยืนยันว่าได้รับสินค้าตามจำนวนที่ถูกต้องและพร้อมดำเนินการในขั้นตอนถัดไปใช่หรือไม่?",
      confirmLabel: "ยืนยัน (Confirm)",
      onConfirm: async () => {
        try {
          setIsUpdating(true);
          await api.patch(`/orders/${orderId}/purchasing`, {
            confirmArrival: true,
          });
          await fetchOrder();
          alert("ยืนยันสินค้าเข้าคลังเรียบร้อยแล้ว");
        } catch (err) {
          alert(err.response?.data?.message || "ไม่สามารถยืนยันสินค้าเข้าได้");
        } finally {
          setIsUpdating(false);
        }
      },
    });
  };

  const handleClaim = async () => {
    openConfirmModal({
      title: "ยืนยันการรับงาน (Claim Task)",
      message:
        "คุณต้องการรับผิดชอบงานนี้ใช่หรือไม่? หลังจากกดรับงานแล้ว คุณจะสามารถแก้ไขข้อมูลและดำเนินการต่อได้",
      confirmLabel: "รับงาน (Claim)",
      onConfirm: async () => {
        let assignedWorkerName = null;
        if (isProductionRole) {
          assignedWorkerName = window.prompt(
            "ระบุชื่อพนักงานที่ได้รับมอบหมาย (ถ้ามี) / Assign to worker:",
          );
        }

        try {
          setIsUpdating(true);
          const res = await api.patch(`/orders/${orderId}/claim`, {
            assignedWorkerName,
          });
          if (res.data.status === "success" || res.data.success) {
            setOrder(res.data.data.order);
            alert("รับงานเรียบร้อยแล้วครับ");
          }
        } catch (err) {
          alert(err.response?.data?.message || "ไม่สามารถรับงานได้");
        } finally {
          setIsUpdating(false);
        }
      },
    });
  };

  const handleFileUpload = async (e, type) => {
    // 1. Multiple files for global embroidery
    if (type === "embroideryGlobal") {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      try {
        setUploadingField(type);
        const uploadedUrls = [];
        for (const file of files) {
          const formData = new FormData();
          formData.append("file", file);
          const uploadRes = await api.post(
            `/upload?folder=embroidery`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
          uploadedUrls.push(uploadRes.data.data.url);
        }
        const currentUrls = order.embroideryFileUrls || [];
        const payload = {
          embroideryFileUrls: [...currentUrls, ...uploadedUrls],
        };
        await api.patch(`/orders/${orderId}/specs`, payload);
        await fetchOrder();
      } catch {
        alert("File upload failed");
      } finally {
        setUploadingField(null);
      }
      return;
    }

    // 2. Position-specific EMB file
    if (type.startsWith("emb_")) {
      const file = e.target.files[0];
      if (!file) return;
      const idx = e.positionIndex;
      try {
        setUploadingField(type);
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await api.post(
          `/upload?folder=embroidery`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
          },
        );
        const newSpecs = [...editSpecs];
        if (!newSpecs[idx].embroideryFileUrls)
          newSpecs[idx].embroideryFileUrls = [];
        newSpecs[idx].embroideryFileUrls.push(uploadRes.data.data.url);
        setEditSpecs(newSpecs);

        // Auto save positional specs
        await api.patch(`/orders/${orderId}/specs`, { positions: newSpecs });
        await fetchOrder();
      } catch {
        alert("Upload failed");
      } finally {
        setUploadingField(null);
      }
      return;
    }

    // 3. Single Artwork Upload
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingField(type);
      const formData = new FormData();
      formData.append("file", file);

      const folder = type === "artwork" ? "artworks" : "general";
      const uploadRes = await api.post(`/upload?folder=${folder}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const fileUrl = uploadRes.data.data.url;
      const payload = type === "artwork" ? { artworkUrl: fileUrl } : {};

      if (Object.keys(payload).length > 0) {
        await api.patch(`/orders/${orderId}/specs`, payload);
        if (order.blockId && type === "artwork") {
          await api.patch(`/blocks/${order.blockId}`, payload);
        }
      }

      await fetchOrder();
    } catch {
      alert("File upload failed");
    } finally {
      setUploadingField(null);
    }
  };

  const fetchBlocks = useCallback(async () => {
    try {
      const res = await api.get(`/blocks?search=${searchBlock}`);
      setBlocks(res.data.data.blocks);
    } catch {
      alert("ไม่สามารถดึงข้อมูลบล็อกได้");
    }
  }, [searchBlock]);

  const handleLinkBlock = async (blockId) => {
    try {
      setIsUpdating(true);
      await api.post(`/blocks/link/${orderId}/${blockId}`);
      setIsLibraryOpen(false);
      await fetchOrder();
    } catch {
      alert("Linking block failed");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    if (isLibraryOpen) {
      fetchBlocks();
    }
  }, [searchBlock, isLibraryOpen, fetchBlocks]);

  const handleCancelOrder = async () => {
    if (!cancelReason) return alert("กรุณาระบุเหตุผลการยกเลิก");
    await handleUpdateStatus("cancel", { reason: cancelReason });
    setShowCancelModal(false);
  };

  const handleBumpUrgent = async () => {
    await handleUpdateStatus("urgent", { note: urgentNote });
    setShowUrgentModal(false);
  };

  const handleReportStockIssue = async () => {
    if (!stockIssueReason.trim()) return alert("กรุณาระบุรายละเอียดปัญหา");
    try {
      setIsUpdating(true);
      await api.patch(`/orders/${order.id}/status`, {
        status: "STOCK_ISSUE",
        reason: stockIssueReason,
      });
      setShowStockIssueModal(false);
      await fetchOrder();
      alert("แจ้งปัญหาสำเร็จแล้ว ฝ่ายขายจะได้รับทราบข้อมูลนี้ครับ");
    } catch (err) {
      alert(err.response?.data?.message || "แจ้งปัญหาไม่สำเร็จ");
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = statusColors[status] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
      label: status,
    };
    return (
      <span
        className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text}`}
      >
        {getStatusLabel(status)}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const statusConfig = {
      UNPAID: { bg: "bg-red-100", text: "text-red-700", label: "ยังไม่ชำระ" },
      PARTIALLY_PAID: {
        bg: "bg-orange-100",
        text: "text-orange-700",
        label: "มัดจำแล้ว/ยังไม่ครบ",
      },
      PAID: {
        bg: "bg-emerald-100",
        text: "text-emerald-700",
        label: "ชำระครบแล้ว",
      },
    };
    const config = statusConfig[status] || {
      bg: "bg-slate-100",
      text: "text-slate-700",
      label: status,
    };
    return (
      <span
        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${config.bg} ${config.text}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading && !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center animate-pulse">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-bold">กำลังดึงข้อมูลออเดอร์...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl text-center max-w-md w-full">
          <HiOutlineExclamationCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            เกิดข้อผิดพลาด
          </h2>
          <p className="text-slate-500 mb-6">{error || "ไม่พบข้อมูลออเดอร์"}</p>
          <button
            onClick={() => navigate("/orders")}
            className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-bold"
          >
            กลับไปหน้ารายการ
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "ADMIN";
  const isSalesRole = user?.role === "SALES";
  const isPurchasingRole = user?.role === "PURCHASING";
  const isGraphicRole = user?.role === "GRAPHIC";
  const isStockRole = user?.role === "STOCK";
  const isProductionRole = user?.role === "PRODUCTION";
  const isQCRole = user?.role === "SEWING_QC";
  const isDeliveryRole = user?.role === "DELIVERY";
  const isMarketingRole = user?.role === "MARKETING";
  const isFinanceRole = user?.role === "FINANCE";
  const isExecutiveRole = user?.role === "EXECUTIVE";
  const isDigitizerRole = user?.role === "DIGITIZER";

  const canViewTechnical =
    (isSalesRole ||
      isProductionRole ||
      isQCRole ||
      isGraphicRole ||
      isDigitizerRole ||
      isAdmin) &&
    !isPurchasingRole;

  const canViewFinancial =
    isSalesRole ||
    isPurchasingRole ||
    isQCRole ||
    isDeliveryRole ||
    isExecutiveRole ||
    isMarketingRole ||
    isFinanceRole ||
    isAdmin;

  const canViewOrderItems = !isGraphicRole;

  const isClaimedByMe = (claimId) => claimId === user?.id;

  const canPerformSalesAction = isSalesRole || isAdmin;
  const canPerformGraphicAction =
    (isGraphicRole && isClaimedByMe(order.graphicId)) || isAdmin;
  const canPerformDigitizerAction =
    (isDigitizerRole && isClaimedByMe(order.digitizerId)) || isAdmin;
  const canPerformStockAction =
    (isStockRole && isClaimedByMe(order.stockId)) || isAdmin;
  const canPerformProductionAction =
    (isProductionRole && isClaimedByMe(order.productionId)) || isAdmin;
  const canPerformQCAction = (isQCRole && isClaimedByMe(order.qcId)) || isAdmin;
  const canPerformDeliveryAction = isDeliveryRole || isAdmin;

  const technicalHeader = isProductionRole
    ? "รายละเอียดสเปคการผลิต (Production Specs)"
    : isQCRole
      ? "ข้อมูลประกอบการตรวจงาน (QC Specs)"
      : "รายละเอียดทางเทคนิค (Graphic Specification)";

  const latestRejection = order?.rejections?.[0];
  const isCurrentlyRejected =
    latestRejection &&
    ((latestRejection.toRole === "GRAPHIC" &&
      order.status === "PENDING_ARTWORK") ||
      (latestRejection.toRole === "PRODUCTION" &&
        order.status === "STOCK_RECHECKED") ||
      (latestRejection.toRole === "STOCK" &&
        order.status === "PENDING_STOCK_CHECK") ||
      (latestRejection.toRole === "DIGITIZER" &&
        order.status === "PENDING_DIGITIZING"));

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-20 overflow-x-hidden font-sans">
      <OrderHeader
        order={order}
        user={user}
        isAdmin={isAdmin}
        isUpdating={isUpdating}
        navigate={navigate}
        formatDate={formatDate}
        downloadCustomerProof={downloadCustomerProof}
        downloadJobSheet={downloadJobSheet}
        getDisplayName={getDisplayName}
        handleClaim={handleClaim}
        isGraphicRole={isGraphicRole}
        isStockRole={isStockRole}
        isProductionRole={isProductionRole}
        isQCRole={isQCRole}
        isDigitizerRole={isDigitizerRole}
      />

      {isCurrentlyRejected && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-rose-50 border-2 border-rose-200 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-6 shadow-lg animate-in slide-in-from-top-4 duration-500">
            <div className="bg-rose-600 p-4 rounded-2xl shadow-xl shadow-rose-200 shrink-0">
              <HiOutlineExclamationCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1">
                <span className="bg-rose-600 text-white px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm">
                  งานถูกส่งกลับ (Order Returned)
                </span>
                <span className="text-rose-400 font-bold text-xs">
                  จาก:{" "}
                  {roleLabels[latestRejection.fromRole] ||
                    latestRejection.fromRole}{" "}
                  ({latestRejection.user?.name})
                </span>
                {latestRejection.isSalesError && (
                  <span className="bg-amber-100 text-amber-700 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-tighter border border-amber-200">
                    ⚠️ ข้อมูลฝ่ายขายผิดพลาด
                  </span>
                )}
              </div>
              <h3 className="text-xl font-black text-rose-900 leading-tight">
                สาเหตุ: {latestRejection.reason}
              </h3>
              <p className="text-rose-500 font-bold text-sm mt-1">
                กรุณาตรวจสอบและแก้ไขข้อมูลให้ถูกต้องก่อนดำเนินการต่อครับ
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* SLA Alert Banner — conditionally rendered per role */}
        {user.role === "SALES"
          ? // SALES: Only show customer due date, no internal SLA warnings
            order.dueDate &&
            order.status !== "COMPLETED" &&
            order.status !== "CANCELLED" && (
              <div className="rounded-xl border px-4 py-3 flex items-center gap-4 bg-sky-50 border-sky-200 text-sky-700 shadow-sm">
                <div className="p-2 rounded-full bg-sky-100">
                  <HiOutlineCalendarDays className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[12px] font-bold uppercase tracking-wider opacity-80">
                    กำหนดส่งลูกค้า
                  </span>
                  <span className="text-lg font-black">
                    {new Date(order.dueDate).toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            )
          : order.sla &&
            order.sla.targetDeadline &&
            order.status !== "FINISHED" &&
            order.status !== "COMPLETED" &&
            order.status !== "CANCELLED" && (
              <div
                className={`rounded-xl border px-4 py-3 flex items-center justify-between shadow-sm ${
                  order.sla.isCompleted
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : order.sla.status === "RED"
                      ? "bg-rose-50 border-rose-200 text-rose-700"
                      : order.sla.status === "YELLOW"
                        ? "bg-amber-50 border-amber-200 text-amber-700"
                        : "bg-emerald-50 border-emerald-200 text-emerald-700"
                }`}
              >
                <div className="flex items-center gap-6">
                  {/* Target Deadline (Department Goal) */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        order.sla.isCompleted
                          ? "bg-emerald-100"
                          : order.sla.status === "RED"
                            ? "bg-rose-100"
                            : order.sla.status === "YELLOW"
                              ? "bg-amber-100"
                              : "bg-emerald-100"
                      }`}
                    >
                      {order.sla.isCompleted ? (
                        <HiOutlineCheckCircle className="w-5 h-5" />
                      ) : (
                        <HiOutlineClock className="w-5 h-5" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold uppercase tracking-wider opacity-80">
                        {order.sla.isCompleted
                          ? "ดำเนินการในส่วนของคุณเรียบร้อยแล้ว"
                          : "กำหนดเสร็จสิ้นขั้นตอนปัจจุบัน ภายใน"}
                      </span>
                      <span className="text-lg font-black">
                        {new Date(order.sla.targetDeadline).toLocaleDateString(
                          "th-TH",
                          {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Vertical Divider */}
                  <div className="h-10 w-px bg-current opacity-20 hidden md:block"></div>

                  {/* Main Due Date (Customer Limit) */}
                  {order.dueDate && (
                    <div className="hidden md:flex items-center gap-3 opacity-75">
                      <div className="p-2 rounded-full bg-white/50 border border-current">
                        <HiOutlineCalendarDays className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-bold uppercase tracking-wider opacity-80">
                          กำหนดส่งลูกค้า
                        </span>
                        <span className="text-lg font-black">
                          {new Date(order.dueDate).toLocaleDateString("th-TH", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Executive Buffer Control (Only for EXECUTIVE) */}
                {user.role === "EXECUTIVE" && (
                  <button
                    onClick={() => {
                      setBufferLevel(order.slaBufferLevel || 0);
                      setShowBufferModal(true);
                    }}
                    className="px-3 py-1.5 bg-white border border-current rounded-lg text-xs font-bold hover:bg-opacity-50 transition-colors"
                  >
                    Adjust Buffer ({order.slaBufferLevel || 0} days)
                  </button>
                )}
              </div>
            )}

        {/* Assigned Production Workers Display (Visible to Production only) */}
        {user.role === "PRODUCTION" &&
          order.assignedWorkerNames &&
          order.assignedWorkerNames.length > 0 && (
            <div className="erp-card p-4 bg-indigo-50 border-indigo-200 flex items-start gap-4 animate-erp-in mt-6">
              <div className="p-2 bg-indigo-100 rounded text-indigo-600">
                <HiOutlineUsers className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h4 className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">
                  รายชื่อลูกมือผู้รับผิดชอบการผลิต
                </h4>
                <div className="flex flex-wrap gap-2 mt-2">
                  {order.assignedWorkerNames.map((name, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-white border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold shadow-sm"
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        <OrderStatusBar
          order={order}
          user={user}
          isAdmin={isAdmin}
          isUpdating={isUpdating}
          handleUpdateStatus={handleUpdateStatus}
          handleClaim={handleClaim}
          setShowUrgentModal={setShowUrgentModal}
          setShowCancelModal={setShowCancelModal}
          setShowStockIssueModal={setShowStockIssueModal}
          setShowRejectModal={setShowRejectModal}
          setShowBufferModal={setShowBufferModal}
          setShowPaymentModal={setShowPaymentModal}
          setShowProductionWorkerModal={setShowProductionWorkerModal}
          trackingNo={trackingNo}
          setTrackingNo={setTrackingNo}
          canPerformSalesAction={canPerformSalesAction}
          canPerformGraphicAction={canPerformGraphicAction}
          canPerformDigitizerAction={canPerformDigitizerAction}
          canPerformStockAction={canPerformStockAction}
          canPerformProductionAction={canPerformProductionAction}
          canPerformQCAction={canPerformQCAction}
          canPerformDeliveryAction={canPerformDeliveryAction}
          isClaimedByMe={isClaimedByMe}
          getStatusBadge={getStatusBadge}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <OrderInfoCards order={order} />

          {order.actionMap?.canViewPreorder && order.hasPreorder && (
            <div
              className={`erp-card overflow-hidden ${order.preorderSubStatus === "ARRIVED" ? "bg-emerald-50/20 border-emerald-200" : "bg-amber-50/20 border-amber-200"}`}
            >
              <div
                className={`p-4 border-b flex items-center justify-between ${order.preorderSubStatus === "ARRIVED" ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"}`}
              >
                <div className="flex items-center gap-2">
                  <HiOutlineTruck
                    className={`w-5 h-5 ${order.preorderSubStatus === "ARRIVED" ? "text-emerald-600" : "text-amber-600"}`}
                  />
                  <h3
                    className={`font-black text-sm uppercase tracking-wide ${order.preorderSubStatus === "ARRIVED" ? "text-emerald-900" : "text-amber-900"}`}
                  >
                    จัดการสถานะสินค้าสั่งผลิต (Procurement Management)
                  </h3>
                </div>
                {order.preorderSubStatus === "ARRIVED" ? (
                  <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                    สินค้าเข้าคลังแล้ว
                  </span>
                ) : (
                  <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter animate-pulse">
                    ดำเนินการสั่งซื้อ โปรดรอฝ่ายจัดซื้อบันทึกเข้าระบบ
                  </span>
                )}
              </div>

              <div className="p-6">
                <div
                  className={`mb-6 rounded-2xl p-4 border ${order.preorderSubStatus === "ARRIVED" ? "bg-emerald-100/50 border-emerald-200" : "bg-amber-100/50 border-amber-200"}`}
                >
                  <p
                    className={`text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2 ${order.preorderSubStatus === "ARRIVED" ? "text-emerald-700" : "text-amber-700"}`}
                  >
                    <HiOutlineCube className="w-4 h-4" />
                    สรุปรายการที่รอของเข้า (Inventory Shortage)
                  </p>
                  <div className="space-y-1.5">
                    {order.items
                      .filter((i) => i.isPreorder)
                      .map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs"
                        >
                          <span className="font-bold text-slate-700">
                            {item.productName} ({item.variant?.color}/
                            {item.variant?.size})
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full font-black ${order.preorderSubStatus === "ARRIVED" ? "bg-emerald-200 text-emerald-900" : "bg-amber-200 text-amber-900"}`}
                          >
                            สั่งเพิ่มอีก: {item.preorderQty} ตัว
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div
                  className={`grid grid-cols-1 ${
                    order.isDelayed &&
                    (order.actionMap?.canEditPreorder || order.purchasingEta) &&
                    order.preorderSubStatus !== "ARRIVED"
                      ? "md:grid-cols-2"
                      : "md:grid-cols-1"
                  } gap-6 mb-8`}
                >
                  {(order.actionMap?.canEditPreorder || order.purchasingEta) &&
                    order.preorderSubStatus !== "ARRIVED" && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                          <HiOutlineCalendarDays className="w-3.5 h-3.5" />
                          วันที่สินค้าจะเข้าคลัง (ETA)
                        </label>
                        <input
                          type="date"
                          className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-4 font-black text-lg text-indigo-600 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                          value={order.purchasingEta?.split("T")[0] || ""}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) =>
                            handleUpdatePurchasingInfo(
                              e.target.value,
                              order.purchasingReason,
                            )
                          }
                          disabled={
                            isUpdating || !order.actionMap?.canEditPreorder
                          }
                        />
                        <p className="text-[10px] text-slate-400 font-bold italic">
                          {!order.actionMap?.canEditPreorder
                            ? "* ติดตามความคืบหน้าจากฝ่ายจัดซื้อ"
                            : `* แก้ไขได้อีก ${2 - (order.purchasingEtaCount || 0)} ครั้ง`}
                        </p>
                      </div>
                    )}

                  {order.isDelayed && (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <HiOutlineChatBubbleBottomCenterText className="w-3.5 h-3.5" />
                        หมายเหตุจัดซื้อ / สาเหตุที่ล่าช้า (Purchasing Remarks)
                      </label>
                      <textarea
                        placeholder="ระบุความคืบหน้า..."
                        className="w-full bg-white border-2 border-slate-200 rounded-2xl px-5 py-3 font-bold text-slate-700 h-[80px] focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all placeholder:text-slate-300 placeholder:font-normal text-sm"
                        defaultValue={order.purchasingReason}
                        onBlur={(e) =>
                          handleUpdatePurchasingInfo(
                            order.purchasingEta,
                            e.target.value,
                          )
                        }
                        disabled={
                          isUpdating || !order.actionMap?.canEditPreorder
                        }
                      />
                    </div>
                  )}
                </div>

                {order.actionMap?.canEditPreorder &&
                  order.preorderSubStatus !== "ARRIVED" && (
                    <button
                      onClick={handleConfirmArrival}
                      disabled={isUpdating}
                      className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white rounded-[2rem] font-black shadow-xl shadow-emerald-200 transition-all flex items-center justify-center gap-3 group"
                    >
                      <HiOutlineTruck className="w-6 h-6 animate-bounce" />
                      <span>ยืนยันว่าสินค้ามาส่งแล้ว (Confirm Delivery)</span>
                    </button>
                  )}

                {!order.actionMap?.canEditPreorder &&
                  !isAdmin &&
                  order.preorderSubStatus !== "ARRIVED" && (
                    <div className="bg-slate-100 p-4 rounded-2xl text-center">
                      <p className="text-xs font-bold text-slate-500 italic">
                        * รอฝ่ายจัดซื้อยืนยันการรับสินค้าเมื่อของมาถึงหน้างาน
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}

          <OrderItemTable
            order={order}
            canViewOrderItems={canViewOrderItems && !isDigitizerRole}
          />

          <OrderTechnicalSpecs
            order={order}
            user={user}
            isAdmin={isAdmin}
            isUpdating={isUpdating}
            editSpecs={editSpecs}
            setEditSpecs={setEditSpecs}
            uploadingField={uploadingField}
            handleFileUpload={handleFileUpload}
            handleUpdateSpecs={handleUpdateSpecs}
            isLibraryOpen={isLibraryOpen}
            setIsLibraryOpen={setIsLibraryOpen}
            searchBlock={searchBlock}
            setSearchBlock={setSearchBlock}
            blocks={blocks}
            handleLinkBlock={handleLinkBlock}
            canPerformGraphicAction={canPerformGraphicAction}
            canPerformDigitizerAction={canPerformDigitizerAction}
            canViewTechnical={canViewTechnical}
            technicalHeader={technicalHeader}
            isGraphicRole={isGraphicRole}
            isDigitizerRole={isDigitizerRole}
          />
        </div>

        <OrderSidebar
          order={order}
          user={user}
          canViewFinancial={canViewFinancial}
          getPaymentStatusBadge={getPaymentStatusBadge}
          formatDate={formatDate}
          formatTime={formatTime}
        />
      </div>

      {/* MODALS */}
      {showCancelModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-800 mb-4">
              ยกเลิกออเดอร์
            </h2>
            <textarea
              className="w-full px-6 py-4 bg-slate-50 border rounded-3xl font-bold h-32 focus:ring-4 focus:ring-red-100 outline-none"
              placeholder="ระบุเหตุผลการยกเลิก..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-600"
              >
                ปิด
              </button>
              <button
                onClick={handleCancelOrder}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg"
                disabled={isUpdating}
              >
                ยืนยันการยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}

      {showPaymentModal && (
        <PaymentModal
          order={order}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            fetchOrder();
          }}
        />
      )}

      {showUrgentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-slate-800 mb-4">
              เร่งออเดอร์
            </h2>
            <textarea
              className="w-full px-6 py-4 bg-amber-50 border border-amber-100 rounded-3xl font-bold h-32 focus:ring-4 focus:ring-amber-200 outline-none"
              placeholder="หมายเหตุเร่งด่วน...."
              value={urgentNote}
              onChange={(e) => setUrgentNote(e.target.value)}
            />
            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowUrgentModal(false)}
                className="flex-1 py-4 bg-slate-100 rounded-2xl font-black text-slate-600"
              >
                ปิด
              </button>
              <button
                onClick={handleBumpUrgent}
                className="flex-1 py-4 bg-amber-600 text-white rounded-2xl font-black shadow-lg"
                disabled={isUpdating}
              >
                ส่งสัญญาณเร่งด่วน
              </button>
            </div>
          </div>
        </div>
      )}
      {showRejectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                <HiOutlineXMark className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">
                ตีกลับงาน / แจ้งแก้ไข
              </h3>
            </div>

            <div className="mb-6 space-y-4">
              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                  1. ส่งกลับไปแก้ไขที่ฝ่ายไหน? (Target Role)
                </label>
                <div className="flex flex-wrap gap-2">
                  {(isQCRole || isAdmin) && (
                    <button
                      onClick={() =>
                        setRejectData((prev) => ({
                          ...prev,
                          targetRole: "PRODUCTION",
                        }))
                      }
                      className={`px-4 py-2.5 rounded-xl font-black border-2 transition-all text-xs ${
                        rejectData.targetRole === "PRODUCTION"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                          : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      ฝ่ายผลิต
                    </button>
                  )}
                  {(isQCRole || isProductionRole || isStockRole || isAdmin) && (
                    <button
                      onClick={() =>
                        setRejectData((prev) => ({
                          ...prev,
                          targetRole: "GRAPHIC",
                        }))
                      }
                      className={`px-4 py-2.5 rounded-xl font-black border-2 transition-all text-xs ${
                        rejectData.targetRole === "GRAPHIC"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                          : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      ฝ่ายกราฟิก
                    </button>
                  )}
                  {(isQCRole || isProductionRole || isAdmin) && (
                    <button
                      onClick={() =>
                        setRejectData((prev) => ({
                          ...prev,
                          targetRole: "DIGITIZER",
                        }))
                      }
                      className={`px-4 py-2.5 rounded-xl font-black border-2 transition-all text-xs ${
                        rejectData.targetRole === "DIGITIZER"
                          ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                          : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                      }`}
                    >
                      ฝ่ายตีลาย
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                  2. ระบุเหตุผลการตีกลับ (Reasons)
                </label>
                <textarea
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-50 focus:border-rose-400 outline-none transition-all min-h-[100px] font-medium text-slate-800 text-sm"
                  placeholder="เช่น ตำแหน่งปักผิด, ไซส์ของไม่ครบ, อาร์ตเวิร์คคนละสี..."
                  value={rejectData.reason}
                  onChange={(e) =>
                    setRejectData((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
                  }
                />
              </div>

              {isQCRole && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
                      จำนวนของเสีย (ตัว)
                    </label>
                    <input
                      type="number"
                      min="0"
                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none text-xl font-black text-indigo-600"
                      value={rejectData.damagedCount}
                      onChange={(e) =>
                        setRejectData((prev) => ({
                          ...prev,
                          damagedCount: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={() =>
                        setRejectData((prev) => ({
                          ...prev,
                          isSalesError: !prev.isSalesError,
                        }))
                      }
                      className={`flex items-center gap-2 p-4 rounded-2xl font-black border-2 transition-all h-14 ${
                        rejectData.isSalesError
                          ? "bg-rose-50 border-rose-200 text-rose-600"
                          : "bg-slate-50 border-slate-200 text-slate-400"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center ${rejectData.isSalesError ? "bg-rose-600 border-rose-600" : "border-slate-300"}`}
                      >
                        {rejectData.isSalesError && (
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="text-xs">เป็นความผิดฝ่ายขาย</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectData({
                    targetRole: "",
                    reason: "",
                    damagedCount: 0,
                    isSalesError: false,
                  });
                }}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReject}
                disabled={
                  !rejectData.reason.trim() ||
                  !rejectData.targetRole ||
                  isUpdating
                }
                className="flex-1 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200 hover:bg-rose-700 disabled:opacity-50 transition-all text-sm"
              >
                {isUpdating ? "กำลังส่ง..." : "ยืนยันส่งคืนงาน"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showStockIssueModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                <HiOutlineExclamationCircle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">
                แจ้งปัญหาสินค้า
              </h3>
            </div>

            <p className="text-slate-500 mb-6 font-medium">
              ระบุรายละเอียดปัญหา เช่น สีนี้ในสต็อกหมด หรือ
              รายละเอียดที่ลูกค้าสั่งไม่ตรงกับของที่มี
              (ข้อมูลนี้จะแจ้งไปยังฝ่ายขายโดยตรง)
            </p>

            <textarea
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-red-50 focus:border-red-400 outline-none transition-all min-h-[120px] mb-6 font-medium text-slate-800"
              placeholder="ตัวอย่าง: เช็คสินค้าแล้วสีนี้ไซส์ M สต็อกหมด จะให้สั่งเพิ่มหรือยกเลิก ถามลูกค้าเอา..."
              value={stockIssueReason}
              onChange={(e) => setStockIssueReason(e.target.value)}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowStockIssueModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReportStockIssue}
                disabled={!stockIssueReason.trim() || isUpdating}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl font-black shadow-lg shadow-red-200 hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                {isUpdating ? "กำลังส่ง..." : "แจ้งปัญหาไปยังฝ่ายขาย"}
              </button>
            </div>
          </div>
        </div>
      )}
      {showBufferModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-2xl">
                <HiOutlineCalendarDays className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-black text-slate-800">
                ปรับแก้ Buffer SLA
              </h3>
            </div>

            <div className="mb-6 space-y-4">
              <p className="text-sm font-medium text-slate-500">
                เลือกจำนวนวันที่ต้องการสำรองไว้ (Buffer) ก่อนถึงวันนัดส่งงานจริง
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 2, 3].map((val) => (
                  <button
                    key={val}
                    onClick={() => setBufferLevel(val)}
                    className={`py-4 rounded-2xl font-black border-2 transition-all ${
                      bufferLevel === val
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600"
                        : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest">
                หน่วย: จำนวนวัน (Days)
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowBufferModal(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all text-sm"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpdateBuffer}
                disabled={isUpdating}
                className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 transition-all text-sm"
              >
                {isUpdating ? "กำลังบันทึก..." : "ยืนยันการตั้งค่า"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        isDangerous={confirmModal.isDangerous}
      />

      {/* Production Worker Assignment Modal */}
      {showProductionWorkerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-erp-fade-in">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl p-6 sm:p-8 animate-erp-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                  <HiOutlineUsers className="w-6 h-6" />
                </span>
                ระบุลูกมือผู้รับผิดชอบงาน
              </h2>
              <button
                onClick={() => setShowProductionWorkerModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                disabled={isUpdating}
              >
                <HiOutlineXMark className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  ชื่อลูกมือ (พิมพ์คั่นด้วยลูกน้ำ หรือเว้นวรรค)
                </label>
                <input
                  type="text"
                  placeholder="เช่น ลุงจอน, ป้านี, น้าสมชาย..."
                  value={workerNameInput}
                  onChange={(e) => setWorkerNameInput(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100 outline-none font-bold text-slate-800 transition-all placeholder:font-normal"
                />
              </div>
              <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                <p className="text-xs text-indigo-700 font-medium">
                  💡
                  ลูกมือจะสามารถดูรายละเอียดแบบและจุดปักในออเดอร์นี้ได้ง่ายขึ้น
                  และช่วยในการตรวจสอบกรณีพบปัญหา
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setShowProductionWorkerModal(false)}
                className="px-6 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-100 transition-colors"
                disabled={isUpdating}
              >
                ยกเลิก
              </button>
              <button
                onClick={handleStartProduction}
                disabled={!workerNameInput.trim() || isUpdating}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-200 transition-all disabled:opacity-50"
              >
                {isUpdating ? "กำลังบันทึก..." : "ยืนยันและเริ่มผลิต"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetail;
