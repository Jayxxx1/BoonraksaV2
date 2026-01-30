import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import {
  HiOutlineArrowLeft,
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineSwatch,
  HiOutlinePencilSquare,
} from "react-icons/hi2";

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`http://localhost:8000/api/products/${id}`);
        if (res.data.success) {
          setProduct(res.data.data);
        }
      } catch (err) {
        console.error(err);
        setError("ไม่สามารถโหลดรายละเอียดสินค้าได้");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 text-sm font-medium">
          กำลังโหลดรายละเอียด...
        </p>
      </div>
    );

  if (error || !product)
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center animate-erp-in">
        <p className="text-rose-500 font-bold mb-4">{error || "ไม่พบสินค้า"}</p>
        <Link to="/" className="text-indigo-600 font-bold hover:underline">
          กลับไปหน้าหลัก
        </Link>
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-erp-in">
      {/* Page Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
          กลับไปหน้ารายการ
        </Link>
        <button className="erp-button erp-button-secondary">
          <HiOutlinePencilSquare className="w-4 h-4" />
          แก้ไขสินค้า
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Product Image */}
        <div className="lg:col-span-4">
          <div className="aspect-square bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden p-2">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-200 bg-slate-50 rounded-md">
                <HiOutlineCube className="w-24 h-24 opacity-10" />
                <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">
                  ไม่มีรูปภาพ
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Product Info */}
        <div className="lg:col-span-8 space-y-6">
          <div className="pb-4 border-b border-slate-200">
            <span className="erp-badge bg-indigo-50 text-indigo-700 border border-indigo-100 mb-2">
              {product.category?.name || "ไม่ระบุหมวดหมู่"}
            </span>
            <h1 className="text-2xl font-bold text-slate-900 mt-2 mb-1">
              {product.name}
            </h1>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              รหัสสินค้า:{" "}
              <span className="text-slate-600">
                {product.codePrefix || "-"}
              </span>
            </p>
          </div>

          <div className="erp-card p-6">
            <h3 className="erp-label flex items-center gap-2 mb-4">
              <HiOutlineTag className="w-4 h-4 text-indigo-500" />
              รายละเอียดสินค้า
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap">
              {product.description || "ไม่มีข้อมูลรายละเอียดสินค้า"}
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="erp-label flex items-center gap-2 ml-1">
              <HiOutlineSwatch className="w-4 h-4 text-indigo-500" />
              รายการสต็อกและไซส์
            </h3>

            <div className="erp-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>สี (Color)</th>
                      <th>ไซส์ (Size)</th>
                      <th className="text-right">ราคา (Price)</th>
                      <th className="text-center">คงเหลือ (Available)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.variants?.map((v) => (
                      <tr key={v.id}>
                        <td className="font-mono text-[12px] text-slate-500">
                          {v.sku}
                        </td>
                        <td className="font-bold text-slate-700">{v.color}</td>
                        <td className="font-bold text-slate-600">{v.size}</td>
                        <td className="text-right font-bold text-slate-900">
                          ฿{parseFloat(v.price).toLocaleString()}
                        </td>
                        <td className="text-center">
                          <span
                            className={`erp-badge ${
                              v.stock > 0
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-rose-50 text-rose-700"
                            }`}
                          >
                            {v.stock}{" "}
                            <span className="lowercase font-medium ml-0.5">
                              ตัว (pcs)
                            </span>
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
