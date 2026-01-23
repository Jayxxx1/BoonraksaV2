import { Link } from "react-router-dom";
import {
  HiOutlineCube,
  HiOutlineRectangleGroup,
  HiOutlineQueueList,
  HiOutlineUserCircle,
} from "react-icons/hi2";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-pastel-indigo/30 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-gradient-to-br from-pastel-blue to-pastel-pink rounded-xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
              <HiOutlineCube className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-800">
              Boon<span className="text-pastel-blue">raksa</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
            >
              <HiOutlineRectangleGroup className="w-5 h-5" />
              แดชบอร์ด
            </Link>
            <Link
              to="/products"
              className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-2"
            >
              <HiOutlineQueueList className="w-5 h-5" />
              สินค้า
            </Link>
          </div>

          {/* User Profile / Actions */}
          <div className="flex items-center gap-4">
            <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
              <HiOutlineUserCircle className="w-8 h-8" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
