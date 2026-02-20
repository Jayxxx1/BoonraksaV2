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
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">
          ภาพรวมการเงิน (Finance Overview)
        </h1>

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

      {loading && data.unmatched.length === 0 ? (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <HiOutlineArrowTrendingUp className="w-12 h-12 text-indigo-600 mb-6" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                ยอดจองรวม (ออเดอร์ทั้งหมด)
              </p>
              <h3 className="text-5xl font-black text-slate-800">
                {data.booking.toLocaleString()} ฿
              </h3>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-50 flex justify-between items-center text-slate-400 font-bold">
              <span>ยอดที่เก็บเงินได้แล้ว (Realized Collection)</span>
              <span className="text-emerald-500">
                {data.realized.toLocaleString()} ฿
              </span>
            </div>
          </div>

          <div className="bg-slate-900 p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between text-white">
            <div>
              <HiOutlineBanknotes className="w-12 h-12 text-emerald-400 mb-6" />
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                ยอดค้างชำระทั้งหมด (Uncollected)
              </p>
              <h3 className="text-5xl font-black">
                {(data.booking - data.realized).toLocaleString()} ฿
              </h3>
            </div>
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="flex gap-2">
                <div
                  className="h-2 flex-1 bg-emerald-500 rounded-full"
                  style={{ width: `${(data.realized / data.booking) * 100}%` }}
                ></div>
                <div className="h-2 w-20 bg-white/10 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <HiOutlineShieldExclamation className="w-8 h-8 text-rose-500" />
          <h2 className="text-2xl font-black text-slate-800">
            ออเดอร์ที่ส่งของแล้วแต่ยังชำระไม่ครบ
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                <td className="py-4">รหัสงาน (Job ID)</td>
                <td className="py-4">ชื่อลูกค้า</td>
                <td className="py-4">รวม</td>
                <td className="py-4">ชำระแล้ว</td>
                <td className="py-4 text-rose-500">ค้างชำระ</td>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {data.unmatched.map((o) => (
                <tr key={o.id} className="text-slate-700 font-bold">
                  <td className="py-4">{o.jobId}</td>
                  <td className="py-4">{o.customerName}</td>
                  <td className="py-4 font-black">{o.totalPrice} ฿</td>
                  <td className="py-4 text-emerald-500">{o.paidAmount} ฿</td>
                  <td className="py-4 text-rose-600 font-black">
                    {o.balanceDue} ฿
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
