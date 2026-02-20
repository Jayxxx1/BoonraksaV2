import React, { useState, useEffect, useCallback } from "react";
import {
  HiOutlineBell,
  HiOutlineCheckCircle,
  HiOutlineClock,
} from "react-icons/hi2";
import { Link } from "react-router-dom";
import api from "../api/config";

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      const list = res.data.data.notifications;
      setNotifications(list);
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    }
  }, []);

  useEffect(() => {
    // Perform initial fetch
    const initFetch = async () => {
      await fetchNotifications();
    };
    initFetch();

    const interval = setInterval(fetchNotifications, 60000); // Poll every minute
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      fetchNotifications();
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all relative"
      >
        <HiOutlineBell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[70]"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-[80] overflow-hidden animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-sm">การแจ้งเตือน</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-tight"
                >
                  อ่านทั้งหมด
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <HiOutlineClock className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-xs text-slate-400 font-medium">
                    ไม่มีการแจ้งเตือนใหม่
                  </p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 border-b border-slate-50 transition-colors hover:bg-slate-50 cursor-pointer relative ${!n.isRead ? "bg-indigo-50/30" : ""}`}
                    onClick={() => {
                      if (!n.isRead) markAsRead(n.id);
                      setIsOpen(false);
                    }}
                  >
                    {!n.isRead && (
                      <div className="absolute top-4 right-4 w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                    )}
                    <div className="flex gap-3">
                      <div
                        className={`mt-1 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${n.type === "PAYMENT_REMINDER" ? "bg-amber-100 text-amber-600" : "bg-indigo-100 text-indigo-600"}`}
                      >
                        {n.type === "PAYMENT_REMINDER" ? (
                          <HiOutlineBell className="w-4 h-4" />
                        ) : (
                          <HiOutlineCheckCircle className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-xs leading-relaxed ${!n.isRead ? "text-slate-900 font-bold" : "text-slate-600 font-medium"}`}
                        >
                          {n.message}
                        </p>
                        {n.orderId && (
                          <Link
                            to={`/orders/${n.orderId}`}
                            className="text-[10px] font-bold text-indigo-600 mt-2 inline-block hover:underline"
                          >
                            ดูรายละเอียดออเดอร์ →
                          </Link>
                        )}
                        <p className="text-[9px] text-slate-400 mt-1 font-bold">
                          {new Date(n.createdAt).toLocaleString("th-TH")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 bg-slate-50 border-t border-slate-100 text-center">
              <span className="text-[10px] font-bold text-slate-400 italic">
                แสดง 50 รายการล่าสุด
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
