import { useState, useEffect } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";

import {
  HiOutlineArrowLeft,
  HiOutlineCube,
  HiOutlineTag,
  HiOutlineSwatch,
  HiOutlinePencilSquare,
  HiOutlineTrash,
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
        setError("ไม่สามารถโหลดข้อมูลสินค้าได้");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center p-20">
        <div className="w-12 h-12 border-4 border-pastel-blue border-t-pastel-pink rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">
          กำลังโหลดรายละเอียดสินค้า...
        </p>
      </div>
    );

  if (error || !product)
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-rose-500 font-bold mb-4">{error || "ไม่พบสินค้า"}</p>
        <Link to="/" className="text-indigo-600 hover:underline">
          กลับหน้าหลัก
        </Link>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold"
        >
          <HiOutlineArrowLeft className="w-5 h-5" />
          กลับไปหน้ารวม
        </Link>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm font-bold text-sm">
            <HiOutlinePencilSquare className="w-4 h-4" />
            แก้ไขข้อมูล
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Image */}
        <div className="lg:col-span-5">
          <div className="aspect-square bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-4">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-contain rounded-[2rem]"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-200">
                <HiOutlineCube className="w-32 h-32 opacity-10" />
                <span className="font-bold tracking-widest uppercase">
                  No Image
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-7 space-y-8">
          <div>
            <span className="px-4 py-1.5 bg-pastel-blue/20 text-pastel-blue text-xs font-black uppercase tracking-widest rounded-full">
              {product.category?.name || "Uncategorized"}
            </span>
            <h1 className="text-4xl font-black text-slate-800 mt-4 mb-2">
              {product.name}
            </h1>
            <p className="text-slate-400 font-medium">
              รหัส:{" "}
              <span className="text-slate-600">
                {product.codePrefix || "-"}
              </span>
            </p>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <HiOutlineTag className="text-pastel-pink" />
              รายละเอียดสินค้า
            </h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
              {product.description || "ไม่มีรายละเอียดสินค้า"}
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-4">
              <HiOutlineSwatch className="text-pastel-blue" />
              รูปแบบและสต็อก (Variants)
            </h3>

            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="px-6 py-4">SKU</th>
                      <th className="px-6 py-4">สี</th>
                      <th className="px-6 py-4">ไซส์</th>
                      <th className="px-6 py-4 text-right">ราคา</th>
                      <th className="px-6 py-4 text-center">คงเหลือ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {product.variants?.map((v) => (
                      <tr
                        key={v.id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono text-slate-500">
                          {v.sku}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-bold text-slate-700">
                            {v.color}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-600">
                          {v.size}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="text-emerald-600 font-black">
                            ฿{parseFloat(v.price).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                              v.stock > 0
                                ? "bg-indigo-50 text-indigo-600"
                                : "bg-rose-50 text-rose-600"
                            }`}
                          >
                            {v.stock} <span className="opacity-70">ชิ้น</span>
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
