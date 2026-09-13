import React from 'react';
import Spinner from './Spinner';

const Button = ({
  id,
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs';

  const variants = {
    primary: 'bg-[#8ca0eb] text-[#002b75] font-semibold hover:bg-[#a3b5fa] focus:ring-[#8ca0eb]/30 border border-transparent rounded-full shadow-sm',
    secondary: 'bg-[#2e333d] text-[#e4e1e6] hover:bg-[#39404d] focus:ring-[#8ca0eb]/30 border border-[#444652] rounded-full',
    outline: 'bg-transparent text-[#e4e1e6] hover:bg-[#252a35] focus:ring-[#8ca0eb]/30 border border-[#444652] rounded-full',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 border border-transparent rounded-full shadow-sm',
    ghost: 'bg-transparent text-[#c5c5d4] hover:bg-[#252a35] hover:text-white focus:ring-[#8ca0eb]/30 shadow-none rounded-full',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 border border-transparent rounded-full shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  const selectedVariant = variants[variant] || variants.primary;
  const selectedSize = sizes[size] || sizes.md;

  return (
    <button
      id={id}
      type={type}
      className={`${baseStyles} ${selectedVariant} ${selectedSize} ${className}`}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <Spinner size={size === 'sm' ? 'sm' : 'sm'} color={variant === 'outline' || variant === 'secondary' || variant === 'ghost' ? 'slate' : 'white'} />
      ) : (
        Icon && <Icon className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      )}
      <span>{children}</span>
    </button>
  );
};

export default Button;
