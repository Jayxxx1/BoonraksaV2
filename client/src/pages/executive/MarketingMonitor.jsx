import { useState, useEffect } from "react";
import api from "../../api/config";
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
        const res = await api.get("/orders", {
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
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-5 animate-erp-in">
        {/* ── Page Header ── */}
        <div className="erp-page-header mb-6">
          <div className="space-y-0.5">
            <h1 className="erp-page-title">
              <div className="erp-title-accent"></div>
              วิเคราะห์การตลาด (Marketing Analytics)
            </h1>
            <p className="erp-page-subtitle">
              ยอดขายแยกตามช่องทางขายและผลงานรายบุคคล
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

        {loading && Object.keys(stats.byPage).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="erp-spinner"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Sales by Page */}
            <div className="erp-section">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                  <HiOutlineCursorArrowRays className="w-4 h-4" />
                </div>
                <h2 className="text-[13px] font-black text-slate-800">
                  ยอดขายแยกตามช่องทางขาย (Facebook Page)
                </h2>
              </div>
              <div className="space-y-4">
                {Object.entries(stats.byPage).map(([page, val]) => (
                  <div key={page} className="space-y-1.5">
                    <div className="flex justify-between text-[12px] font-black text-slate-700">
                      <span>{page}</span>
                      <span>{val.toLocaleString()} ฿</span>
                    </div>
                    <div className="h-2.5 bg-slate-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-blue-400 rounded-full transition-all duration-700"
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
            <div className="erp-section">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-1.5 bg-emerald-500 text-white rounded-lg">
                  <HiOutlineUsers className="w-4 h-4" />
                </div>
                <h2 className="text-[13px] font-black text-slate-800">
                  ผลงานยอดขายรายบุคคล (Sales Performance)
                </h2>
              </div>
              <div className="space-y-3.5">
                {Object.entries(stats.bySales).map(([s, val]) => (
                  <div key={s} className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center text-[11px] font-black text-slate-400">
                      {s[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-[12px] font-black text-slate-700 mb-1">
                        <span>{s}</span>
                        <span>{val.toLocaleString()} ฿</span>
                      </div>
                      <div className="h-1.5 bg-slate-50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-700"
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
    </div>
  );
}
