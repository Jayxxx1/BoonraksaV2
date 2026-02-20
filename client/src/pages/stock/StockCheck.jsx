import { useState, useEffect } from "react";
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

  const getAuthHeader = () => ({ Authorization: `Bearer ${token}` });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory) params.categoryId = selectedCategory;

      const [prodRes, catRes] = await Promise.all([
        api.get("/products", {
          headers: getAuthHeader(),
          params,
        }),
        api.get("/categories", {
          headers: getAuthHeader(),
        }),
      ]);

      setProducts(prodRes.data.data || []);
      if (catRes.data.success) setCategories(catRes.data.data);
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, selectedCategory, token]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStockStatus = (stock, minStock) => {
    if (stock === 0) {
      return {
        bg: "bg-red-100",
        text: "text-red-700",
        label: "หมดสต็อก",
        icon: HiOutlineExclamationCircle,
      };
    } else if (stock <= minStock) {
      return {
        bg: "bg-yellow-100",
        text: "text-yellow-700",
        label: "สต็อกต่ำ",
        icon: HiOutlineExclamationCircle,
      };
    } else {
      return {
        bg: "bg-green-100",
        text: "text-green-700",
        label: "มีสต็อก",
        icon: HiOutlineCheckCircle,
      };
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">กำลังโหลดข้อมูลสต็อก...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50/20 to-teal-50/20 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
            >
              <HiOutlineArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                เช็คสต็อกสินค้า
              </h1>
              <p className="text-slate-500 font-medium mt-1 flex items-center gap-2">
                ดูข้อมูลสต็อคแบบ Real-time
                <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold">
                  อัปเดต: {lastRefresh.toLocaleTimeString("th-TH")}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative group">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหรือรหัสสินค้า..."
                className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all w-64 shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Category Filter */}
            <div className="relative group">
              <HiOutlineFunnel className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                className="pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all appearance-none cursor-pointer shadow-sm text-slate-600"
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
              className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:text-indigo-600 hover:border-indigo-100 hover:bg-indigo-50 transition-all shadow-sm"
              title="รีเฟรช"
            >
              <HiOutlineArrowPath
                className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Products Grid */}
        {products.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all p-6"
              >
                <div className="flex gap-6">
                  {/* Product Image */}
                  {product.imageUrl && (
                    <div className="flex-shrink-0">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-24 h-24 object-cover rounded-2xl"
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-lg font-black text-slate-800">
                          {product.name}
                        </h3>
                        <p className="text-sm text-slate-500 font-medium">
                          รหัส: {product.codePrefix || "-"}
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold">
                        {product.category?.name}
                      </span>
                    </div>

                    {/* Variants List */}
                    {product.variants && product.variants.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-400 uppercase">
                          สต็อกแต่ละรุ่น
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {product.variants.map((variant) => {
                            const status = getStockStatus(
                              variant.stock,
                              variant.minStock,
                            );
                            const StatusIcon = status.icon;

                            return (
                              <div
                                key={variant.id}
                                className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                              >
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-700">
                                    {variant.color} / {variant.size}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    SKU: {variant.sku}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <div className="text-right">
                                    <p className="text-2xl font-black text-slate-800">
                                      {variant.stock}
                                    </p>
                                    <p className="text-xs text-slate-400">
                                      ต่ำสุด: {variant.minStock}
                                    </p>
                                  </div>
                                  <div
                                    className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${status.bg} ${status.text}`}
                                  >
                                    <StatusIcon className="w-4 h-4" />
                                    <span className="text-xs font-bold">
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

                    {/* Total Stock Badge */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                      <p className="text-sm font-bold text-slate-600">
                        สต็อกรวมทั้งหมด
                      </p>
                      <p className="text-2xl font-black text-indigo-600">
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
            <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 py-24 flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <HiOutlineMagnifyingGlass className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                ไม่พบสินค้า
              </h3>
              <p className="text-slate-500 max-w-xs">
                ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองหมวดหมู่
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
