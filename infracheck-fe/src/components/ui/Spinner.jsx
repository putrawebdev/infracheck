import React from 'react';

const Spinner = ({
  id = 'spinner-loading',
  size = 'md',
  color = 'blue',
  className = '',
}) => {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
    xl: 'w-12 h-12 border-4',
  };

  const colors = {
    blue: 'border-blue-600 border-t-transparent',
    white: 'border-white border-t-transparent',
    slate: 'border-slate-600 border-t-transparent',
    red: 'border-red-600 border-t-transparent',
    emerald: 'border-emerald-600 border-t-transparent',
  };

  const selectedSize = sizes[size] || sizes.md;
  const selectedColor = colors[color] || colors.blue;

  return (
    <div
      id={id}
      className={`inline-block animate-spin rounded-full ${selectedSize} ${selectedColor} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};

export default Spinner;
