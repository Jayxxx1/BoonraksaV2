// client/src/components/ProductList.jsx
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
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
        axios.get("http://localhost:8000/api/products", {
          params: { search, categoryId: selectedCategory },
        }),
        axios.get("http://localhost:8000/api/categories"),
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
    const timer = setTimeout(() => {
      fetchData();
    }, 400); // Debounce
    return () => clearTimeout(timer);
  }, [search, selectedCategory, fetchData]);

  if (loading && products.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 text-sm font-medium">
          กำลังโหลดข้อมูลสินค้า...
        </p>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-erp-in">
      {/* Header & Tool Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            คลังสินค้า
          </h1>
          <p className="text-slate-500 text-sm">
            จัดการข้อมูลสินค้าและสต็อกทั้งหมด
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative group">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="ค้นหารหัสหรือชื่อสินค้า..."
              className="erp-input pl-10 w-full sm:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative group">
            <HiOutlineFunnel className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="erp-input pl-10 pr-8 appearance-none cursor-pointer w-full sm:w-48"
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
            className="erp-button erp-button-secondary p-2.5"
          >
            <HiArrowPath
              className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
            />
          </button>

          <Link to="/product/create" className="erp-button erp-button-primary">
            <HiOutlinePlus className="w-5 h-5" />
            เพิ่มสินค้า
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 px-4 py-3 rounded-lg mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-lg">⚠️</span>
            <p className="font-semibold">{error}</p>
          </div>
          <button onClick={fetchData} className="text-xs underline font-bold">
            ลองใหม่
          </button>
        </div>
      )}

      {/* Grid Layout */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <Link
              to={`/product/${product.id}`}
              key={product.id}
              className="erp-card erp-card-hover group flex flex-col h-full bg-white shadow-sm"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-50 border-b border-slate-100">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-slate-300">
                    <HiOutlineCube className="w-10 h-10 mb-2 opacity-20" />
                    <span className="text-[10px] font-bold tracking-widest uppercase">
                      ไม่มีรูปภาพ
                    </span>
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <span className="erp-badge bg-white/90 backdrop-blur shadow-sm text-slate-600">
                    {product.category?.name || "ไม่ระบุหมวดหมู่"}
                  </span>
                </div>
              </div>

              {/* Info Container */}
              <div className="p-4 flex flex-col flex-grow">
                <div className="mb-3">
                  <h3 className="font-bold text-sm text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                    รหัสสินค้า:{" "}
                    <span className="text-slate-600">
                      {product.codePrefix || "-"}
                    </span>
                  </p>
                </div>

                <div className="mt-auto pt-3 flex justify-between items-end border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      ราคา
                    </p>
                    <p className="text-lg font-bold text-slate-900">
                      <span className="text-[12px] font-medium mr-0.5 text-slate-400">
                        ฿
                      </span>
                      {product.startPrice?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      สต็อก
                    </p>
                    <span
                      className={`erp-badge ${
                        product.totalStock > 0
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      {product.totalStock}{" "}
                      <span className="ml-0.5 lowercase font-medium">
                        ตัว (pcs)
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
          <div className="erp-card border-dashed border-2 py-20 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <HiOutlineMagnifyingGlass className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">
              ไม่พบสินค้า
            </h3>
            <p className="text-slate-400 text-sm max-w-xs">
              ลองปรับการค้นหาหรือตัวกรองเพื่อหาสิ่งที่ต้องการ
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("");
              }}
              className="mt-4 text-indigo-600 font-bold text-xs hover:underline"
            >
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        )
      )}
    </div>
  );
}
