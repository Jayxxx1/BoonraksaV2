import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  HiOutlineSparkles,
  HiOutlineArrowLeft,
  HiOutlineTrash,
  HiOutlinePlus,
} from "react-icons/hi2";

export default function CreateProduct() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    codePrefix: "",
    description: "",
    imageUrl: "",
    categoryId: "",
  });

  const [variants, setVariants] = useState([
    { sku: "", color: "", size: "Free", price: 0, cost: 0, stock: 0 },
  ]);

  useEffect(() => {
    axios
      .get("http://localhost:8000/api/categories")
      .then((res) => setCategories(res.data.data))
      .catch((err) => console.error(err));
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...variants];
    newVariants[index][field] = value;
    setVariants(newVariants);
  };

  const addVariant = () => {
    setVariants([
      ...variants,
      { sku: "", color: "", size: "Free", price: 0, cost: 0, stock: 0 },
    ]);
  };

  const removeVariant = (index) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.categoryId) return alert("กรุณาเลือกหมวดหมู่");

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        variants: variants.map((v) => ({
          ...v,
          code: `${formData.codePrefix}-${v.color}-${v.size}`,
        })),
      };

      const res = await axios.post(
        "http://localhost:8000/api/products",
        payload,
      );
      if (res.data.success) {
        navigate("/");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-10 max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="p-2 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-100 transition-all shadow-sm"
          >
            <HiOutlineArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <HiOutlineSparkles className="text-pastel-blue" />
              เพิ่มสินค้าใหม่
            </h1>
            <p className="text-sm text-slate-500 font-medium">
              กรอกรายละเอียดเพื่อนำสินค้าเข้าสู่ระบบ
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info Card */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 md:p-10">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-pastel-blue rounded-full"></span>
            ข้อมูลพื้นฐาน
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 ml-1">
                ชื่อสินค้า <span className="text-rose-400">*</span>
              </label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pastel-blue/20 focus:border-pastel-blue transition-all"
                placeholder="เช่น เสื้อยืด Oversize สีพื้น"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 ml-1">
                หมวดหมู่ <span className="text-rose-400">*</span>
              </label>
              <select
                required
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pastel-blue/20 focus:border-pastel-blue transition-all appearance-none cursor-pointer"
              >
                <option value="">เลือกประเภทสินค้า</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 ml-1">
                รหัสต้นบุญ (Prefix)
              </label>
              <input
                type="text"
                name="codePrefix"
                value={formData.codePrefix}
                onChange={handleInputChange}
                className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pastel-blue/20 focus:border-pastel-blue transition-all"
                placeholder="เช่น TS-001"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 ml-1">
                รูปภาพสินค้า (URL)
              </label>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pastel-blue/20 focus:border-pastel-blue transition-all"
                placeholder="วางลิงก์รูปภาพจาก S3 หรือแหล่งอื่น"
              />
            </div>

            <div className="col-span-2 space-y-2">
              <label className="text-sm font-bold text-slate-600 ml-1">
                รายละเอียดสินค้า
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-pastel-blue/20 focus:border-pastel-blue transition-all resize-none"
                placeholder="อธิบายรายละเอียดสินค้าเบื้องต้น..."
              ></textarea>
            </div>
          </div>
        </div>

        {/* Variants Card */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 md:p-10 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-pastel-pink rounded-full"></span>
              สต็อกและรูปแบบสินค้า
            </h2>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors"
            >
              <HiOutlinePlus className="w-4 h-4" />
              เพิ่มรูปแบบ
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="px-6 py-4">SKU Code</th>
                  <th className="px-6 py-4">สี</th>
                  <th className="px-6 py-4">ไซส์</th>
                  <th className="px-6 py-4">ต้นทุน</th>
                  <th className="px-6 py-4">ราคาขาย</th>
                  <th className="px-6 py-4">สต็อก</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {variants.map((v, idx) => (
                  <tr
                    key={idx}
                    className="group hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) =>
                          handleVariantChange(idx, "sku", e.target.value)
                        }
                        className="w-full py-1.5 bg-transparent border-b border-transparent focus:border-pastel-blue outline-none transition-all placeholder:text-slate-300"
                        placeholder="SKU-001"
                        required
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={v.color}
                        onChange={(e) =>
                          handleVariantChange(idx, "color", e.target.value)
                        }
                        className="w-full py-1.5 bg-transparent border-b border-transparent focus:border-pastel-blue outline-none transition-all"
                        placeholder="ดำ"
                        required
                      />
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={v.size}
                        onChange={(e) =>
                          handleVariantChange(idx, "size", e.target.value)
                        }
                        className="w-full py-1.5 bg-transparent border-b border-transparent focus:border-pastel-blue outline-none transition-all cursor-pointer"
                      >
                        {["XS", "S", "M", "L", "XL", "2XL", "3XL", "Free"].map(
                          (s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ),
                        )}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={v.cost}
                        onChange={(e) =>
                          handleVariantChange(idx, "cost", e.target.value)
                        }
                        className="w-20 py-1.5 bg-transparent border-b border-transparent focus:border-pastel-blue outline-none transition-all text-right"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className="text-slate-400 mr-1 italic font-medium">
                          ฿
                        </span>
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) =>
                            handleVariantChange(idx, "price", e.target.value)
                          }
                          className="w-20 py-1.5 bg-transparent border-b border-transparent focus:border-pastel-blue outline-none transition-all text-right font-bold text-emerald-600"
                          required
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) =>
                          handleVariantChange(idx, "stock", e.target.value)
                        }
                        className="w-16 py-1 px-2 border border-slate-100 rounded bg-slate-50 text-center font-bold text-indigo-600"
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      {variants.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeVariant(idx)}
                          className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end items-center gap-4 pt-4">
          <Link
            to="/"
            className="px-8 py-3.5 text-slate-500 font-bold hover:text-slate-800 transition-colors"
          >
            ยกเลิกการแก้ไข
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-10 py-3.5 bg-slate-800 text-white rounded-[1.5rem] font-bold shadow-xl shadow-slate-200 transition-all ${
              isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-indigo-600 hover:-translate-y-1 active:scale-95"
            }`}
          >
            {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการเพิ่มสินค้า"}
          </button>
        </div>
      </form>
    </div>
  );
}
