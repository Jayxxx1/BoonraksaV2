import { useState, useEffect } from "react";
import api from "../../api/config";
import { useNavigate, Link } from "react-router-dom";
import {
  HiOutlineSparkles,
  HiOutlineArrowLeft,
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineCube,
  HiOutlineCloudArrowUp,
  HiOutlineCheckCircle,
} from "react-icons/hi2";

export default function CreateProduct() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("MENU"); // MENU | ADD_STOCK | NEW_PRODUCT
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  // --- Add Stock State ---
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockAdditions, setStockAdditions] = useState({}); // { variantId: quantity }

  // --- New Product State ---
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

  // Auth Header Helper
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    // Fetch categories and all products for Add Stock mode
    const fetchData = async () => {
      try {
        const [catRes, prodRes] = await Promise.all([
          api.get("/categories", {
            headers: getAuthHeader(),
          }),
          api.get("/products", {
            headers: getAuthHeader(),
            params: { limit: 100 },
          }),
        ]);
        setCategories(catRes.data.data);
        setAllProducts(prodRes.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // Fetch product details when selected in Add Stock mode
  useEffect(() => {
    if (selectedProductId) {
      api
        .get(`/products/${selectedProductId}`, {
          headers: getAuthHeader(),
        })
        .then((res) => {
          setSelectedProduct(res.data.data);
          setStockAdditions({});
        })
        .catch((err) => console.error(err));
    }
  }, [selectedProductId]);

  // --- Image Upload Logic ---
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadFormData = new FormData();
    uploadFormData.append("file", file);

    setUploading(true);
    try {
      const res = await api.post("/upload", uploadFormData, {
        headers: {
          ...getAuthHeader(),
          "Content-Type": "multipart/form-data",
        },
      });
      setFormData({ ...formData, imageUrl: res.data.data.url });
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถอัปโหลดรูปภาพได้");
    } finally {
      setUploading(false);
    }
  };

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

  // --- Submit Handlers ---
  const handleAddStockSubmit = async (e) => {
    e.preventDefault();
    const items = Object.entries(stockAdditions)
      .filter(([, qty]) => qty > 0)
      .map(([vId, qty]) => ({
        variantId: parseInt(vId),
        quantity: parseInt(qty),
      }));

    if (items.length === 0) return alert("กรุณาระบุจำนวนสินค้าที่ต้องการเพิ่ม");

    setIsSubmitting(true);
    try {
      await api.post("/stock/receive", { items }, { headers: getAuthHeader() });
      alert("บันทึกสต็อกเรียบร้อยแล้ว");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดในการบันทึกสต็อก");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProductSubmit = async (e) => {
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
      await api.post("/products", payload, {
        headers: getAuthHeader(),
      });
      navigate("/");
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Render Sections ---

  const renderMenu = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-10">
      <button
        onClick={() => setViewMode("ADD_STOCK")}
        className="group bg-white p-10 rounded-lg border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-indigo-200 hover:bg-slate-50 transition-all flex flex-col items-center text-center space-y-4"
      >
        <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
          <HiOutlineCube className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-800">
            เดิม: เติมสต็อกสินค้า
          </h3>
          <p className="text-slate-500 font-medium mt-2">
            กรณีเสื้อแบบเดิมเข้าเพิ่ม (เช่น ไซส์ M, XL เข้ามาเพิ่ม)
          </p>
        </div>
      </button>

      <button
        onClick={() => setViewMode("NEW_PRODUCT")}
        className="group bg-white p-10 rounded-lg border border-slate-100 shadow-xl shadow-slate-200/50 hover:border-rose-200 hover:bg-slate-50 transition-all flex flex-col items-center text-center space-y-4"
      >
        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
          <HiOutlineSparkles className="w-10 h-10" />
        </div>
        <div>
          <h3 className="text-2xl font-black text-slate-800">
            ใหม่: เพิ่มรหัสสินค้าใหม่
          </h3>
          <p className="text-slate-500 font-medium mt-2">
            กรณีมีเสื้อผ้าลายใหม่ แบบใหม่ ที่ยังไม่มีในร้าน
          </p>
        </div>
      </button>
    </div>
  );

  const renderAddStock = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-8 rounded-lg border border-slate-100 shadow-sm space-y-6">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <HiOutlineCube className="text-indigo-500" />
          ค้นหาสินค้าที่เข้าเพิ่ม
        </h2>
        <select
          className="w-full p-4 bg-slate-50 border border-slate-200 rounded-md outline-none focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-lg"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
        >
          <option value="">-- เลือกสินค้า --</option>
          {allProducts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.codePrefix} : {p.name}
            </option>
          ))}
        </select>
      </div>

      {selectedProduct && (
        <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-50">
            <h2 className="text-lg font-bold text-slate-800">
              จำนวนที่รับเข้า: {selectedProduct.name}
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 text-slate-400 font-bold text-[10px] uppercase">
                  <th className="px-8 py-4">สี / ไซส์</th>
                  <th className="px-8 py-4">สต็อกปัจจุบัน</th>
                  <th className="px-8 py-4">จำนวนที่รับเพิ่ม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {selectedProduct.variants.map((v) => (
                  <tr
                    key={v.id}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <span className="font-bold text-slate-700">
                        {v.color} - {v.size}
                      </span>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {v.sku}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="bg-slate-100 px-3 py-1 rounded-full font-bold text-slate-500">
                        {v.stock}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <input
                          type="number"
                          min="0"
                          className="w-24 p-2 bg-indigo-50/30 border border-indigo-100 rounded-xl text-center font-bold text-indigo-600 focus:ring-4 focus:ring-indigo-100 transition-all outline-none"
                          placeholder="0"
                          value={stockAdditions[v.id] || ""}
                          onChange={(e) =>
                            setStockAdditions({
                              ...stockAdditions,
                              [v.id]: e.target.value,
                            })
                          }
                        />
                        {stockAdditions[v.id] > 0 && (
                          <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                            <HiOutlineCheckCircle /> รวมเป็น:{" "}
                            {v.stock + parseInt(stockAdditions[v.id])}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-8 bg-slate-50 flex justify-end">
            <button
              onClick={handleAddStockSubmit}
              disabled={isSubmitting}
              className="px-12 py-4 bg-indigo-600 text-white rounded-md font-black text-lg shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการเติมสต็อก"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderNewProduct = () => (
    <form
      onSubmit={handleCreateProductSubmit}
      className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      {/* Basic Info */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm p-8 md:p-10">
        <h2 className="text-lg font-bold text-slate-800 mb-6 border-l-4 border-rose-400 pl-4">
          ข้อมูลสินค้าใหม่
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">
              ชื่อสินค้า *
            </label>
            <input
              required
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-md focus:ring-4 focus:ring-rose-50"
              placeholder="เช่น เสื้อโปโลคอจีน ลายปักบัว"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">
              หมวดหมู่ *
            </label>
            <select
              required
              name="categoryId"
              value={formData.categoryId}
              onChange={handleInputChange}
              className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-md appearance-none"
            >
              <option value="">เลือกหมวดหมู่</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-600">
              รูปภาพสินค้า
            </label>
            <div
              className={`relative border-2 border-dashed rounded-lg transition-all flex flex-col items-center justify-center p-8 ${formData.imageUrl ? "border-emerald-200 bg-emerald-50/30" : "border-slate-200 bg-slate-50 hover:bg-slate-100"}`}
            >
              {formData.imageUrl ? (
                <div className="relative w-40 h-40 group">
                  <img
                    src={formData.imageUrl}
                    alt="preview"
                    className="w-full h-full object-cover rounded-md shadow-lg"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, imageUrl: "" })}
                    className="absolute -top-2 -right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center gap-2">
                  <div
                    className={`w-12 h-12 rounded-md flex items-center justify-center ${uploading ? "bg-indigo-50" : "bg-white shadow-sm"}`}
                  >
                    <HiOutlineCloudArrowUp
                      className={`w-6 h-6 ${uploading ? "animate-bounce text-indigo-500" : "text-slate-400"}`}
                    />
                  </div>
                  <span className="text-sm font-bold text-slate-500">
                    {uploading ? "กำลังอัปโหลด..." : "คลิกเพื่ออัปโหลดรูปภาพ"}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">
              รหัส Prefix (เช่น A101)
            </label>
            <input
              name="codePrefix"
              value={formData.codePrefix}
              onChange={handleInputChange}
              className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-md"
              placeholder="A101"
            />
            <div className="mt-4 opacity-50">
              <label className="text-sm font-bold text-slate-600">
                รายละเอียด (เพิ่มเติม)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="3"
                className="w-full px-5 py-3 bg-slate-50/50 border border-slate-200 rounded-md resize-none mt-2"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Variants */}
      <div className="bg-white rounded-lg border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800">
            จัดการสต็อกและราคาเริ่มต้น
          </h2>
          <button
            type="button"
            onClick={addVariant}
            className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-100 transition-all"
          >
            + เพิ่มสี/ไซส์
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50/30 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <th className="px-8 py-4">รหัส SKU</th>
                <th className="px-8 py-4">สี</th>
                <th className="px-8 py-4">ไซส์</th>
                <th className="px-8 py-4">ราคา (Price)</th>
                <th className="px-8 py-4">สต็อก (Stock)</th>
                <th className="px-8 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {variants.map((v, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/30 transition-colors"
                >
                  <td className="px-8 py-4">
                    <input
                      value={v.sku}
                      onChange={(e) =>
                        handleVariantChange(idx, "sku", e.target.value)
                      }
                      className="w-full bg-transparent border-b border-transparent focus:border-rose-400 outline-none"
                      placeholder="SKU-001"
                    />
                  </td>
                  <td className="px-8 py-4">
                    <input
                      value={v.color}
                      onChange={(e) =>
                        handleVariantChange(idx, "color", e.target.value)
                      }
                      className="w-full bg-transparent border-b border-transparent focus:border-rose-400 outline-none"
                      placeholder="ดำ"
                    />
                  </td>
                  <td className="px-8 py-4">
                    <select
                      value={v.size}
                      onChange={(e) =>
                        handleVariantChange(idx, "size", e.target.value)
                      }
                      className="bg-transparent outline-none"
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
                  <td className="px-8 py-4">
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) =>
                        handleVariantChange(idx, "price", e.target.value)
                      }
                      className="w-20 font-bold text-emerald-600 bg-transparent border-b border-transparent focus:border-emerald-400 outline-none"
                    />
                  </td>
                  <td className="px-8 py-4">
                    <input
                      type="number"
                      value={v.stock}
                      onChange={(e) =>
                        handleVariantChange(idx, "stock", e.target.value)
                      }
                      className="w-16 p-2 bg-slate-50 rounded-xl text-center font-bold text-rose-500"
                    />
                  </td>
                  <td className="px-8 py-4 text-right">
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setVariants(variants.filter((_, i) => i !== idx))
                        }
                        className="text-slate-300 hover:text-rose-500"
                      >
                        <HiOutlineTrash />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex justify-end gap-4 p-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-12 py-5 bg-slate-900 text-white rounded-lg font-black text-xl shadow-2xl hover:bg-rose-600 transition-all disabled:opacity-50"
        >
          {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการเพิ่มสินค้าใหม่"}
        </button>
      </div>
    </form>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              viewMode === "MENU" ? navigate("/") : setViewMode("MENU")
            }
            className="p-3 bg-white border border-slate-200 rounded-md text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
          >
            <HiOutlineArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              {viewMode === "MENU"
                ? "จัดการสต็อกและสินค้า"
                : viewMode === "ADD_STOCK"
                  ? "เติมสต็อกสินค้าเดิม"
                  : "เพิ่มรหัสสินค้าใหม่"}
            </h1>
            <p className="text-slate-500 font-medium">
              {viewMode === "MENU"
                ? "เลือกวิธีการทำรายการที่คุณต้องการ"
                : "กรอกข้อมูลเพื่อนำสินค้าเข้าสู่ระบบที่คลัง"}
            </p>
          </div>
        </div>
      </div>

      {viewMode === "MENU" && renderMenu()}
      {viewMode === "ADD_STOCK" && renderAddStock()}
      {viewMode === "NEW_PRODUCT" && renderNewProduct()}
    </div>
  );
}
