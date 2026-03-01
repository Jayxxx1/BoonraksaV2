import { useState, useEffect } from "react";
import api from "../../api/config";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineBanknotes,
  HiOutlineArrowTrendingUp,
  HiOutlineShieldExclamation,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";

export default function FinanceMonitor() {
  const { token } = useAuth();
  const [data, setData] = useState({ booking: 0, realized: 0, unmatched: [] });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        setLoading(true);
        const res = await api.get("/orders", {
          headers: { Authorization: `Bearer ${token}` },
          params: { search },
        });
        const orders = res.data.data.orders;

        const booking = orders.reduce(
          (sum, o) => sum + parseFloat(o.totalPrice),
          0,
        );
        const realized = orders.reduce(
          (sum, o) => sum + parseFloat(o.paidAmount),
          0,
        );
        const unmatched = orders.filter(
          (o) => o.status === "COMPLETED" && o.balanceDue > 0,
        );

        setData({ booking, realized, unmatched });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(() => {
      fetchFinance();
    }, 400);
    return () => clearTimeout(timer);
  }, [token, search]);

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in">
        {/* ── Page Header ── */}
        <div className="erp-page-header mb-6">
          <div className="space-y-0.5">
            <h1 className="erp-page-title">
              <div className="erp-title-accent"></div>
              ภาพรวมการเงิน (Finance Overview)
            </h1>
            <p className="erp-page-subtitle">
              ตรวจสอบยอดจอง ยอดเก็บเงินจริง และออเดอร์ค้างชำระ
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

        {loading && data.unmatched.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="erp-spinner"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="erp-section flex flex-col justify-between">
              <div>
                <HiOutlineArrowTrendingUp className="w-8 h-8 text-indigo-600 mb-4" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  ยอดจองรวม (ออเดอร์ทั้งหมด)
                </p>
                <h3 className="text-3xl font-black text-slate-800 mt-1">
                  {data.booking.toLocaleString()} ฿
                </h3>
              </div>
              <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-bold">
                <span>ยอดที่เก็บเงินได้แล้ว (Realized)</span>
                <span className="text-emerald-500 font-black">
                  {data.realized.toLocaleString()} ฿
                </span>
              </div>
            </div>

            <div className="erp-section !bg-slate-900 !border-slate-800 text-white flex flex-col justify-between">
              <div>
                <HiOutlineBanknotes className="w-8 h-8 text-emerald-400 mb-4" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  ยอดค้างชำระทั้งหมด (Uncollected)
                </p>
                <h3 className="text-3xl font-black mt-1">
                  {(data.booking - data.realized).toLocaleString()} ฿
                </h3>
              </div>
              <div className="mt-5 pt-4 border-t border-white/10">
                <div className="flex gap-1.5">
                  <div
                    className="h-2 bg-emerald-500 rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, (data.realized / data.booking) * 100)}%`,
                    }}
                  ></div>
                  <div className="h-2 flex-1 bg-white/10 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Unmatched Orders Table ── */}
        <div className="erp-table-container">
          <div className="flex items-center gap-2.5 p-3 border-b border-slate-100">
            <HiOutlineShieldExclamation className="w-5 h-5 text-rose-500" />
            <h2 className="text-[13px] font-black text-slate-800">
              ออเดอร์ที่ส่งของแล้วแต่ยังชำระไม่ครบ
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>รหัสงาน</th>
                  <th>ชื่อลูกค้า</th>
                  <th>ยอดรวม</th>
                  <th>ชำระแล้ว</th>
                  <th className="text-rose-500">ค้างชำระ</th>
                </tr>
              </thead>
              <tbody>
                {data.unmatched.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-3 py-8 text-center text-slate-400 text-[12px] font-bold"
                    >
                      ไม่มีออเดอร์ค้างชำระ
                    </td>
                  </tr>
                ) : (
                  data.unmatched.map((o) => (
                    <tr key={o.id} className="text-slate-700">
                      <td className="px-3 py-2.5 text-[12px] font-black">
                        {o.jobId}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] font-bold">
                        {o.customerName}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] font-black">
                        {o.totalPrice} ฿
                      </td>
                      <td className="px-3 py-2.5 text-[12px] font-bold text-emerald-500">
                        {o.paidAmount} ฿
                      </td>
                      <td className="px-3 py-2.5 text-[12px] font-black text-rose-600">
                        {o.balanceDue} ฿
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
