import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../../api/config";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { useMaster } from "../../context/MasterContext";

const REFRESH_MS = 15000;

export default function ProductionTVDashboard() {
  const { getStatusLabel } = useMaster();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchQueue = useCallback(async () => {
    try {
      const res = await api.get("/orders/production-queue");
      setOrders(res.data?.data?.orders || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch production queue:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    const timer = setInterval(fetchQueue, REFRESH_MS);
    return () => clearInterval(timer);
  }, [fetchQueue]);

  const grouped = useMemo(() => {
    const now = [];
    const waiting = [];
    const done = [];

    for (const order of orders) {
      if (order.status === "IN_PRODUCTION") now.push(order);
      else if (order.status === "PRODUCTION_FINISHED") done.push(order);
      else waiting.push(order);
    }

    return { now, waiting, done };
  }, [orders]);

  return (
    <div className="min-h-screen bg-slate-900 text-white px-6 py-6">
      <div className="max-w-[1800px] mx-auto">
        <header className="flex items-end justify-between mb-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight">
              Production Queue
            </h1>
            <p className="text-slate-300 text-sm mt-1">
              Auto sorted by priority: urgent first, then first-in-first-out.
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold">
              Last update
            </p>
            <p className="text-lg font-black text-emerald-300">
              {lastUpdated ? lastUpdated.toLocaleTimeString() : "-"}
            </p>
          </div>
        </header>

        {loading && (
          <div className="h-64 rounded-3xl border border-slate-700 bg-slate-800 animate-pulse" />
        )}

        {!loading && orders.length === 0 && (
          <div className="h-64 rounded-3xl border border-dashed border-slate-600 bg-slate-800/40 flex items-center justify-center">
            <p className="text-slate-300 font-bold">
              No queue items at the moment.
            </p>
          </div>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-8">
            <section>
              <h2 className="text-xl font-black text-amber-300 mb-3">
                In Progress ({grouped.now.length})
              </h2>
              <QueueGrid orders={grouped.now} getStatusLabel={getStatusLabel} />
            </section>

            <section>
              <h2 className="text-xl font-black text-indigo-300 mb-3">
                Next Up ({grouped.waiting.length})
              </h2>
              <QueueGrid
                orders={grouped.waiting}
                getStatusLabel={getStatusLabel}
              />
            </section>

            <section>
              <h2 className="text-xl font-black text-emerald-300 mb-3">
                Waiting QC ({grouped.done.length})
              </h2>
              <QueueGrid
                orders={grouped.done}
                getStatusLabel={getStatusLabel}
                compact
              />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function QueueGrid({ orders, getStatusLabel, compact = false }) {
  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-slate-700 bg-slate-800/50 py-8 px-6 text-slate-400 font-bold">
        No items
      </div>
    );
  }

  return (
    <div
      className={`grid gap-4 ${compact ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"}`}
    >
      {orders.map((order) => (
        <article
          key={order.id}
          className={`rounded-2xl border p-4 ${order.isUrgent ? "border-rose-400 bg-rose-900/20" : "border-slate-700 bg-slate-800/70"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-slate-300 font-bold">Queue</p>
              <p className="text-3xl font-black text-white">
                #{order.queueNo || "-"}
              </p>
            </div>
            {order.isUrgent && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500 text-white text-xs font-black uppercase">
                <HiOutlineExclamationTriangle className="w-4 h-4" />
                Urgent
              </span>
            )}
          </div>

          <div className="mt-4 space-y-1">
            <p className="text-2xl font-black text-amber-200">{order.jobId}</p>
            <p className="text-lg font-bold text-white truncate">
              {order.customerName}
            </p>
            <p className="text-sm text-slate-300">
              {getStatusLabel(order.status)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}
