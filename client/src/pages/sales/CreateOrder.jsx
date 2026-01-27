import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import { useNavigate, Link } from "react-router-dom";
import SearchableSelect from "../../components/SearchableSelect";
import {
  HiOutlineArrowLeft,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineDocumentArrowDown,
  HiOutlineFire,
  HiOutlinePhoto,
} from "react-icons/hi2";

const CreateOrder = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  // --- Form State ---
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
    customerFb: "",
  });

  const [orderInfo, setOrderInfo] = useState({
    salesChannelId: "",
    isUrgent: false,
    blockType: "บล็อคเดิม",
    dueDate: "",
    notes: "",
  });

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [customUnitPrice, setCustomUnitPrice] = useState(""); // Sales can override
  const [paidAmount, setPaidAmount] = useState(""); // ยอดที่ลูกค้าชำระมา
  const [depositSlipUrl, setDepositSlipUrl] = useState(""); // URL รูปสลิป
  const [isUploadingSlip, setIsUploadingSlip] = useState(false);

  const [facebookPages, setFacebookPages] = useState([]);

  // Matrix State
  const [matrixData, setMatrixData] = useState({});
  const [activeColor, setActiveColor] = useState(""); // Currently selected color for editing
  const [quickFillTotal, setQuickFillTotal] = useState("");
  const [quickFillSizeIds, setQuickFillSizeIds] = useState([]); // Selected variant IDs for quick fill

  // Spec Parser State
  const [showSpecModal, setShowSpecModal] = useState(false);
  const [rawSpecText, setRawSpecText] = useState("");
  const [parsedResults, setParsedResults] = useState([]); // [{ size, requested, actualStock, status, variantId }]
  const [autoFixEnabled, setAutoFixEnabled] = useState(false);

  // Embroidery State
  const [embroidery, setEmbroidery] = useState([]);

  // Mock Blocks (will be replaced with real data)
  const mockBlocks = [
    {
      id: 1,
      name: "บล็อคโลโก้บริษัท A",
      imageUrl: "https://placehold.co/100x100/png",
    },
    {
      id: 2,
      name: "บล็อคตัวอักษร B",
      imageUrl: "https://placehold.co/100x100/png",
    },
    {
      id: 3,
      name: "บล็อคสัญลักษณ์ C",
      imageUrl: "https://placehold.co/100x100/png",
    },
  ];

  // Embroidery Positions
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
    "อื่นๆ",
  ];

  const [loading, setLoading] = useState(false);
  const [successOrderId, setSuccessOrderId] = useState(null);
  const [error, setError] = useState("");

  // Temporary draft images
  const [draftImages, setDraftImages] = useState([]);
  const [uploadingDraft, setUploadingDraft] = useState(false);

  // --- Fetch Initial Data ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [prodRes, channelRes] = await Promise.all([
          axios.get("http://localhost:8000/api/products", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("http://localhost:8000/api/orders/channels", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        // Enrich products with subtitle for search
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
      } catch (err) {
        console.error("Fetch error", err);
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
      }
    };
    fetchData();
  }, [token]);

  // Selected Product & Matrix Logic
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === parseInt(selectedProductId)),
    [products, selectedProductId],
  );

  // Fetch full product details (to get variants) when a product is selected
  useEffect(() => {
    if (selectedProductId && (!selectedProduct || !selectedProduct.variants)) {
      const fetchFullProduct = async () => {
        try {
          const res = await axios.get(
            `http://localhost:8000/api/products/${selectedProductId}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );

          if (res.data.success) {
            // Update the product in the list with full details
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

  // Reset custom price when product changes
  useEffect(() => {
    if (selectedProduct) {
      // Use startPrice if available, otherwise fallback to first variant
      const price =
        selectedProduct.startPrice ||
        selectedProduct.variants?.[0]?.price ||
        "";
      setCustomUnitPrice(price);
    }
  }, [selectedProduct]);

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

    return {
      colors: Array.from(cSet),
      sizes: Array.from(sSet).sort((a, b) => {
        const order = [
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
        return order.indexOf(a) - order.indexOf(b);
      }),
      variantsMap: vMap,
    };
  }, [selectedProduct]);

  useEffect(() => {
    if (selectedProduct) {
      setMatrixData({});
      setQuickFillSizeIds([]);
      setQuickFillTotal("");
      if (colors.length > 0) setActiveColor(colors[0]);
    }
  }, [selectedProduct, colors]);

  const handleMatrixChange = (vId, val) => {
    const num = Math.max(0, parseInt(val) || 0); // Auto-clamp min 0
    setMatrixData((prev) => ({ ...prev, [vId]: num }));
  };

  const handleQuickFill = () => {
    const total = parseInt(quickFillTotal) || 0;
    if (total <= 0 || quickFillSizeIds.length === 0) return;

    const perSize = Math.floor(total / quickFillSizeIds.length);
    const remainder = total % quickFillSizeIds.length;

    const newData = { ...matrixData };
    quickFillSizeIds.forEach((vId, idx) => {
      // Add perSize, and give the remainder to the first one
      newData[vId] = perSize + (idx === 0 ? remainder : 0);
    });

    setMatrixData(newData);
    setQuickFillTotal("");
    setQuickFillSizeIds([]);
  };

  // --- Smart Spec Parser Logic ---
  const handleParseSpec = () => {
    if (!rawSpecText.trim() || !activeColor) return;

    // Regex to match size and quantity: (Size)\s*(Qty)
    // Supports: M80, M 80, ไซส์ M = 80 ตัว
    const regex = /(XXS|XS|S|M|L|XL|[2-9]XL|Free)\s*[:=]?\s*(\d+)/gi;
    const matches = [...rawSpecText.matchAll(regex)];

    const results = matches.map((match) => {
      const sizeStr = match[1].toUpperCase();
      const qty = parseInt(match[2]);

      // Find variant for active color
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
      if (res.vId) {
        newData[res.vId] = res.adjusted;
      }
    });

    // If auto-fix was enabled and we have "lost" quantities, redistribute them?
    // For now, let's keep it simple: just apply the adjusted values.

    setMatrixData(newData);
    setShowSpecModal(false);
    setRawSpecText("");
    setParsedResults([]);
  };

  const handleKeyDown = (e, vId, index) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextInput = document.querySelector(
        `input[data-matrix-idx="${index + 1}"]`,
      );
      if (nextInput) nextInput.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      handleMatrixChange(vId, (matrixData[vId] || 0) + 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      handleMatrixChange(vId, (matrixData[vId] || 0) - 1);
    }
  };

  // --- Embroidery Logic ---
  const addEmbroidery = () => {
    setEmbroidery([
      ...embroidery,
      {
        position: "อกซ้าย",
        customPosition: "",
        blockId: "",
        type: "ปัก (Embroidery)",
        note: "",
      },
    ]);
  };

  const removeEmbroidery = (index) => {
    setEmbroidery(embroidery.filter((_, i) => i !== index));
  };

  // --- Draft Image Upload ---
  const handleDraftImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    setUploadingDraft(true);
    try {
      const res = await axios.post(
        "http://localhost:8000/api/upload?folder=drafts",
        uploadFormData,
        {
          headers: {
            ...getAuthHeader(),
            "Content-Type": "multipart/form-data",
          },
        },
      );
      setDraftImages([...draftImages, res.data.data.url]);
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถอัปโหลดรูปภาพได้");
    } finally {
      setUploadingDraft(false);
    }
  };

  const removeDraftImage = (index) => {
    setDraftImages(draftImages.filter((_, i) => i !== index));
  };

  // --- Calculation ---
  const totals = useMemo(() => {
    // Rely strictly on Matrix sum
    let matrixQty = 0;
    Object.entries(matrixData).forEach(([, qty]) => {
      if (qty > 0) matrixQty += qty;
    });

    const effectiveQty = matrixQty;

    // Unit Price
    const unitPrice = parseFloat(customUnitPrice) || 0;
    const subtotal = unitPrice * effectiveQty;

    const blockPrice = orderInfo.blockType === "บล็อคใหม่" ? 250 : 0;
    const finalTotal = subtotal + blockPrice;

    // Return all derived values
    return {
      subtotal,
      totalQty: effectiveQty,
      blockPrice,
      finalTotal,
      balance: finalTotal - (parseFloat(paidAmount) || 0),
    };
  }, [matrixData, customUnitPrice, orderInfo.blockType, paidAmount]);

  // Auto-set deposit to 20% by default, but allow manual override
  const [hasManualDeposit, setHasManualDeposit] = useState(false);

  useEffect(() => {
    if (!hasManualDeposit && totals.finalTotal > 0) {
      setPaidAmount(Math.round(totals.finalTotal * 0.2));
    }
  }, [totals.finalTotal, hasManualDeposit]);

  // --- Submit ---
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

    if (!customUnitPrice || parseFloat(customUnitPrice) <= 0) {
      setError("กรุณาระบุราคาต่อหน่วย");
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
        {
          บล็อคเดิม: "OLD",
          บล็อคเดิมเปลี่ยนข้อความ: "EDIT",
          บล็อคใหม่: "NEW",
        }[orderInfo.blockType] || "OLD",
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
    };

    try {
      const res = await axios.post(
        "http://localhost:8000/api/orders",
        payload,
        {
          headers: getAuthHeader(),
        },
      );
      setSuccessOrderId(res.data.data.order.id);
      setError("");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "เกิดข้อผิดพลาดในการสร้างออเดอร์",
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadJobSheet = async (orderId) => {
    try {
      const response = await axios.get(
        `http://localhost:8000/api/orders/${orderId}/jobsheet`,
        {
          headers: getAuthHeader(),
          responseType: "blob",
        },
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `JobSheet-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Download error:", err);
      alert("ไม่สามารถดาวน์โหลด Job Sheet ได้");
    }
  };

  // Success State
  if (successOrderId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[3rem] shadow-2xl p-12 max-w-lg w-full text-center animate-in zoom-in-95 duration-500">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <HiOutlineCheckCircle className="w-14 h-14 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 mb-3">
            สร้างออเดอร์สำเร็จ!
          </h2>
          <p className="text-slate-600 mb-8">
            ออเดอร์ของคุณถูกบันทึกเรียบร้อยแล้ว
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => downloadJobSheet(successOrderId)}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:shadow-xl transition-all"
            >
              <HiOutlineDocumentArrowDown className="w-5 h-5" />
              ดาวน์โหลด Job Sheet (PDF)
            </button>
            <button
              onClick={() => navigate("/orders")}
              className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold hover:bg-slate-200 transition-all"
            >
              ดูออเดอร์ทั้งหมด
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 text-indigo-600 font-bold hover:underline"
            >
              สร้างออเดอร์ใหม่
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if "บล็อคใหม่" is selected - hide block selection in embroidery
  const isNewBlock = orderInfo.blockType === "บล็อคใหม่";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/30 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/orders"
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
            >
              <HiOutlineArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                สร้างออเดอร์ใหม่
              </h1>
              <p className="text-slate-500 font-medium mt-1">
                ฝ่ายขาย: {user?.name}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <HiOutlineExclamationCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-6 border-l-4 border-indigo-400 pl-4">
              ข้อมูลลูกค้า
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">
                  ชื่อลูกค้า <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="text"
                  value={customer.name}
                  onChange={(e) =>
                    setCustomer({ ...customer, name: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none"
                  placeholder="ระบุชื่อลูกค้า"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">
                  Facebook ลูกค้า
                </label>
                <input
                  type="text"
                  value={customer.customerFb}
                  onChange={(e) =>
                    setCustomer({ ...customer, customerFb: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none"
                  placeholder="ชื่อ Facebook"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">
                  เบอร์โทร
                </label>
                <input
                  type="tel"
                  value={customer.phone}
                  onChange={(e) =>
                    setCustomer({ ...customer, phone: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none"
                  placeholder="0XX-XXX-XXXX"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">
                  ที่อยู่
                </label>
                <input
                  value={customer.address}
                  onChange={(e) =>
                    setCustomer({ ...customer, address: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none"
                  placeholder="ที่อยู่จัดส่ง"
                />
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 relative z-40">
            <h2 className="text-lg font-bold text-slate-800 mb-6 border-l-4 border-rose-400 pl-4">
              รายละเอียดออเดอร์
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">
                  Facebook Page
                </label>
                <SearchableSelect
                  options={facebookPages}
                  value={orderInfo.salesChannelId}
                  onChange={(val) =>
                    setOrderInfo({ ...orderInfo, salesChannelId: val })
                  }
                  placeholder="เลือกเพจ (ค้นหาได้)"
                  displayKey="name"
                  valueKey="id"
                  searchKeys={["name", "subtitle"]}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">
                  ประเภทบล็อก
                </label>
                <div className="flex gap-2 flex-wrap">
                  {["บล็อคเดิม", "บล็อคเดิมเปลี่ยนข้อความ", "บล็อคใหม่"].map(
                    (type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setOrderInfo({ ...orderInfo, blockType: type })
                        }
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                          orderInfo.blockType === type
                            ? "bg-indigo-600 text-white shadow-lg"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {type === "บล็อคใหม่" && "+250฿ "}
                        {type}
                      </button>
                    ),
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  งานด่วน
                  {orderInfo.isUrgent && (
                    <HiOutlineFire className="w-4 h-4 text-red-500" />
                  )}
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setOrderInfo({
                      ...orderInfo,
                      isUrgent: !orderInfo.isUrgent,
                    })
                  }
                  className={`w-full py-3 rounded-xl font-bold transition-all ${
                    orderInfo.isUrgent
                      ? "bg-red-500 text-white shadow-lg"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {orderInfo.isUrgent ? "ด่วน (3 วัน)" : "ปกติ"}
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600">
                  กำหนดส่ง
                </label>
                <input
                  type="date"
                  value={orderInfo.dueDate}
                  onChange={(e) =>
                    setOrderInfo({ ...orderInfo, dueDate: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Product Selection */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm relative z-30">
            <div className="p-8 border-b border-slate-50">
              <h2 className="text-lg font-bold text-slate-800 mb-6 border-l-4 border-green-400 pl-4">
                เลือกสินค้า
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">
                    สินค้า <span className="text-red-500">*</span>
                  </label>
                  <SearchableSelect
                    options={products}
                    value={selectedProductId}
                    onChange={(val) => setSelectedProductId(val)}
                    placeholder="ค้นหาสินค้า (รหัส หรือ ชื่อ)"
                    displayKey="name"
                    valueKey="id"
                    imageKey="imageUrl"
                    searchKeys={["name", "codePrefix", "subtitle"]}
                  />
                </div>

                {/* <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">
                    จำนวนทั้งหมด (ชิ้น)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalQuantity}
                    onChange={(e) => setTotalQuantity(e.target.value)}
                    className="w-full px-4 py-3 bg-blue-50 border-2 border-blue-300 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all outline-none font-bold text-lg text-center"
                    placeholder="ระบุจำนวน"
                  />
                  <p className="text-xs text-slate-500 text-center">
                    จาก Matrix: {totals.totalQty} ชิ้น
                  </p>
                </div> */}

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600">
                    ราคาต่อหน่วย (฿) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={customUnitPrice}
                    onChange={(e) => setCustomUnitPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-yellow-50 border-2 border-yellow-300 rounded-2xl focus:ring-4 focus:ring-yellow-100 focus:border-yellow-400 transition-all outline-none font-bold text-lg"
                    placeholder="กรอกราคาที่ตกลงกับลูกค้า"
                    required
                  />
                  {selectedProduct && (
                    <p className="text-xs text-slate-500">
                      ราคาเริ่มต้น: {selectedProduct.startPrice || 0} ฿
                    </p>
                  )}
                </div>
              </div>
            </div>

            {selectedProduct && colors.length > 0 && (
              <div className="bg-slate-50/50 rounded-b-[2rem]">
                {/* Color Selection Tabs */}
                <div className="p-8 pb-0 border-b border-slate-100 flex gap-4 overflow-x-auto scrollbar-hide">
                  {colors.map((color) => {
                    const colorQty = sizes.reduce((sum, s) => {
                      const v = variantsMap[`${color}-${s}`];
                      return sum + (v ? matrixData[v.id] || 0 : 0);
                    }, 0);

                    return (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setActiveColor(color)}
                        className={`px-6 py-3 rounded-t-2xl font-black transition-all flex items-center gap-3 whitespace-nowrap border-b-4 ${
                          activeColor === color
                            ? "bg-white border-indigo-600 text-indigo-600 shadow-sm"
                            : "bg-transparent border-transparent text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full ${activeColor === color ? "bg-indigo-600" : "bg-slate-300"}`}
                        ></div>
                        {color}
                        {colorQty > 0 && (
                          <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg text-xs">
                            {colorQty}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
                  {/* Left: Size Stepper Table */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-slate-400 text-sm uppercase tracking-widest">
                        ไซส์ | คงเหลือ | จำนวนที่สั่ง
                      </h3>
                      <p className="text-xs font-bold text-slate-400 italic">
                        Tip: Tab/Enter เพื่อข้าม, ↑↓ เพื่อเพิ่มลด
                      </p>
                    </div>

                    <div className="space-y-3">
                      {sizes.map((size, idx) => {
                        const v = variantsMap[`${activeColor}-${size}`];
                        if (!v) return null;

                        const qty = matrixData[v.id] || 0;
                        const isPreOrder = qty > v.stock;
                        const isLowStock = v.stock < (v.minStock || 5);

                        return (
                          <div
                            key={size}
                            className={`flex items-center gap-4 p-4 rounded-[2rem] transition-all border-2 ${
                              qty > 0
                                ? isPreOrder
                                  ? "bg-red-50 border-red-200"
                                  : "bg-white border-indigo-200 shadow-lg scale-[1.02]"
                                : "bg-white border-slate-100 opacity-60 hover:opacity-100"
                            }`}
                          >
                            <div className="w-16 font-black text-2xl text-slate-800 text-center">
                              {size}
                            </div>
                            <div className="flex-1 flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase">
                                คงเหลือในสต็อก
                              </span>
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-lg font-black ${isLowStock ? "text-red-500" : "text-slate-600"}`}
                                >
                                  {v.stock}
                                </span>
                                {isLowStock && (
                                  <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-md text-[10px] font-bold animate-pulse">
                                    LOW
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  data-matrix-idx={idx}
                                  value={matrixData[v.id] || ""}
                                  onChange={(e) =>
                                    handleMatrixChange(v.id, e.target.value)
                                  }
                                  onKeyDown={(e) =>
                                    handleKeyDown(e, v.id, idx, sizes.length)
                                  }
                                  className={`w-24 h-14 text-center rounded-2xl font-black text-xl outline-none transition-all shadow-inner ${
                                    qty > 0
                                      ? isPreOrder
                                        ? "bg-white text-red-600 ring-2 ring-red-300"
                                        : "bg-white text-indigo-600 ring-2 ring-indigo-300"
                                      : "bg-slate-50 text-slate-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                                  }`}
                                  placeholder="0"
                                />
                                {qty > 0 && (
                                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-indigo-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg animate-in zoom-in">
                                    <HiOutlineCheckCircle className="w-4 h-4" />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Quick Fill Module */}
                  <div className="lg:col-span-5 bg-white rounded-[3rem] border border-slate-200 p-8 shadow-xl h-fit sticky top-8">
                    <div className="flex items-center justify-between gap-3 mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl">
                          <HiOutlineFire className="w-6 h-6" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800">
                          เพิ่มแบบรวดเร็ว
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowSpecModal(true)}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-2"
                      >
                        <HiOutlineDocumentArrowDown className="w-4 h-4" />
                        วางรูปแบบ
                      </button>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-500 block">
                          1. ระบุจำนวนรวมทั้งหมด
                        </label>
                        <input
                          type="number"
                          placeholder="เช่น 120"
                          value={quickFillTotal}
                          onChange={(e) => setQuickFillTotal(e.target.value)}
                          className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:border-rose-400 focus:ring-4 focus:ring-rose-50 outline-none font-black text-2xl transition-all"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm font-bold text-slate-500 block">
                          2. เลือกไซส์ที่ต้องการกระจาย
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {sizes.map((size) => {
                            const v = variantsMap[`${activeColor}-${size}`];
                            if (!v) return null;
                            const isSelected = quickFillSizeIds.includes(v.id);

                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() =>
                                  setQuickFillSizeIds((prev) =>
                                    isSelected
                                      ? prev.filter((id) => id !== v.id)
                                      : [...prev, v.id],
                                  )
                                }
                                className={`py-3 rounded-xl font-black text-sm transition-all border-2 ${
                                  isSelected
                                    ? "bg-rose-500 border-rose-500 text-white shadow-lg scale-95"
                                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                }`}
                              >
                                {size}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleQuickFill}
                        disabled={
                          !quickFillTotal || quickFillSizeIds.length === 0
                        }
                        className="w-full py-5 bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-[2rem] font-black text-lg shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all disabled:grayscale disabled:opacity-50 disabled:translate-y-0"
                      >
                        กระจายจำนวนสินค้า
                      </button>

                      <p className="text-center text-xs text-slate-400 px-4">
                        * ระบบจะกระจายตัวเลขให้เท่าๆ กันตามไซส์ที่เลือก
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Embroidery Section */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-800 border-l-4 border-yellow-400 pl-4">
                รายละเอียดการปัก/สกรีน
              </h2>
              <button
                type="button"
                onClick={addEmbroidery}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-all flex items-center gap-2"
              >
                <HiOutlinePlus className="w-4 h-4" />
                เพิ่มตำแหน่ง
              </button>
            </div>

            {embroidery.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                ไม่มีรายการปัก/สกรีน (ถ้าต้องการให้คลิก "เพิ่มตำแหน่ง")
              </p>
            ) : (
              <div className="space-y-4">
                {embroidery.map((item, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-slate-50 rounded-xl relative"
                  >
                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">
                        ตำแหน่ง
                      </label>
                      <select
                        value={item.position}
                        onChange={(e) => {
                          const newEmb = [...embroidery];
                          newEmb[index].position = e.target.value;
                          setEmbroidery(newEmb);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                      >
                        {embroideryPositions.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>

                    {item.position === "อื่นๆ" && (
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">
                          ระบุตำแหน่ง
                        </label>
                        <input
                          placeholder="ระบุตำแหน่ง..."
                          value={item.customPosition}
                          onChange={(e) => {
                            const newEmb = [...embroidery];
                            newEmb[index].customPosition = e.target.value;
                            setEmbroidery(newEmb);
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                        />
                      </div>
                    )}

                    {/* Hide block selection if "บล็อคใหม่" */}
                    {!isNewBlock && (
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">
                          บล็อค
                        </label>
                        <SearchableSelect
                          options={mockBlocks}
                          value={item.blockId}
                          onChange={(val) => {
                            const newEmb = [...embroidery];
                            newEmb[index].blockId = val;
                            setEmbroidery(newEmb);
                          }}
                          placeholder="เลือกบล็อค"
                          displayKey="name"
                          valueKey="id"
                          imageKey="imageUrl"
                          searchKeys={["name"]}
                          className="w-full"
                        />
                      </div>
                    )}

                    <div>
                      <label className="text-xs font-bold text-slate-500 mb-1 block">
                        ประเภท
                      </label>
                      <select
                        value={item.type}
                        onChange={(e) => {
                          const newEmb = [...embroidery];
                          newEmb[index].type = e.target.value;
                          setEmbroidery(newEmb);
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                      >
                        <option>ปัก (Embroidery)</option>
                        <option>สกรีน (Screen)</option>
                        <option>DTF</option>
                        <option>Flex</option>
                      </select>
                    </div>

                    <div
                      className={isNewBlock ? "md:col-span-3" : "md:col-span-4"}
                    >
                      <label className="text-xs font-bold text-slate-500 mb-1 block">
                        หมายเหตุ
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          placeholder="เช่น เส้นด้ายสีทอง, หมึกสีขาว"
                          value={item.note}
                          onChange={(e) => {
                            const newEmb = [...embroidery];
                            newEmb[index].note = e.target.value;
                            setEmbroidery(newEmb);
                          }}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => removeEmbroidery(index)}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Draft Images Upload */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-6 border-l-4 border-purple-400 pl-4">
              อัปโหลดรูปวางแบบ
            </h2>
            <p className="text-sm text-slate-500 mb-4">
              อัพโหลดรูปภาพแบบจำลองให้ลูกค้าดู (รูปจะหมดอายุใน 14 วัน)
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <label
                  htmlFor="draft-upload"
                  className={`px-6 py-3 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    uploadingDraft
                      ? "bg-slate-200 text-slate-400"
                      : "bg-purple-50 text-purple-600 hover:bg-purple-100"
                  }`}
                >
                  <HiOutlinePhoto className="w-5 h-5" />
                  {uploadingDraft ? "กำลังอัพโหลด..." : "เลือกรูปภาพ"}
                </label>
                <input
                  id="draft-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleDraftImageUpload}
                  disabled={uploadingDraft}
                  className="hidden"
                />
              </div>

              {draftImages.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {draftImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Draft ${idx + 1}`}
                        className="w-full h-32 object-cover rounded-xl border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeDraftImage(idx)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <HiOutlineTrash className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes for QC/Production */}
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-6 border-l-4 border-teal-400 pl-4">
              หมายเหตุสำหรับฝ่าย QC/Production
            </h2>
            <textarea
              value={orderInfo.notes}
              onChange={(e) =>
                setOrderInfo({ ...orderInfo, notes: e.target.value })
              }
              rows="4"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 transition-all outline-none resize-none"
              placeholder="หมายเหตุเพิ่มเติม เช่น ความพิเศษของออเดอร์นี้..."
            />
          </div>

          {/* Summary & Submit */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-[2rem] p-8 text-white shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div>
                <p className="text-indigo-100 text-sm mb-1">จำนวนทั้งหมด</p>
                <p className="text-3xl font-black">{totals.totalQty} ชิ้น</p>
              </div>
              <div>
                <p className="text-indigo-100 text-sm mb-1">ราคารวม</p>
                <p className="text-3xl font-black">
                  {totals.finalTotal.toLocaleString()} ฿
                </p>
                {totals.blockPrice > 0 && (
                  <p className="text-xs text-indigo-200 mt-1">
                    (รวมบล็อก +{totals.blockPrice}฿)
                  </p>
                )}
              </div>
              <div>
                <p className="text-indigo-100 text-sm mb-1">
                  ยอดชำระ/มัดจำ (Paid)
                </p>
                <div className="flex flex-col gap-2">
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => {
                      setPaidAmount(e.target.value);
                      setHasManualDeposit(true);
                    }}
                    className="w-full px-4 py-2 bg-indigo-700/50 border border-indigo-400 rounded-xl text-xl font-bold outline-none focus:ring-2 focus:ring-white/50"
                    placeholder="0"
                  />
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append("file", file);
                        setIsUploadingSlip(true);
                        try {
                          const res = await axios.post(
                            "http://localhost:8000/api/upload?folder=slips",
                            formData,
                            {
                              headers: {
                                ...getAuthHeader(),
                                "Content-Type": "multipart/form-data",
                              },
                            },
                          );
                          setDepositSlipUrl(res.data.data.url);
                        } catch {
                          alert("Upload slip failed");
                        } finally {
                          setIsUploadingSlip(false);
                        }
                      }}
                      className="hidden"
                      id="slip-upload"
                    />
                    <label
                      htmlFor="slip-upload"
                      className="flex items-center gap-2 text-[10px] bg-indigo-500/50 hover:bg-indigo-400/50 px-3 py-1.5 rounded-lg cursor-pointer transition-all"
                    >
                      <HiOutlinePhoto className="w-4 h-4" />
                      {depositSlipUrl
                        ? "เปลี่ยนสลิปมัดจำ"
                        : "แนบสลิปมัดจำ/หลักฐานโอนเงิน"}
                      {isUploadingSlip && (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      )}
                    </label>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-indigo-100 text-sm mb-1">
                  ค้างชำระ (Balance)
                </p>
                <p
                  className={`text-3xl font-black ${totals.balance > 0 ? "text-yellow-300" : "text-emerald-300"}`}
                >
                  {totals.balance.toLocaleString()} ฿
                </p>
                {depositSlipUrl && (
                  <p className="text-[10px] text-emerald-200 mt-1">
                    ✓ สลิปแนบแล้ว
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || totals.totalQty === 0}
              className={`w-full py-5 rounded-2xl font-black text-xl transition-all flex items-center justify-center gap-3 ${
                loading || totals.totalQty === 0
                  ? "bg-indigo-500/50 cursor-not-allowed"
                  : "bg-white text-indigo-700 hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
              }`}
            >
              {loading ? (
                <>
                  <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  กำลังสร้างออเดอร์...
                </>
              ) : (
                <>
                  <HiOutlineCheckCircle className="w-7 h-7" />
                  ยืนยันสร้างออเดอร์
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* --- Smart Paste Spec Modal --- */}
      {showSpecModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg ring-4 ring-indigo-50">
                  <HiOutlineDocumentArrowDown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">
                    Smart Paste Spec
                  </h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                    สีที่กำลังทำ:{" "}
                    <span className="text-indigo-600">{activeColor}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSpecModal(false)}
                className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-all"
              >
                <HiOutlineTrash className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left: Input */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  วางข้อความจากลูกค้า (LINE / FB)
                  <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full">
                    RAW SPEC
                  </span>
                </label>
                <textarea
                  value={rawSpecText}
                  onChange={(e) => setRawSpecText(e.target.value)}
                  placeholder="เช่น: M80 5XL 50 L2 S2 XL 2 4XL 2 9XL 2..."
                  className="w-full h-80 p-6 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50 transition-all font-mono text-sm resize-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={autoFixEnabled}
                        onChange={(e) => setAutoFixEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-emerald-500 transition-all"></div>
                      <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5"></div>
                    </div>
                    <span className="text-sm font-bold text-slate-600 group-hover:text-emerald-600 transition-colors">
                      Auto Fix (ปรับยอดหากเกินสต็อก)
                    </span>
                  </label>
                  <button
                    onClick={handleParseSpec}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all"
                  >
                    แปลงข้อมูล
                  </button>
                </div>
              </div>

              {/* Right: Preview Table */}
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-600">
                  ระบบวิเคราะห์อัตโนมัติ
                </label>
                <div className="bg-slate-50 rounded-[2rem] border border-slate-200 overflow-hidden min-h-80">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-slate-500 font-bold uppercase text-[10px] tracking-widest">
                        <td className="px-4 py-3">ไซส์</td>
                        <td className="px-4 py-3 text-center">ลูกค้าขอ</td>
                        <td className="px-4 py-3 text-center">ปรับจริง</td>
                        <td className="px-4 py-3 text-center">สถานะ</td>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsedResults.length > 0 ? (
                        parsedResults.map((res, i) => (
                          <tr
                            key={i}
                            className="hover:bg-white transition-colors"
                          >
                            <td className="px-4 py-3 font-black text-slate-700">
                              {res.size}
                            </td>
                            <td className="px-4 py-3 text-center text-slate-500">
                              {res.requested}
                            </td>
                            <td
                              className={`px-4 py-3 text-center font-black ${res.requested !== res.adjusted ? "text-amber-600" : "text-indigo-600"}`}
                            >
                              {res.adjusted}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {res.status === "success" && (
                                <span className="text-emerald-500">✅</span>
                              )}
                              {res.status === "warning" && (
                                <div className="group relative inline-block">
                                  <span className="text-amber-500 cursor-help">
                                    ⚠
                                  </span>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-800 text-white text-[10px] rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                    {res.message}
                                  </div>
                                </div>
                              )}
                              {res.status === "error" && (
                                <div className="group relative inline-block">
                                  <span className="text-red-500 cursor-help">
                                    ❌
                                  </span>
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 p-2 bg-slate-800 text-white text-[10px] rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                                    {res.message}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="4"
                            className="px-4 py-20 text-center text-slate-300 italic"
                          >
                            รอการวางข้อความและกด "แปลงข้อมูล"
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {parsedResults.length > 0 && (
                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                        ยอดรวมจาก Spec
                      </p>
                      <p className="text-xl font-black text-indigo-600">
                        {parsedResults.reduce((sum, r) => sum + r.adjusted, 0)}{" "}
                        <span className="text-xs">ตัว</span>
                      </p>
                    </div>
                    <button
                      onClick={confirmSpec}
                      className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-black shadow-lg hover:shadow-emerald-100 hover:-translate-y-0.5 transition-all"
                    >
                      ยืนยันลง Matrix
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateOrder;
