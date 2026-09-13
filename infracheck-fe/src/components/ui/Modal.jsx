import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  id = 'modal-container',
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-lg',
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      id={id}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div
        id={`${id}-backdrop`}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div
        id={`${id}-dialog`}
        className={`relative z-10 w-full ${maxWidth} bg-[#191C1E] text-[#e4e1e6] rounded-2xl sm:rounded-3xl shadow-2xl border border-[#343844] overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-150`}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#343844] bg-[#22272e]/80">
            <h3 id={`${id}-title`} className="text-base sm:text-lg font-bold text-[#e4e1e6] tracking-tight">
              {title}
            </h3>
            <button
              id={`${id}-close-button`}
              type="button"
              onClick={onClose}
              className="text-[#c4c7c5] hover:text-white p-1.5 rounded-full hover:bg-[#343844] transition-colors cursor-pointer"
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6 text-[#e4e1e6]">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#343844] bg-[#22272e]/80">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
