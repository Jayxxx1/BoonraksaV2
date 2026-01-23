// client/src/components/ProductList.jsx
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiArrowPath,
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
      setError("ไม่สามารถเชื่อมต่อ Server ได้ กรุณาลองใหม่อีกครั้ง");
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
      <div className="flex flex-col items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-pastel-blue border-t-pastel-pink rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">กำลังเตรียมข้อมูลสินค้า...</p>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-10">
      {/* Header & Tool Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
            คลังสินค้า
          </h1>
          <p className="text-slate-500">
            จัดการข้อมูลสินค้าและสต็อกทั้งหมดของคุณ
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative group">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pastel-blue transition-colors" />
            <input
              type="text"
              placeholder="ค้นหาชื่อหรือรหัส..."
              className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-blue/30 focus:border-pastel-blue transition-all w-64 shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category Filter */}
          <div className="relative group">
            <HiOutlineFunnel className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pastel-blue/30 focus:border-pastel-blue transition-all appearance-none cursor-pointer shadow-sm text-slate-600"
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
          >
            <HiArrowPath
              className={`w-5 h-5 ${loading ? "animate-spin" : ""}`}
            />
          </button>

          <Link
            to="/product/create"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pastel-blue to-indigo-500 text-white rounded-xl font-bold shadow-lg shadow-pastel-blue/20 hover:scale-105 active:scale-95 transition-all"
          >
            <HiOutlinePlus className="w-5 h-5" />
            เพิ่มสินค้า
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-2xl mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <p className="font-medium">{error}</p>
          </div>
          <button onClick={fetchData} className="underline font-bold">
            ลองอีกครั้ง
          </button>
        </div>
      )}

      {/* Grid Layout */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {products.map((product) => (
            <Link
              to={`/product/${product.id}`}
              key={product.id}
              className="group bg-white rounded-[2rem] shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden border border-slate-100 flex flex-col h-full"
            >
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                ) : (
                  <div className="h-full w-full flex flex-col items-center justify-center text-slate-300">
                    <HiOutlineCube className="w-16 h-16 mb-2 opacity-20" />
                    <span className="text-xs font-bold tracking-widest uppercase">
                      No Image
                    </span>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    {product.category?.name || "Uncategorized"}
                  </span>
                </div>
              </div>

              {/* Info Container */}
              <div className="p-6 flex flex-col flex-grow">
                <div className="mb-4">
                  <h3
                    className="font-bold text-lg text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors"
                    title={product.name}
                  >
                    {product.name}
                  </h3>
                  <p className="text-xs font-medium text-slate-400 mt-1">
                    รหัสต้นบุญ:{" "}
                    <span className="text-slate-600">
                      {product.codePrefix || "-"}
                    </span>
                  </p>
                </div>

                <div className="mt-auto pt-5 flex justify-between items-end border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">
                      ราคาเริ่มต้น
                    </p>
                    <p className="text-xl font-black text-slate-800">
                      <span className="text-sm font-bold mr-0.5 italic text-slate-400">
                        ฿
                      </span>
                      {product.startPrice?.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      คงเหลือ
                    </p>
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] font-bold transition-colors ${
                        product.totalStock > 0
                          ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100"
                          : "bg-rose-50 text-rose-600"
                      }`}
                    >
                      {product.totalStock} <span className="ml-0.5">ชิ้น</span>
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="bg-white rounded-[3rem] border border-dashed border-slate-200 py-24 flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-pastel-blue/10 rounded-full flex items-center justify-center mb-6">
              <HiOutlineMagnifyingGlass className="w-12 h-12 text-pastel-blue" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              ไม่พบรายการสินค้า
            </h3>
            <p className="text-slate-500 max-w-xs">
              ลองปรับเปลี่ยนคำค้นหาหรือตัวกรองหมวดหมู่ เพื่อหาสินค้าที่ต้องการ
            </p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("");
              }}
              className="mt-6 text-indigo-600 font-bold text-sm hover:underline"
            >
              ล้างตัวเลือกทั้งหมด
            </button>
          </div>
        )
      )}
    </div>
  );
}
