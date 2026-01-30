import React from "react";
import { HiOutlineUser } from "react-icons/hi2";

const CustomerSection = ({ customer, setCustomer }) => {
  return (
    <div className="erp-card shadow-sm">
      <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex items-center gap-2">
        <HiOutlineUser className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-800 text-sm">ข้อมูลลูกค้า</h3>
      </div>
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="erp-label">ชื่อลูกค้า *</label>
          <input
            required
            value={customer.name}
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })}
            className="erp-input px-3 py-2 text-sm"
            placeholder="ชื่อ-นามสกุล..."
          />
        </div>
        <div className="space-y-1">
          <label className="erp-label">เบอร์โทรศัพท์</label>
          <input
            value={customer.phone}
            onChange={(e) =>
              setCustomer({ ...customer, phone: e.target.value })
            }
            className="erp-input px-3 py-2 text-sm"
            placeholder="0XX-XXX-XXXX"
          />
        </div>
        <div className="space-y-1">
          <label className="erp-label">ชื่อ Facebook / LINE</label>
          <input
            value={customer.customerFb}
            onChange={(e) =>
              setCustomer({ ...customer, customerFb: e.target.value })
            }
            className="erp-input px-3 py-2 text-sm"
            placeholder="ใส่ชื่อ Facebook..."
          />
        </div>
        <div className="space-y-1">
          <label className="erp-label">ที่อยู่จัดส่ง</label>
          <input
            value={customer.address}
            onChange={(e) =>
              setCustomer({ ...customer, address: e.target.value })
            }
            className="erp-input px-3 py-2 text-sm"
            placeholder="ระบุที่อยู่จัดส่ง..."
          />
        </div>
      </div>
    </div>
  );
};

export default CustomerSection;
