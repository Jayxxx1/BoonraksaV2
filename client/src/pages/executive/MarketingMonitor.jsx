import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineChartBar,
  HiOutlineCursorArrowRays,
  HiOutlineUsers,
  HiOutlineMagnifyingGlass,
} from "react-icons/hi2";

export default function MarketingMonitor() {
  const { token } = useAuth();
  const [stats, setStats] = useState({ byPage: {}, bySales: {} });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:8000/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
          params: { search },
        });
        const orders = res.data.data.orders;

        const byPage = {};
        const bySales = {};

        orders.forEach((o) => {
          const page = o.salesChannel?.name || "ไม่ระบุช่องทาง";
          const salesUser = o.sales?.name || "ไม่ระบุผู้ขาย";

          byPage[page] = (byPage[page] || 0) + parseFloat(o.totalPrice);
          bySales[salesUser] =
            (bySales[salesUser] || 0) + parseFloat(o.totalPrice);
        });

        setStats({ byPage, bySales });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    const timer = setTimeout(() => {
      fetchStats();
    }, 400);
    return () => clearTimeout(timer);
  }, [token, search]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">
          วิเคราะห์การตลาด (Marketing Analytics)
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

      {loading && Object.keys(stats.byPage).length === 0 ? (
        <div className="flex items-center justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Sales by Page */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                <HiOutlineCursorArrowRays className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">
                ยอดขายแยกตามช่องทางขาย (Facebook Page)
              </h2>
            </div>
            <div className="space-y-6">
              {Object.entries(stats.byPage).map(([page, val]) => (
                <div key={page} className="space-y-2">
                  <div className="flex justify-between text-sm font-black text-slate-700">
                    <span>{page}</span>
                    <span>{val.toLocaleString()} ฿</span>
                  </div>
                  <div className="h-4 bg-slate-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-blue-400"
                      style={{
                        width: `${Math.min(100, (val / 50000) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales by Person */}
          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <div className="flex items-center gap-4 mb-10">
              <div className="p-3 bg-emerald-500 text-white rounded-2xl">
                <HiOutlineUsers className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">
                ผลงานยอดขายรายบุคคล (Sales Performance)
              </h2>
            </div>
            <div className="space-y-6">
              {Object.entries(stats.bySales).map(([s, val]) => (
                <div key={s} className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400">
                    {s[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-black text-slate-700 mb-1">
                      <span>{s}</span>
                      <span>{val.toLocaleString()} ฿</span>
                    </div>
                    <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500"
                        style={{
                          width: `${Math.min(100, (val / 100000) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
