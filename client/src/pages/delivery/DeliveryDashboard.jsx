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
  const [activeTab, setActiveTab] = useState("to_ship");
  const [search, setSearch] = useState("");

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/orders", {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          status: undefined,
        },
      });

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

  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    const filtered = orders.filter((order) => {
      if (search) {
        const s = search.toLowerCase();
        const matchesJob = order.jobId?.toLowerCase().includes(s);
        const matchesName = order.customerName?.toLowerCase().includes(s);
        if (!matchesJob && !matchesName) return false;
      }

      const isCod = order.paymentMethod === "COD";
      const isPaid =
        order.paymentStatus === "PAID" ||
        parseFloat(order.balanceDue || 0) <= 0;
      const isReadyByPayment = isCod || isPaid;

      if (activeTab === "to_ship") {
        return (
          (order.status === "READY_TO_SHIP" || order.status === "QC_PASSED") &&
          isReadyByPayment
        );
      }
      if (activeTab === "pending_payment") {
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

    return filtered.sort((a, b) => {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [orders, activeTab, search]);

  const tabCounts = useMemo(() => {
    const toShip = orders.filter(
      (o) =>
        (o.status === "READY_TO_SHIP" || o.status === "QC_PASSED") &&
        (o.paymentMethod === "COD" ||
          o.paymentStatus === "PAID" ||
          parseFloat(o.balanceDue || 0) <= 0),
    ).length;
    const pending = orders.filter(
      (o) =>
        (o.status === "READY_TO_SHIP" || o.status === "QC_PASSED") &&
        !(
          o.paymentMethod === "COD" ||
          o.paymentStatus === "PAID" ||
          parseFloat(o.balanceDue || 0) <= 0
        ),
    ).length;
    return { toShip, pending };
  }, [orders]);

  if (loading && orders.length === 0)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] animate-erp-in">
        <div className="erp-spinner"></div>
        <p className="text-slate-500 text-[12px] font-bold mt-4">
          กำลังโหลดข้อมูลจัดส่ง...
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in">
        {/* ── Page Header ── */}
        <div className="erp-page-header">
          <div className="space-y-0.5">
            <h1 className="erp-page-title">
              <div className="erp-title-accent"></div>
              แผนกจัดส่งสินค้า (Delivery)
            </h1>
            <p className="erp-page-subtitle">
              จัดการการจัดส่ง ตรวจสอบยอดเงิน และบันทึกเลขพัสดุ
            </p>
          </div>

          <div className="relative group">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
            <input
              type="text"
              placeholder="ค้นหา Job ID หรือชื่อลูกค้า..."
              className="erp-search-input w-56"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="erp-filter-bar !p-0 !mb-5 overflow-hidden">
          <div className="flex border-b-0">
            <button
              onClick={() => setActiveTab("to_ship")}
              className={`flex-1 py-3 px-4 text-[11px] font-black transition-all flex items-center justify-center gap-2 border-b-2 ${
                activeTab === "to_ship"
                  ? "border-indigo-600 text-indigo-700 bg-indigo-50/30"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
              }`}
            >
              <HiOutlineCube className="w-4 h-4" />
              ที่ต้องจัดส่ง
              <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[9px]">
                {tabCounts.toShip}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("pending_payment")}
              className={`flex-1 py-3 px-4 text-[11px] font-black transition-all flex items-center justify-center gap-2 border-b-2 ${
                activeTab === "pending_payment"
                  ? "border-orange-500 text-orange-700 bg-orange-50/30"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
              }`}
            >
              <HiOutlineBanknotes className="w-4 h-4" />
              รอการเงิน
              {tabCounts.pending > 0 && (
                <span className="bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded text-[9px]">
                  {tabCounts.pending}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("shipped")}
              className={`flex-1 py-3 px-4 text-[11px] font-black transition-all flex items-center justify-center gap-2 border-b-2 ${
                activeTab === "shipped"
                  ? "border-emerald-500 text-emerald-700 bg-emerald-50/30"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50"
              }`}
            >
              <HiOutlineCheckCircle className="w-4 h-4" />
              จัดส่งแล้ว
            </button>
          </div>
        </div>

        {/* ── Content ── */}
        {filteredOrders.length === 0 ? (
          <div className="erp-empty-state animate-erp-slide-up">
            <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center mx-auto mb-3">
              <HiOutlineMagnifyingGlass className="w-5 h-5 text-slate-300" />
            </div>
            <h3 className="text-sm font-black text-slate-900 mb-1">
              ไม่มีรายการในหมวดหมู่นี้
            </h3>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block erp-table-container">
              <div className="overflow-x-auto">
                <table className="erp-table">
                  <thead>
                    <tr>
                      <th>Job ID</th>
                      <th>ลูกค้า</th>
                      <th>ที่อยู่จัดส่ง</th>
                      <th>การชำระเงิน</th>
                      <th className="text-right">
                        {activeTab === "shipped" ? "เลขพัสดุ" : "ดำเนินการ"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr
                        key={order.id}
                        className={`transition-colors group ${
                          order.isUrgent
                            ? "bg-rose-50/30 border-l-2 border-l-rose-500"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-2.5 align-top">
                          <Link
                            to={`/delivery/order/${order.id}`}
                            className="text-[12.5px] font-black text-slate-900 hover:text-indigo-600 transition-colors"
                          >
                            {order.jobId}
                          </Link>
                          {order.isUrgent && (
                            <span className="erp-urgent-tag block mt-1 w-fit">
                              งานด่วน
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <div className="text-[12px] font-bold text-slate-800">
                            {order.customerName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {order.customerFb || "-"}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-top max-w-[280px]">
                          <p className="text-[11px] text-slate-600 leading-relaxed truncate hover:whitespace-normal">
                            {order.customerAddress || (
                              <span className="text-rose-400 italic">
                                ไม่ระบุที่อยู่
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-3 py-2.5 align-top">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">
                                {order.displayStatusLabel ||
                                  (order.status === "READY_TO_SHIP"
                                    ? "พร้อมจัดส่ง"
                                    : "รอจัดส่ง")}
                              </span>
                              {order.paymentMethod === "COD" && (
                                <span className="erp-status-badge bg-indigo-100 text-indigo-700 border-indigo-200">
                                  COD
                                </span>
                              )}
                            </div>

                            {parseFloat(order.balanceDue || 0) > 0 &&
                            order.paymentMethod !== "COD" ? (
                              <div className="flex flex-col gap-0.5">
                                {order.subStatusLabel && (
                                  <span className="text-[10px] font-black text-orange-600 animate-pulse">
                                    {order.subStatusLabel}
                                  </span>
                                )}
                                <span className="text-[10px] font-black text-rose-600">
                                  ยังชำระเงินไม่ครบ
                                </span>
                                <span className="text-[10px] text-slate-400 font-bold">
                                  ค้างชำระ: {order.balanceDue?.toLocaleString()}
                                  ฿
                                </span>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-0.5">
                                {order.subStatusLabel && (
                                  <span className="text-[10px] font-black text-orange-600 animate-pulse">
                                    {order.subStatusLabel}
                                  </span>
                                )}
                                <span className="text-[10px] text-emerald-600 font-bold">
                                  {order.paymentMethod === "COD" &&
                                  parseFloat(order.balanceDue || 0) > 0
                                    ? `ยอดเก็บเงินปลายทาง: ${order.balanceDue?.toLocaleString()}฿`
                                    : "ชำระเงินเรียบร้อยแล้ว"}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2.5 align-top text-right">
                          {activeTab === "shipped" ? (
                            <div className="inline-block bg-slate-100 px-2.5 py-1 rounded-md text-slate-700 font-mono text-[11px] font-bold border border-slate-200">
                              {order.trackingNo || "-"}
                            </div>
                          ) : activeTab === "pending_payment" ? (
                            <Link
                              to={`/delivery/order/${order.id}`}
                              className="erp-action-btn bg-white !text-indigo-600 border border-indigo-200 hover:!bg-indigo-600 hover:!text-white"
                            >
                              <HiOutlineClipboardDocumentList className="w-3.5 h-3.5" />
                              ดูรายละเอียด
                            </Link>
                          ) : (
                            <Link
                              to={`/delivery/order/${order.id}`}
                              className="erp-action-btn"
                            >
                              <HiOutlineClipboardDocumentList className="w-3.5 h-3.5" />
                              ดำเนินการจัดส่ง
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden grid grid-cols-1 gap-2.5">
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className={`erp-mobile-card ${
                    order.isUrgent ? "erp-mobile-card-urgent" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
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
                        <span className="erp-status-badge bg-indigo-50 text-indigo-700 border-indigo-100 flex-shrink-0 text-center">
                          {order.displayStatusLabel ||
                            (order.status === "QC_PASSED" ||
                            order.status === "READY_TO_SHIP"
                              ? "พร้อมจัดส่ง"
                              : "รอจัดส่ง")}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        {order.isUrgent && (
                          <span className="erp-urgent-tag">งานด่วน</span>
                        )}
                        {order.paymentMethod === "COD" && (
                          <span className="erp-status-badge bg-indigo-100 text-indigo-700 border-indigo-200">
                            COD
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-2">
                      {order.customerAddress || (
                        <span className="text-rose-400 italic">
                          ไม่ระบุที่อยู่
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex justify-between items-end pt-2 border-t border-slate-100">
                    <div className="flex flex-col gap-0.5">
                      {parseFloat(order.balanceDue || 0) > 0 &&
                      order.paymentMethod !== "COD" ? (
                        <>
                          {order.subStatusLabel && (
                            <span className="text-[10px] font-black text-orange-600 animate-pulse">
                              {order.subStatusLabel}
                            </span>
                          )}
                          <span className="text-[10px] font-black text-rose-600">
                            ยังชำระเงินไม่ครบ
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">
                            ค้างชำระ: {order.balanceDue?.toLocaleString()}฿
                          </span>
                        </>
                      ) : (
                        <>
                          {order.subStatusLabel && (
                            <span className="text-[10px] font-black text-orange-600 animate-pulse">
                              {order.subStatusLabel}
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
                        <div className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-700 font-mono text-[10px] font-bold border border-slate-200">
                          {order.trackingNo || "-"}
                        </div>
                      ) : (
                        <Link
                          to={`/delivery/order/${order.id}`}
                          className="erp-action-btn"
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
