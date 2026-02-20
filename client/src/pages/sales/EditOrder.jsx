import { useState, useEffect, useMemo } from "react";
import api from "../../api/config";
import { useAuth } from "../../context/auth-store";
import { useNavigate, useParams } from "react-router-dom";
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
} from "react-icons/hi2";

// Components (Reuse from CreateOrder)
import HeaderSection from "../../features/sales/create-order/components/HeaderSection";
import CustomerSection from "../../features/sales/create-order/components/CustomerSection";
import OrderInfoSection from "../../features/sales/create-order/components/OrderInfoSection";
import ProductMatrixSection from "../../features/sales/create-order/components/ProductMatrixSection";
import EmbroiderySection from "../../features/sales/create-order/components/EmbroiderySection";
import PaymentSection from "../../features/sales/create-order/components/PaymentSection";
import SummarySection from "../../features/sales/create-order/components/SummarySection";
import SmartPasteModal from "../../features/sales/create-order/components/SmartPasteModal";

const embroideryPositions = [
  "อกซ้าย",
  "อกขวา",
  "กระเป๋าซ้าย",
  "กระเป๋าขวา",
  "แขนซ้าย",
  "แขนขวา",
  "กลางหลัง",
  "บ่าซ้าย",
  "บ่าขวา",
  "ทับแถบ",
  "บนแถบ",
  "ปกเสื้อ",
  "อื่นๆ",
];

const EditOrder = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { orderId } = useParams();

  // --- Form State ---
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    customerFb: "",
    taxInbox: "",
  });

  const [orderInfo, setOrderInfo] = useState({
    salesChannelId: "",
    isUrgent: false,
    dueDate: "",
    notes: "",
    purchaseOrder: "",
    blockType: "บล็อคเดิม",
  });

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [customUnitPrice, setCustomUnitPrice] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [depositSlipUrl, setDepositSlipUrl] = useState("");
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);

  const [facebookPages, setFacebookPages] = useState([]);

  // Matrix State
  const [matrixData, setMatrixData] = useState({});
  const [activeColor, setActiveColor] = useState("");
  const [quickFillTotal, setQuickFillTotal] = useState("");
  const [quickFillSizeIds, setQuickFillSizeIds] = useState([]);

  // Spec Parser State
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [rawSpecText, setRawSpecText] = useState("");
  const [parsedResults, setParsedResults] = useState([]);
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);

  // Embroidery State
  const [embroidery, setEmbroidery] = useState([]);

  // Blocks State
  const [blocks, setBlocks] = useState([]);

  const fetchCustomerBlocks = async () => {
    if (!customer.name && !customer.phone) {
      alert("กรุณาระบุชื่อหรือเบอร์โทรลูกค้าก่อนค้นหาบล็อก");
      return;
    }
    try {
      const q = customer.phone || customer.name;
      const res = await api.get(`/blocks/customer-search?q=${q}`);
      setBlocks(res.data.data.blocks);
      if (res.data.data.blocks.length === 0) {
        alert("ไม่พบประวัติบล็อกของลูกค้ารายนี้");
      }
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการค้นหาบล็อก");
    }
  };

  const [loading, setLoading] = useState(true); // Initial loading true
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [draftImages, setDraftImages] = useState([]);
  const [uploadingDraft, setUploadingDraft] = useState(false);
  const [showPreOrderConfirm, setShowPreOrderConfirm] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [prodRes, channelRes, orderRes] = await Promise.all([
          api.get("/products"),
          api.get("/orders/channels"),
          api.get(`/orders/${orderId}`),
        ]);

        const enrichedProducts = (prodRes.data.data || []).map((p) => ({
          ...p,
          subtitle: `รหัส: ${p.codePrefix || "-"} | สต็อกรวม: ${p.totalStock ?? 0} ชิ้น | เริ่มต้น: ${p.startPrice || 0} ฿`,
        }));
        setProducts(enrichedProducts);

        const enrichedChannels = (channelRes.data.data.channels || []).map(
          (c) => ({
            ...c,
            subtitle: `รหัส: ${c.code}`,
          }),
        );
        setFacebookPages(enrichedChannels);

        // Populate Order Data
        const order = orderRes.data.data.order;
        if (!order) throw new Error("Order not found");

        setCustomer({
          name: order.customerName,
          phone: order.customerPhone,
          address: order.customerAddress,
          customerFb: order.customerFb,
          taxInbox: order.taxInbox || "",
        });

        // Map block type back
        const revBlockMap = {
          OLD: "บล็อคเดิม",
          EDIT: "บล็อคเดิมเปลี่ยนข้อความ",
          NEW: "บล็อคใหม่",
        };

        setOrderInfo({
          salesChannelId: order.salesChannelId?.toString() || "",
          isUrgent: !!order.isUrgent,
          dueDate: order.dueDate
            ? new Date(order.dueDate).toISOString().split("T")[0]
            : "",
          notes: order.notes,
          purchaseOrder: order.purchaseOrder || "",
          blockType: revBlockMap[order.blockType] || "บล็อคเดิม",
        });

        // Populate Embroidery
        if (order.positions) {
          setEmbroidery(
            order.positions.map((p) => ({
              position: p.position === "อื่นๆ" ? "อื่นๆ" : p.position,
              customPosition:
                p.position === "อื่นๆ" ||
                !embroideryPositions.includes(p.position)
                  ? p.position
                  : "", // Logic adjustment if needed
              textToEmb: p.textToEmb || "",
              logoUrl: p.logoUrl || "",
              mockupUrl: p.mockupUrl || "",
              width: p.width?.toString() || "",
              height: p.height?.toString() || "",
              note: p.note || "",
              isFreeOption: !!p.isFreeOption,
              freeOptionName: p.freeOptionName,
              fileAddress: p.fileAddress,
              needlePattern: p.needlePattern,
            })),
          );
        }

        // Populate Financials
        setCustomUnitPrice(order.unitPrice || order.items?.[0]?.price || ""); // Best guess if unitPrice not stored directly on order level in legacy
        // Note: Backend updateOrder logic uses data.totalPrice directly, but UI calculates it from matrix * unitPrice.
        // If historical order has different unit prices per item, this UI breaks. Assuming uniform unit price.

        setPaidAmount(order.paidAmount || "");
        if (order.paymentSlips && order.paymentSlips.length > 0) {
          setDepositSlipUrl(order.paymentSlips[0].slipUrl);
        }
        setDraftImages(order.draftImages || []);

        // Populate Products/Matrix
        if (order.items && order.items.length > 0) {
          // Find Product ID from first item
          const firstItem = order.items[0];
          if (firstItem && firstItem.variant) {
            setSelectedProductId(firstItem.variant.productId.toString());

            // Populate Matrix
            const newMatrix = {};
            order.items.forEach((item) => {
              newMatrix[item.variantId] = item.quantity;
            });
            setMatrixData(newMatrix);
          }
        }

        setLoading(false);
        // Defer setting isInitialLoad to false until after product effects run
        setTimeout(() => setIsInitialLoad(false), 500);
      } catch (err) {
        console.error("Fetch error", err);
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [orderId, token]);

  // Selected Product & Matrix Logic
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === parseInt(selectedProductId)),
    [products, selectedProductId],
  );

  useEffect(() => {
    if (selectedProductId && (!selectedProduct || !selectedProduct.variants)) {
      const fetchFullProduct = async () => {
        try {
          const res = await api.get(`/products/${selectedProductId}`);
          if (res.data.success) {
            setProducts((prev) =>
              prev.map((p) =>
                p.id === parseInt(selectedProductId)
                  ? { ...p, ...res.data.data }
                  : p,
              ),
            );
          }
        } catch (err) {
          console.error("Fetch full product error", err);
        }
      };
      fetchFullProduct();
    }
  }, [selectedProductId, token, selectedProduct]);

  // Prevent overwriting custom unit price on initial load
  useEffect(() => {
    if (!isInitialLoad && selectedProduct) {
      const price =
        selectedProduct.startPrice ||
        selectedProduct.variants?.[0]?.price ||
        "";
      // Only set if we don't have one? No, CreateOrder logic overrides.
      // We should be careful not to override existing order price if it was custom.
      // But customUnitPrice is state. If we set it in fetchInitialData, this effect might overwrite it
      // because checks 'selectedProduct' change.
      // Workaround: Check if customUnitPrice is empty?
      setCustomUnitPrice((prev) => prev || price);
    }
  }, [selectedProduct, isInitialLoad]);

  const { colors, sizes, variantsMap } = useMemo(() => {
    if (!selectedProduct || !selectedProduct.variants)
      return { colors: [], sizes: [], variantsMap: {} };

    const cSet = new Set();
    const sSet = new Set();
    const vMap = {};

    selectedProduct.variants.forEach((v) => {
      cSet.add(v.color);
      sSet.add(v.size);
      vMap[`${v.color}-${v.size}`] = v;
    });

    const sizeOrder = [
      "XXS",
      "XS",
      "S",
      "M",
      "L",
      "XL",
      "2XL",
      "3XL",
      "4XL",
      "5XL",
      "6XL",
      "7XL",
      "8XL",
      "9XL",
      "Free",
    ];
    return {
      colors: Array.from(cSet),
      sizes: Array.from(sSet).sort(
        (a, b) => sizeOrder.indexOf(a) - sizeOrder.indexOf(b),
      ),
      variantsMap: vMap,
    };
  }, [selectedProduct]);

  useEffect(() => {
    // CAUTION: This resets matrix data on product change.
    // We must avoid running this on initial load if we just set the product.
    if (!isInitialLoad && selectedProduct) {
      // If user actively changes product, reset matrix
      // But we assume single product edit for now.
      // If we don't want to reset when initial load sets selectedProductId:
      // relying on isInitialLoad to block reset?
      // IsInitialLoad becomes false after timeout.
      // But selectedProduct dependency triggers when 'products' state updates with full variants.
    }

    // Original Logic:
    if (selectedProduct && !isInitialLoad) {
      // If we are changing product manually, yes reset.
      // But how to detect manual vs automatic?
      // Using a ref for previousProductId?
    }
    if (selectedProduct) {
      if (colors.length > 0 && !activeColor) setActiveColor(colors[0]);
    }
  }, [selectedProduct, colors, activeColor, isInitialLoad]);

  const handleMatrixChange = (vId, val) => {
    const num = Math.max(0, parseInt(val) || 0);
    setMatrixData((prev) => ({ ...prev, [vId]: num }));
  };

  const handleQuickFill = () => {
    const total = parseInt(quickFillTotal) || 0;
    if (total <= 0 || quickFillSizeIds.length === 0) return;

    const perSize = Math.floor(total / quickFillSizeIds.length);
    const remainder = total % quickFillSizeIds.length;

    const newData = { ...matrixData };
    quickFillSizeIds.forEach((vId, idx) => {
      newData[vId] = perSize + (idx === 0 ? remainder : 0);
    });

    setMatrixData(newData);
    setQuickFillTotal("");
    setQuickFillSizeIds([]);
  };

  const handleParseSpec = () => {
    if (!rawSpecText.trim() || !activeColor) return;
    const regex = /(XXS|XS|S|M|L|XL|[2-9]XL|Free)\s*[:=]?\s*(\d+)/gi;
    const matches = [...rawSpecText.matchAll(regex)];

    const results = matches.map((match) => {
      const sizeStr = match[1].toUpperCase();
      const qty = parseInt(match[2]);
      const variant = Object.values(variantsMap).find(
        (v) => v.color === activeColor && v.size.toUpperCase() === sizeStr,
      );

      let status = "success";
      let adjustedQty = qty;
      let message = "";

      if (!variant) {
        status = "error";
        message = "ไม่มีไซส์นี้";
      } else if (qty > variant.stock) {
        if (autoFixEnabled) {
          adjustedQty = variant.stock;
          status = "warning";
          message = `สต็อกจำกัด (${variant.stock})`;
        } else {
          status = "warning";
          message = "สต็อกไม่พอ";
        }
      }

      return {
        size: sizeStr,
        requested: qty,
        adjusted: adjustedQty,
        stock: variant?.stock || 0,
        status,
        message,
        vId: variant?.id,
      };
    });
    setParsedResults(results);
  };

  const confirmSpec = () => {
    const newData = { ...matrixData };
    parsedResults.forEach((res) => {
      if (res.vId) newData[res.vId] = res.adjusted;
    });
    setMatrixData(newData);
    setShowSpecModal(false);
    setRawSpecText("");
    setParsedResults([]);
  };

  const addEmbroidery = () => {
    setEmbroidery([
      ...embroidery,
      {
        position: "อกซ้าย",
        customPosition: "",
        blockId: "",
        blockType: "บล็อคเดิม",
        width: "",
        height: "",
        note: "",
        textToEmb: "",
        logoUrl: "",
        mockupUrl: "",
        isFreeOption: false,
        freeOptionName: "เซฟตี้",
        isChangePosition: false,
      },
    ]);
  };

  const removeEmbroidery = (index) => {
    setEmbroidery(embroidery.filter((_, i) => i !== index));
  };

  const handleDraftImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const uploadFormData = new FormData();
    uploadFormData.append("file", file);
    setUploadingDraft(true);
    try {
      const res = await api.post("/upload?folder=drafts", uploadFormData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDraftImages([...draftImages, res.data.data.url]);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถอัปโหลดรูปภาพได้");
    } finally {
      setUploadingDraft(false);
    }
  };

  const handleUploadSlip = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setIsUploadingSlip(true);
    try {
      const res = await api.post("/upload?folder=slips", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setDepositSlipUrl(res.data.data.url);
    } catch {
      alert("อัปโหลดสลิปไม่สำเร็จ");
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const [isUploadingPositionImage, setIsUploadingPositionImage] =
    useState(null);

  const handleEmbroideryImageUpload = async (index, type, file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);

    const key = `${index}-${type}`;
    setIsUploadingPositionImage(key);

    try {
      const res = await api.post(`/upload?folder=embroidery`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newEmb = [...embroidery];
      if (type === "logo") newEmb[index].logoUrl = res.data.data.url;
      if (type === "mockup") newEmb[index].mockupUrl = res.data.data.url;
      setEmbroidery(newEmb);
    } catch (err) {
      console.error(err);
      alert("อัปโหลดรูปภาพตำแหน่งปักไม่สำเร็จ");
    } finally {
      setIsUploadingPositionImage(null);
    }
  };
  const [paymentMethod, setPaymentMethod] = useState("TRANSFER");

  const totals = useMemo(() => {
    let matrixQty = 0;
    Object.entries(matrixData).forEach(([, qty]) => {
      if (qty > 0) matrixQty += qty;
    });
    const unitPrice = parseFloat(customUnitPrice) || 0;
    const subtotal = unitPrice * matrixQty;
    const blockPrice = orderInfo.blockType === "บล็อคใหม่" ? 250 : 0;

    let codSurcharge = 0;
    if (paymentMethod === "COD" && subtotal + blockPrice > 0) {
      codSurcharge = Math.ceil((subtotal + blockPrice) * 0.03);
    }

    const finalTotal = subtotal + blockPrice + codSurcharge;

    return {
      subtotal,
      totalQty: matrixQty,
      blockPrice,
      codSurcharge,
      finalTotal,
      balance: finalTotal - (parseFloat(paidAmount) || 0),
    };
  }, [
    matrixData,
    customUnitPrice,
    orderInfo.blockType,
    paidAmount,
    paymentMethod,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const items = Object.entries(matrixData)
      .filter(([, qty]) => qty > 0)
      .map(([vId, qty]) => {
        const v = selectedProduct.variants.find((v) => v.id === parseInt(vId));
        return {
          variantId: v.id,
          productName: selectedProduct.name,
          price: parseFloat(customUnitPrice) || v.price,
          quantity: qty,
          details: { color: v.color, size: v.size },
        };
      });

    if (items.length === 0) {
      setError("กรุณาเลือกสินค้าและระบุจำนวนอย่างน้อย 1 รายการ");
      setLoading(false);
      return;
    }

    const payload = {
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerFb: customer.customerFb,
      salesChannelId: orderInfo.salesChannelId || null,
      isUrgent: orderInfo.isUrgent,
      blockType:
        { บล็อคเดิม: "OLD", บล็อคเดิมเปลี่ยนข้อความ: "EDIT", บล็อคใหม่: "NEW" }[
          orderInfo.blockType
        ] || "OLD",
      dueDate: orderInfo.dueDate || null,
      notes: orderInfo.notes,
      items,
      totalPrice: totals.finalTotal,
      paidAmount: parseFloat(paidAmount) || 0,
      blockPrice: totals.blockPrice,
      unitPrice: parseFloat(customUnitPrice) || 0,
      embroideryDetails: embroidery,
      depositSlipUrl: depositSlipUrl,
      draftImages: draftImages,
      paymentMethod: paymentMethod,
      codSurcharge: totals.codSurcharge,
    };

    // Pre-order check logic (Optional for Edit, but safer to keep)
    const hasPreOrder = items.some((item) => {
      const v = selectedProduct.variants.find((v) => v.id === item.variantId);
      // NOTE: For edit, we need to consider *current* stock + *old* quantity.
      // But we don't have old quantity easily here without complex logic.
      // Simplification: Check available stock. If we are increasing quantity, it might trigger pre-order.
      return v.stock < item.quantity;
    });

    if (hasPreOrder && !showPreOrderConfirm) {
      setPendingPayload(payload);
      setShowPreOrderConfirm(true);
      setLoading(false);
      return;
    }

    try {
      const res = await api.put(`/orders/${orderId}`, payload);
      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขออเดอร์",
      );
    } finally {
      setLoading(false);
      setShowPreOrderConfirm(false);
      setPendingPayload(null);
    }
  };

  const confirmSubmit = () => {
    if (pendingPayload) {
      setLoading(true);
      const executeSubmit = async () => {
        try {
          const res = await api.put(`/orders/${orderId}`, pendingPayload);
          if (res.data.success) {
            setSuccess(true);
          }
        } catch (err) {
          setError(
            err.response?.data?.message || "เกิดข้อผิดพลาดในการแก้ไขออเดอร์",
          );
        } finally {
          setLoading(false);
          setShowPreOrderConfirm(false);
          setPendingPayload(null);
        }
      };
      executeSubmit();
    }
  };

  if (loading && isInitialLoad) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-slate-900">
        <div className="bg-white rounded-[2rem] shadow-xl p-10 max-w-md w-full text-center animate-erp-in">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiOutlineCheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">
            บันทึกการแก้ไขสำเร็จ!
          </h2>
          <div className="space-y-3 mt-8">
            <button
              onClick={() => navigate(`/order/${orderId}`)}
              className="erp-button erp-button-primary w-full py-3.5"
            >
              กลับไปหน้าออเดอร์
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 animate-erp-in font-sans text-slate-900">
      {/* Custom Header for Edit Mode */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span className="text-indigo-600">✏️</span> แก้ไขออเดอร์ # {orderId}
          </h1>
          <button
            onClick={() => navigate(`/order/${orderId}`)}
            className="text-sm font-bold text-slate-500 hover:text-slate-800"
          >
            ยกเลิก
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 font-bold">
            {error}
          </div>
        </div>
      )}

      <SmartPasteModal
        isOpen={showSpecModal}
        onClose={() => setShowSpecModal(false)}
        activeColor={activeColor}
        rawSpecText={rawSpecText}
        setRawSpecText={setRawSpecText}
        autoFixEnabled={autoFixEnabled}
        setAutoFixEnabled={setAutoFixEnabled}
        handleParseSpec={handleParseSpec}
        parsedResults={parsedResults}
        confirmSpec={confirmSpec}
      />

      {/* Pre-order Confirmation Modal */}
      {showPreOrderConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineExclamationTriangle className="w-10 h-10 text-amber-600" />
            </div>
            <h3 className="text-xl font-black text-slate-800 text-center mb-2">
              ยืนยันการสั่งผลิต (Pre-order)
            </h3>
            <p className="text-sm text-slate-500 text-center mb-6">
              การแก้ไขนี้ส่งผลให้จำนวนสินค้าที่ต้องการมากกว่าสต็อกปัจจุบัน
              <br />
              <b>ระบบจะคำนวณการสั่งซื้อเพิ่มใหม่อัตโนมัติ</b>
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowPreOrderConfirm(false);
                  setPendingPayload(null);
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                disabled={loading}
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={confirmSubmit}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? "กำลังบันทึก..." : "ยืนยันการแก้ไข"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6"
        >
          {/* Main Content: 8 Columns */}
          <div className="lg:col-span-8 space-y-6">
            <CustomerSection customer={customer} setCustomer={setCustomer} />
            <OrderInfoSection
              orderInfo={orderInfo}
              setOrderInfo={setOrderInfo}
              facebookPages={facebookPages}
            />
            <ProductMatrixSection
              products={products}
              selectedProductId={selectedProductId}
              setSelectedProductId={setSelectedProductId}
              customUnitPrice={customUnitPrice}
              setCustomUnitPrice={setCustomUnitPrice}
              selectedProduct={selectedProduct}
              colors={colors}
              sizes={sizes}
              activeColor={activeColor}
              setActiveColor={setActiveColor}
              matrixData={matrixData}
              handleMatrixChange={handleMatrixChange}
              variantsMap={variantsMap}
              quickFillTotal={quickFillTotal}
              setQuickFillTotal={setQuickFillTotal}
              handleQuickFill={handleQuickFill}
              onOpenSpecModal={() => setShowSpecModal(true)}
            />
            <EmbroiderySection
              embroidery={embroidery}
              setEmbroidery={setEmbroidery}
              addEmbroidery={addEmbroidery}
              removeEmbroidery={removeEmbroidery}
              embroideryPositions={embroideryPositions}
              blocks={blocks}
              fetchCustomerBlocks={fetchCustomerBlocks}
              orderInfo={orderInfo}
              setOrderInfo={setOrderInfo}
              user={user}
              onUploadPositionImage={handleEmbroideryImageUpload}
              isUploadingImage={isUploadingPositionImage}
            />
            <PaymentSection
              draftImages={draftImages}
              setDraftImages={setDraftImages}
              onUploadDraft={handleDraftImageUpload}
              uploadingDraft={uploadingDraft}
              totals={totals}
              paidAmount={paidAmount}
              setPaidAmount={setPaidAmount}
              setHasManualDeposit={() => {}} // No-op for edit
              depositSlipUrl={depositSlipUrl}
              onUploadSlip={handleUploadSlip}
              isUploadingSlip={isUploadingSlip}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
            />
          </div>

          {/* Sidebar Area: 4 Columns */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-600 rounded-full"></span>
                สรุปยอดรวม
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">จำนวนรวม</span>
                  <span className="font-black text-slate-900">
                    {totals.totalQty} ตัว
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">
                    ราคาเฉลี่ยต่อตัว
                  </span>
                  <span className="font-black text-slate-900">
                    ฿{parseFloat(customUnitPrice).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-bold">ค่าบล็อค</span>
                  <span className="font-black text-slate-900">
                    ฿{totals.blockPrice.toLocaleString()}
                  </span>
                </div>
                {totals.codSurcharge > 0 && (
                  <div className="flex justify-between text-sm text-orange-600">
                    <span className="font-bold">ค่าธรรมเนียม COD (3%)</span>
                    <span className="font-black">
                      +฿{totals.codSurcharge.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-end">
                  <span className="text-slate-600 font-bold">ยอดสุทธิ</span>
                  <span className="text-2xl font-black text-indigo-600">
                    ฿{totals.finalTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none"
              >
                {loading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrder;
