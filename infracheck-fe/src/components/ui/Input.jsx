import React, { forwardRef } from 'react';

const Input = forwardRef(({
  id,
  label,
  name,
  type = 'text',
  placeholder = '',
  value,
  defaultValue,
  onChange,
  error,
  helperText,
  icon: Icon,
  required = false,
  disabled = false,
  className = '',
  autoComplete,
  ...props
}, ref) => {
  const inputId = id || name || `input-${Math.random().toString(36).substring(2, 9)}`;

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-[#c5c5d4] tracking-wide"
        >
          {label}
          {required && <span className="text-rose-400 ml-0.5">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3 pointer-events-none text-[#8b8b98]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          value={value}
          defaultValue={defaultValue}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full rounded-xl border text-sm bg-[#252a35] text-[#e4e1e6] transition-colors placeholder:text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:bg-[#1f2228] disabled:cursor-not-allowed disabled:text-[#6b7280] ${
            Icon ? 'pl-9 pr-3.5 py-2.5' : 'px-3.5 py-2.5'
          } ${
            error
              ? 'border-red-400/80 focus:border-red-400 focus:ring-red-500/20'
              : 'border-[#444652] focus:border-[#8ca0eb] focus:ring-[#8ca0eb]/20'
          } ${className}`}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-rose-400 font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#8b8b98]">{helperText}</p>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
