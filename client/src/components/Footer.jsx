export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-4 mt-12 text-slate-500">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-2">
        <p className="text-xs">
          © {new Date().getFullYear()} ระบบบุญรักษา (Boonraksa System).
          สงวนลิขสิทธิ์.
        </p>
        <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
          <span className="text-slate-300">|</span>
          <span>ตรวจสอบความปลอดภัยแล้ว (Security Verified)</span>
          <span className="text-slate-300">|</span>
          <span>เวอร์ชัน (Version) 2.1.0</span>
        </div>
      </div>
    </footer>
  );
}
