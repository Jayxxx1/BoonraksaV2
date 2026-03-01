import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/auth-store";
import { Link } from "react-router-dom";
import api from "../../api/config";
import {
  HiOutlineArrowLeft,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineArrowPath,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
} from "react-icons/hi2";

export default function StockCheck() {
  const { token } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const getAuthHeader = useCallback(
    () => ({ Authorization: `Bearer ${token}` }),
    [token],
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;
      const [prodRes, catRes] = await Promise.all([
        api.get("/products", {
          headers: getAuthHeader(),
          params: { ...params, includeVariants: true },
        }),
        api.get("/categories", { headers: getAuthHeader() }),
      ]);
      setProducts(prodRes.data.data || []);
      if (catRes.data.success) setCategories(catRes.data.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, getAuthHeader]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 400);
    return () => clearTimeout(t);
  }, [fetchData]);
  useEffect(() => {
    const i = setInterval(() => fetchData(), 30000);
    return () => clearInterval(i);
  }, [fetchData]);

  const getStockStatus = (stock, minStock) => {
    if (stock === 0)
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "หมดสต็อก",
        icon: HiOutlineExclamationCircle,
      };
    if (stock <= minStock)
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "สต็อกต่ำ",
        icon: HiOutlineExclamationCircle,
      };
    return {
      bg: "bg-green-100",
      text: "text-green-700",
      label: "มีสต็อก",
      icon: HiOutlineCheckCircle,
    };
  };

  if (loading && products.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-erp-in">
        <div className="erp-spinner"></div>
        <p className="text-slate-500 text-[12px] font-bold mt-4">
          กำลังโหลดข้อมูลสต็อก...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in">
        <div className="erp-page-header mb-5">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
            >
              <HiOutlineArrowLeft className="w-4 h-4" />
            </Link>
            <div className="space-y-0.5">
              <h1 className="erp-page-title">
                <div className="erp-title-accent"></div>เช็คสต็อกสินค้า
              </h1>
              <p className="erp-page-subtitle flex items-center gap-2">
                ดูข้อมูลสต็อคแบบ Real-time
                <span className="erp-status-badge bg-green-100 text-green-700 border-green-200">
                  อัปเดต: {lastRefresh.toLocaleTimeString("th-TH")}
                </span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative group">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหรือรหัสสินค้า..."
                className="erp-search-input w-56"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="relative group">
              <HiOutlineFunnel className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                className="erp-search-input pl-10 pr-8 appearance-none cursor-pointer"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">ทุกหมวดหมู่</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={fetchData}
              className="group p-2 bg-white border border-slate-200 rounded-md hover:border-indigo-300 hover:bg-indigo-50/30 transition-all shadow-sm"
              title="รีเฟรช"
            >
              <HiOutlineArrowPath
                className={`w-4 h-4 text-slate-500 group-hover:text-indigo-600 ${loading ? "animate-spin text-indigo-600" : ""}`}
              />
            </button>
          </div>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {products.map((product) => (
              <div
                key={product.id}
                className="erp-section hover:shadow-md transition-all"
              >
                <div className="flex gap-4">
                  {product.imageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-[13px] font-black text-slate-800">
                          {product.name}
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          รหัส: {product.codePrefix || "-"}
                        </p>
                      </div>
                      <span className="erp-status-badge bg-slate-100 text-slate-600 border-slate-200">
                        {product.category?.name}
                      </span>
                    </div>
                    {product.variants && product.variants.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          สต็อกแต่ละรุ่น
                        </p>
                        <div className="grid grid-cols-1 gap-1.5">
                          {product.variants.map((variant) => {
                            const status = getStockStatus(
                              variant.stock,
                              variant.minStock,
                            );
                            const StatusIcon = status.icon;
                            return (
                              <div
                                key={variant.id}
                                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-[12px] font-bold text-slate-700">
                                    {variant.color} / {variant.size}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    SKU: {variant.sku}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2.5">
                                  <div className="text-right">
                                    <p className="text-lg font-black text-slate-800">
                                      {variant.stock}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      ต่ำสุด: {variant.minStock}
                                    </p>
                                  </div>
                                  <div
                                    className={`px-2 py-1 rounded-md flex items-center gap-1 ${status.bg} ${status.text}`}
                                  >
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-bold">
                                      {status.label}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-[11px] font-bold text-slate-600">
                        สต็อกรวมทั้งหมด
                      </p>
                      <p className="text-lg font-black text-indigo-600">
                        {product.totalStock || 0} ชิ้น
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="erp-empty-state animate-erp-slide-up">
              <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3">
                <HiOutlineMagnifyingGlass className="w-5 h-5 text-slate-300" />
              </div>
              <h3 className="text-sm font-black text-slate-900 mb-1">
                ไม่พบสินค้า
              </h3>
              <p className="text-[11px] text-slate-400">
                ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองหมวดหมู่
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
