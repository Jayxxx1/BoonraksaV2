import { useState, useEffect, useCallback, useMemo } from "react";
import api from "../../api/config";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineTruck,
  HiOutlineClipboardDocumentList,
  HiOutlineBanknotes,
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineCube,
} from "react-icons/hi2";
import { Link } from "react-router-dom";

export default function DeliveryDashboard() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("to_ship"); // to_ship | pending_payment | shipped
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch ALL relevant orders for delivery (Ready + Completed)
      // Ideally backend supports view=delivery that returns both,
      // but 'available' returns Ready, we might need a custom query or fetch all
      // For now, let's try fetching 'available' (Ready) AND 'completed' separately or relies on a broad fetch
      // If 'available' only returns active flow, we need to fetch COMPLETED too for history tab.
      // Let's assume we can fetch all or specific statuses.

      const res = await api.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          // We want READY_TO_SHIP and COMPLETED
          // If view='delivery' is supposed to handle this, use it.
          // If not, we fetch all and filter client side for now (simplest given current constraints)
          // or requesting separate statuses.
          status: undefined,
        },
      });

      // Filter for Delivery Relevance
      const relevant = res.data.data.orders.filter(
        (o) =>
          o.status === "READY_TO_SHIP" ||
          o.status === "QC_PASSED" ||
          o.status === "COMPLETED",
      );
      setOrders(relevant);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Filter & Sort Logic
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    const filtered = orders.filter((order) => {
      // Search filter
      if (search) {
        const s = search.toLowerCase();
        const matchesJob = order.jobId?.toLowerCase().includes(s);
        const matchesName = order.customerName?.toLowerCase().includes(s);
        if (!matchesJob && !matchesName) return false;
      }

      const isCod = order.paymentMethod === "COD";
      // Fix: Check balanceDue explicitly to catch partial payments or status mismatches
      const isPaid =
        order.paymentStatus === "PAID" ||
        parseFloat(order.balanceDue || 0) <= 0;
      const isReadyByPayment = isCod || isPaid;

      if (activeTab === "to_ship") {
        // READY_TO_SHIP/QC_PASSED AND (COD OR PAID)
        return (
          (order.status === "READY_TO_SHIP" || order.status === "QC_PASSED") &&
          isReadyByPayment
        );
      }
      if (activeTab === "pending_payment") {
        // READY_TO_SHIP/QC_PASSED BUT NOT PAID (and NOT COD)
        return (
          (order.status === "READY_TO_SHIP" || order.status === "QC_PASSED") &&
          !isReadyByPayment
        );
      }
      if (activeTab === "shipped") {
        return order.status === "COMPLETED";
      }
      return false;
    });

    // Sort: Urgent first, then by date
    return filtered.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [orders, activeTab, search]);

  if (loading && orders.length === 0)
    return (
      <div className="p-12 text-center text-slate-400 font-medium">
        กำลังโหลดข้อมูลจัดส่ง...
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <HiOutlineTruck className="text-indigo-600" />
            แผนกจัดส่งสินค้า (Delivery)
          </h1>
          <p className="text-slate-500 mt-1">
            จัดการการจัดส่ง ตรวจสอบยอดเงิน และบันทึกเลขพัสดุ
          </p>
        </div>

        <div className="relative group">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input
            type="text"
            placeholder="ค้นหา Job ID หรือชื่อลูกค้า..."
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all w-64 text-xs font-bold shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <div className="flex gap-6 overflow-x-auto pb-[-1px]">
          <button
            onClick={() => setActiveTab("to_ship")}
            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "to_ship"
                ? "border-indigo-600 text-indigo-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <HiOutlineCube className="w-5 h-5" />
            ที่ต้องจัดส่ง (To Ship)
            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px]">
              {
                orders.filter(
                  (o) =>
                    (o.status === "READY_TO_SHIP" ||
                      o.status === "QC_PASSED") &&
                    (o.paymentMethod === "COD" ||
                      o.paymentStatus === "PAID" ||
                      parseFloat(o.balanceDue || 0) <= 0),
                ).length
              }
            </span>
          </button>

          <button
            onClick={() => setActiveTab("pending_payment")}
            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "pending_payment"
                ? "border-orange-500 text-orange-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <HiOutlineBanknotes className="w-5 h-5" />
            รอการเงิน (Pending Payment)
            <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full text-[10px]">
              {
                orders.filter(
                  (o) =>
                    (o.status === "READY_TO_SHIP" ||
                      o.status === "QC_PASSED") &&
                    !(
                      o.paymentMethod === "COD" ||
                      o.paymentStatus === "PAID" ||
                      parseFloat(o.balanceDue || 0) <= 0
                    ),
                ).length
              }
            </span>
          </button>

          <button
            onClick={() => setActiveTab("shipped")}
            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === "shipped"
                ? "border-emerald-500 text-emerald-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            <HiOutlineCheckCircle className="w-5 h-5" />
            จัดส่งแล้ว (Shipped)
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <HiOutlineMagnifyingGlass className="w-8 h-8 opacity-50" />
            </div>
            <p className="font-bold">ไม่มีรายการในหมวดหมู่นี้</p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase font-black tracking-wider">
                    <th className="p-4 w-[120px]">Job ID</th>
                    <th className="p-4">ลูกค้า (Customer)</th>
                    <th className="p-4">ที่อยู่จัดส่ง (Address)</th>
                    <th className="p-4 w-[150px]">การชำระเงิน</th>
                    <th className="p-4 text-right w-[280px]">
                      {activeTab === "shipped"
                        ? "เลขพัสดุ (Tracking)"
                        : "ดำเนินการ (Action)"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="hover:bg-indigo-50/30 transition-colors"
                    >
                      <td className="p-4 align-top">
                        <Link
                          to={`/delivery/order/${order.id}`}
                          className="font-bold text-slate-900 hover:text-indigo-600 hover:underline"
                        >
                          {order.jobId}
                        </Link>
                        {order.isUrgent && (
                          <span className="block text-[10px] text-rose-600 font-bold mt-1">
                            ⚡ งานด่วน
                          </span>
                        )}
                      </td>
                      <td className="p-4 align-top">
                        <div className="font-bold text-slate-800">
                          {order.customerName}
                        </div>
                        <div className="text-xs text-slate-500">
                          {order.customerFb || "-"}
                        </div>
                      </td>
                      <td className="p-4 align-top max-w-[300px]">
                        <p className="text-slate-600 text-xs leading-relaxed truncate hover:whitespace-normal">
                          {order.customerAddress || (
                            <span className="text-rose-400 italic">
                              ไม่ระบุที่อยู่
                            </span>
                          )}
                        </p>
                      </td>
                      <td className="p-4 align-top">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900 uppercase tracking-tight">
                              {order.displayStatusLabel ||
                                (order.status === "READY_TO_SHIP"
                                  ? "พร้อมจัดส่ง"
                                  : "รอจัดส่ง")}
                            </span>
                            {order.paymentMethod === "COD" && (
                              <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[10px] font-black uppercase">
                                COD
                              </span>
                            )}
                          </div>

                          {parseFloat(order.balanceDue || 0) > 0 &&
                          order.paymentMethod !== "COD" ? (
                            <div className="flex flex-col gap-0.5">
                              {order.subStatusLabel && (
                                <span className="text-[10px] font-black text-orange-600 animate-pulse">
                                  ⚠️ {order.subStatusLabel}
                                </span>
                              )}
                              <span className="text-[10px] font-black text-rose-600">
                                ⚠️ ยังชำระเงินไม่ครบ
                              </span>
                              <span className="text-[10px] text-slate-400 font-bold">
                                ค้างชำระ: {order.balanceDue?.toLocaleString()}฿
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col gap-0.5">
                              {order.subStatusLabel && (
                                <span className="text-[10px] font-black text-orange-600 animate-pulse">
                                  ⚠️ {order.subStatusLabel}
                                </span>
                              )}
                              <span className="text-[10px] text-emerald-600 font-bold">
                                {order.paymentMethod === "COD"
                                  ? `ยอดเก็บเงินปลายทาง: ${order.balanceDue?.toLocaleString()}฿`
                                  : "ชำระเงินเรียบร้อยแล้ว"}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-4 align-top text-right">
                        {activeTab === "shipped" ? (
                          <div className="inline-block bg-slate-100 px-3 py-1 rounded-full text-slate-700 font-mono text-sm border font-bold">
                            {order.trackingNo || "-"}
                          </div>
                        ) : activeTab === "pending_payment" ? (
                          <Link
                            to={`/delivery/order/${order.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                          >
                            <HiOutlineClipboardDocumentList className="w-4 h-4" />
                            ดูรายละเอียดยอด
                          </Link>
                        ) : (
                          <Link
                            to={`/delivery/order/${order.id}`}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
                          >
                            <HiOutlineClipboardDocumentList className="w-4 h-4" />
                            ดำเนินการจัดส่ง
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards for Delivery */}
            <div className="lg:hidden flex flex-col gap-3 p-3 bg-slate-50/50">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm transition-all"
                >
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span
                            className={`text-sm font-black tracking-tight ${order.isUrgent ? "text-rose-600" : "text-slate-900"}`}
                          >
                            {order.jobId}
                          </span>
                          <span className="text-[11px] text-slate-600 font-bold max-w-[160px] truncate">
                            {order.customerName}
                          </span>
                        </div>
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg border flex-shrink-0 text-center bg-indigo-50 text-indigo-700 border-transparent">
                          {order.displayStatusLabel ||
                            (order.status === "QC_PASSED" ||
                            order.status === "READY_TO_SHIP"
                              ? "พร้อมจัดส่ง"
                              : "รอจัดส่ง")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {order.isUrgent && (
                          <span className="text-[9px] font-black uppercase text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded border border-rose-200">
                            ⚡ งานด่วน
                          </span>
                        )}
                        {order.paymentMethod === "COD" && (
                          <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded text-[9px] font-black uppercase">
                            COD
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                      {order.customerAddress || (
                        <span className="text-rose-400 italic">
                          ไม่ระบุที่อยู่
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex justify-between items-end mt-2 pt-2 border-t border-slate-100">
                    <div className="flex flex-col gap-0.5">
                      {parseFloat(order.balanceDue || 0) > 0 &&
                      order.paymentMethod !== "COD" ? (
                        <>
                          {order.subStatusLabel && (
                            <span className="text-[10px] font-black text-orange-600 animate-pulse">
                              ⚠️ {order.subStatusLabel}
                            </span>
                          )}
                          <span className="text-[10px] font-black text-rose-600">
                            ⚠️ ยังชำระเงินไม่ครบ
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            ค้างชำระ: {order.balanceDue?.toLocaleString()}฿
                          </span>
                        </>
                      ) : (
                        <>
                          {order.subStatusLabel && (
                            <span className="text-[10px] font-black text-orange-600 animate-pulse">
                              ⚠️ {order.subStatusLabel}
                            </span>
                          )}
                          <span className="text-[10px] text-emerald-600 font-bold">
                            {order.paymentMethod === "COD"
                              ? `ยอดเก็บปลายทาง: ${order.balanceDue?.toLocaleString()}฿`
                              : "ชำระเงินเรียบร้อยแล้ว"}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center">
                      {activeTab === "shipped" ? (
                        <div className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-700 font-mono text-[10px] font-bold border">
                          {order.trackingNo || "-"}
                        </div>
                      ) : (
                        <Link
                          to={`/delivery/order/${order.id}`}
                          className="px-4 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-[10.5px] font-black hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm active:scale-95"
                        >
                          {activeTab === "pending_payment"
                            ? "ดูรายละเอียด"
                            : "ดำเนินการ"}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
