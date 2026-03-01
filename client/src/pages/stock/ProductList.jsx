import { useState, useEffect, useCallback } from "react";
import api from "../../api/config";
import { Link } from "react-router-dom";
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiArrowPath,
  HiOutlineCube,
} from "react-icons/hi2";

export default function ProductList() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [prodRes, catRes] = await Promise.all([
        api.get("/products", {
          params: { search, categoryId: selectedCategory },
        }),
        api.get("/categories"),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(), 400);
    return () => clearTimeout(t);
  }, [search, selectedCategory, fetchData]);

  if (loading && products.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-erp-in">
        <div className="erp-spinner"></div>
        <p className="text-slate-500 text-[12px] font-bold mt-4">
          กำลังโหลดข้อมูลสินค้า...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in">
        {/* ── Header ── */}
        <div className="erp-page-header mb-5">
          <div className="space-y-0.5">
            <h1 className="erp-page-title">
              <div className="erp-title-accent"></div>คลังสินค้า
            </h1>
            <p className="erp-page-subtitle">
              จัดการข้อมูลสินค้าและสต็อกทั้งหมด
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative group">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <input
                type="text"
                placeholder="ค้นหารหัสหรือชื่อสินค้า..."
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
              title="รีเฟรช"
              className="group p-2 bg-white border border-slate-200 rounded-md hover:border-indigo-300 hover:bg-indigo-50/30 transition-all shadow-sm"
            >
              <HiArrowPath
                className={`w-4 h-4 text-slate-500 group-hover:text-indigo-600 ${loading ? "animate-spin text-indigo-600" : ""}`}
              />
            </button>
            <Link
              to="/product/create"
              className="erp-action-btn !bg-indigo-600 !text-white hover:!bg-indigo-500"
            >
              <HiOutlinePlus className="w-4 h-4" /> เพิ่มสินค้า
            </Link>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-100 text-rose-700 px-3 py-2.5 rounded-md mb-4 flex items-center justify-between text-[12px]">
            <p className="font-bold">{error}</p>
            <button
              onClick={fetchData}
              className="text-[10px] underline font-bold"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 animate-stagger">
            {products.map((product) => (
              <Link
                to={`/product/${product.id}`}
                key={product.id}
                className="erp-section group flex flex-col h-full hover:shadow-md transition-all !p-0 overflow-hidden"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 border-b border-slate-100">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-300">
                      <HiOutlineCube className="w-8 h-8 mb-1.5 opacity-20" />
                      <span className="text-[9px] font-bold tracking-widest uppercase">
                        ไม่มีรูปภาพ
                      </span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <span className="erp-status-badge bg-white/90 backdrop-blur shadow-sm text-slate-600 border-white/50">
                      {product.category?.name || "ไม่ระบุหมวดหมู่"}
                    </span>
                  </div>
                </div>
                <div className="p-3 flex flex-col flex-grow">
                  <div className="mb-2">
                    <h3 className="font-black text-[12.5px] text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-0.5">
                      รหัส:{" "}
                      <span className="text-slate-600">
                        {product.codePrefix || "-"}
                      </span>
                    </p>
                  </div>
                  <div className="mt-auto pt-2.5 flex justify-between items-end border-t border-slate-100">
                    <div>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        ราคา
                      </p>
                      <p className="text-base font-black text-slate-900">
                        <span className="text-[11px] font-medium mr-0.5 text-slate-400">
                          ฿
                        </span>
                        {product.startPrice?.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                        สต็อก
                      </p>
                      <span
                        className={`erp-status-badge ${product.totalStock > 0 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-rose-50 text-rose-700 border-rose-200"}`}
                      >
                        {product.totalStock}{" "}
                        <span className="ml-0.5 lowercase font-medium">
                          pcs
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
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
              <p className="text-[11px] text-slate-400 mb-3">
                ลองปรับการค้นหาหรือตัวกรองเพื่อหาสิ่งที่ต้องการ
              </p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("");
                }}
                className="text-indigo-600 font-bold text-[11px] hover:underline"
              >
                ล้างตัวกรองทั้งหมด
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}
