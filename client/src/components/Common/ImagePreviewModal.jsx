import { useEffect } from "react";
import { HiOutlineXMark, HiOutlineCloudArrowDown } from "react-icons/hi2";

const ImagePreviewModal = ({
  isOpen,
  onClose,
  imageUrl,
  altText = "Image Preview",
}) => {
  // Handle Escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      // Prevent body scrolling
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Container needs to handle max dimensions to fit any screen */}
      <div
        className="relative max-w-[95vw] max-h-[95vh] w-full h-full flex flex-col items-center justify-center p-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent close when clicking inside
      >
        {/* Top actions bar */}
        <div className="absolute top-4 right-4 flex items-center gap-3 z-10">
          <a
            href={imageUrl}
            download
            target="_blank"
            rel="noreferrer"
            className="p-3 bg-slate-800/60 hover:bg-slate-700 text-white rounded-full backdrop-blur-md transition-all shadow-lg group flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
            title="Download / Open Original"
          >
            <span className="text-xs font-bold uppercase tracking-widest hidden group-hover:block pl-2">
              เปิดต้นฉบับ
            </span>
            <HiOutlineCloudArrowDown className="w-6 h-6" />
          </a>
          <button
            onClick={onClose}
            className="p-3 bg-slate-800/60 hover:bg-rose-500 text-white rounded-full backdrop-blur-md transition-all shadow-lg"
            title="Close (Esc)"
          >
            <HiOutlineXMark className="w-6 h-6" />
          </button>
        </div>

        {/* The Image */}
        <img
          src={imageUrl}
          alt={altText}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl ring-1 ring-white/10 select-none bg-slate-900/50"
        />

        {/* Optional caption */}
        <div className="absolute bottom-6 bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl opacity-0 hover:opacity-100 transition-opacity flex items-center gap-2 max-w-[80%]">
          <span className="text-[10px] text-slate-300 font-mono truncate">
            {imageUrl.split("/").pop()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
