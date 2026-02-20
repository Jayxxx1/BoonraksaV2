import { useState, useEffect } from "react";
import api from "../../api/config";
import { useAuth } from "../../context/auth-store";
import {
  HiOutlineChartBar,
  HiOutlineExclamationTriangle,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineUserGroup,
  HiOutlineClock,
} from "react-icons/hi2";

export default function ExecutiveKPIDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        setLoading(true);
        const res = await api.get("/dashboard/executive-kpi", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setKpis(res.data);
      } catch (err) {
        console.error("Failed to fetch KPIs:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchKPIs();
  }, [token]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="mt-4 text-slate-500 font-bold animate-pulse">
          กำลังดึงข้อมูลวิเคราห์ระดับผู้บริหาร...
        </p>
      </div>
    );
  }

  if (!kpis) return <div className="p-10 text-center">No data available</div>;

  const { slaHealth, rejectionTrends, productionWaste } = kpis;
  const totalOrdersSLA = slaHealth.GREEN + slaHealth.YELLOW + slaHealth.RED;
  const salesErrorRate = (
    (rejectionTrends.salesErrorCount / rejectionTrends.total) * 100 || 0
  ).toFixed(1);
  const wasteRate = (
    productionWaste.totalDamaged / productionWaste.totalOrders || 0
  ).toFixed(2);

  return (
    <div className="p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            Executive Dashboard
          </h1>
          <p className="text-slate-500 font-bold mt-1 uppercase tracking-widest text-xs">
            รายงานวิเคราะห์ข้อมูลและดัชนีชี้วัดหลัก (KPIs) ย้อนหลัง 30 วัน
          </p>
        </div>
        <div className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-2xl text-[10px] font-black text-indigo-600 uppercase">
          Real-time System Audit
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. SLA Health Card */}
        <div className="erp-card bg-white p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-indigo-50">
                <HiOutlineClock className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="font-black text-slate-800 tracking-tight">
                SLA Health Status
              </h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-black uppercase">
                <span className="text-emerald-500">Green (On Time)</span>
                <span>
                  {((slaHealth.GREEN / totalOrdersSLA) * 100 || 0).toFixed(0)}%
                </span>
              </div>
              <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="bg-emerald-500 h-full"
                  style={{
                    width: `${(slaHealth.GREEN / totalOrdersSLA) * 100}%`,
                  }}
                />
                <div
                  className="bg-amber-400 h-full"
                  style={{
                    width: `${(slaHealth.YELLOW / totalOrdersSLA) * 100}%`,
                  }}
                />
                <div
                  className="bg-rose-500 h-full"
                  style={{
                    width: `${(slaHealth.RED / totalOrdersSLA) * 100}%`,
                  }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="text-center">
                  <div className="text-lg font-black text-emerald-600">
                    {slaHealth.GREEN}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">
                    Normal
                  </div>
                </div>
                <div className="text-center border-x border-slate-100">
                  <div className="text-lg font-black text-amber-500">
                    {slaHealth.YELLOW}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">
                    Near Due
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-black text-rose-500">
                    {slaHealth.RED}
                  </div>
                  <div className="text-[9px] font-bold text-slate-400 uppercase">
                    Overdue
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Rejection & Sales Error Card */}
        <div className="erp-card bg-slate-900 p-6 shadow-2xl text-white relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-rose-500/20">
                <HiOutlineExclamationTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="font-black tracking-tight">Rejection Trend</h3>
            </div>

            <div className="flex items-end justify-between mb-4">
              <div>
                <div className="text-4xl font-black text-white">
                  {rejectionTrends.total}
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Total Rejections
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-rose-400">
                  {salesErrorRate}%
                </div>
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Sales Error Rate
                </div>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">
                Top Root Causes
              </p>
              <div className="space-y-2">
                {rejectionTrends.topReasons.length > 0 ? (
                  rejectionTrends.topReasons.map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between group/item"
                    >
                      <span className="text-xs font-bold text-slate-300 truncate pr-4">
                        {r.reason}
                      </span>
                      <span className="text-xs font-black text-white bg-white/10 px-2 py-0.5 rounded-lg group-hover/item:bg-rose-500 transition-colors">
                        {r.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-600 italic">
                    No rejections found
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Production Waste Card */}
        <div className="erp-card bg-white p-6 shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50/50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-amber-50">
                <HiOutlineTrash className="w-6 h-6 text-amber-500" />
              </div>
              <h3 className="font-black text-slate-800 tracking-tight">
                Production Waste
              </h3>
            </div>

            <div className="flex items-center gap-6 mb-8">
              <div className="flex-1 text-center py-4 bg-slate-50 rounded-3xl border border-slate-100">
                <div className="text-3xl font-black text-slate-800">
                  {productionWaste.totalDamaged}
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Damaged Items
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-amber-500">
                  {wasteRate}
                </div>
                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Items / Order
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HiOutlineChartBar className="w-5 h-5 text-indigo-600" />
                <span className="text-xs font-black text-slate-700">
                  Audit Volume
                </span>
              </div>
              <span className="text-xs font-black text-indigo-600">
                {productionWaste.totalOrders} Orders
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Section (Placeholder for future charts) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <HiOutlineUserGroup className="w-6 h-6 text-indigo-600" />
            <h3 className="text-xl font-black text-slate-900 tracking-tight">
              Sales Accountability
            </h3>
          </div>
          <p className="text-sm text-slate-500 mb-6">
            มีการตีกลับงานเนื่องจากข้อมูลฝ่ายขายไม่ครบถ้วนทั้งหมด{" "}
            <b>{rejectionTrends.salesErrorCount}</b> รายการ
            จากการปฏิเสธงานทั้งหมด <b>{rejectionTrends.total}</b> ครั้ง
          </p>
          <div className="flex items-center justify-center p-12 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
            <div className="text-center">
              <div className="text-5xl font-black text-slate-300 mb-2">
                {salesErrorRate}%
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Sales Error Ratio
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <HiOutlineCheckCircle className="w-6 h-6 text-emerald-500" />
              <h3 className="text-xl font-black text-slate-900 tracking-tight">
                Delivery Efficiency
              </h3>
            </div>
            <p className="text-sm text-slate-500">
              ออเดอร์ส่วนใหญ่{" "}
              <b>
                {((slaHealth.GREEN / totalOrdersSLA) * 100 || 0).toFixed(0)}%
              </b>{" "}
              ยังคงอยู่ในเกณฑ์เวลาที่กำหนด
            </p>
          </div>
          <div className="mt-8">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-slate-500 uppercase tracking-widest">
                On-Time Success Rate
              </span>
              <span className="text-indigo-600 font-black">
                {((slaHealth.GREEN / totalOrdersSLA) * 100 || 0).toFixed(1)}%
              </span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-1000"
                style={{
                  width: `${(slaHealth.GREEN / totalOrdersSLA) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
