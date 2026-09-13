import React from 'react';
import { AlertCircle, Clock, CheckCircle2, HelpCircle } from 'lucide-react';

const StatusBadge = ({
  id,
  status = 'new',
  size = 'md',
  showIcon = true,
  className = '',
}) => {
  const normalizedStatus = String(status || '').toLowerCase().trim();

  const configs = {
    new: {
      label: 'Baru',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      icon: AlertCircle,
    },
    baru: {
      label: 'Baru',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      icon: AlertCircle,
    },
    processing: {
      label: 'Diproses',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      icon: Clock,
    },
    diproses: {
      label: 'Diproses',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      icon: Clock,
    },
    in_progress: {
      label: 'Diproses',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      icon: Clock,
    },
    done: {
      label: 'Selesai',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    selesai: {
      label: 'Selesai',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    resolved: {
      label: 'Selesai',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    },
    rejected: {
      label: 'Ditolak',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
      icon: AlertCircle,
    },
    ditolak: {
      label: 'Ditolak',
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
      icon: AlertCircle,
    },
  };

  const config = configs[normalizedStatus] || {
    label: status,
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: HelpCircle,
  };

  const Icon = config.icon;

  const sizes = {
    sm: 'px-2 py-0.5 text-xs gap-1',
    md: 'px-2.5 py-1 text-xs font-medium gap-1.5',
    lg: 'px-3 py-1.5 text-sm font-medium gap-2',
  };

  const selectedSize = sizes[size] || sizes.md;

  return (
    <span
      id={id}
      className={`inline-flex items-center whitespace-nowrap rounded-full border ${config.bg} ${config.text} ${config.border} ${selectedSize} ${className}`}
    >
      {showIcon && Icon ? (
        <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      )}
      <span>{config.label}</span>
    </span>
  );
};

export default StatusBadge;
