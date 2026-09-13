import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  id = 'empty-state',
  title = 'Tidak ada data ditemukan',
  description = 'Belum ada data yang tersedia untuk ditampilkan saat ini.',
  icon: Icon = Inbox,
  actionLabel,
  onAction,
  actionVariant = 'primary',
  className = '',
}) => {
  return (
    <div
      id={id}
      className={`flex flex-col items-center justify-center p-8 sm:p-10 text-center rounded-2xl border border-dashed border-[#343844] bg-[#191c1e] text-[#e4e1e6] ${className}`}
    >
      <div className="p-3.5 bg-[#252a35] rounded-full text-[#8ca0eb] mb-3.5 border border-[#354477]/40 shadow-sm">
        <Icon className="w-7 h-7 stroke-[1.5]" />
      </div>
      <h4 className="text-base font-semibold text-white mb-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
        {title}
      </h4>
      <p className="text-xs sm:text-sm text-[#94a3b8] max-w-sm mb-4 leading-relaxed font-['Poppins',sans-serif]">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button
          id={`${id}-action-btn`}
          variant={actionVariant}
          size="sm"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
