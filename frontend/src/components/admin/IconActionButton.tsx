import React from 'react';

type Variant = 'default' | 'primary' | 'danger' | 'outline';

export function IconActionButton({
  title,
  onClick,
  disabled,
  children,
  variant = 'default',
  iconOnly = false,
  className = '',
}: {
  title: string;
  onClick?: () => void | Promise<void>;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: Variant;
  iconOnly?: boolean;
  className?: string;
}) {
  const base = 'inline-flex items-center justify-center rounded-lg transition disabled:opacity-50';
  const size = iconOnly ? 'h-9 w-9' : 'h-9 px-3 gap-2';
  const palette: Record<Variant, string> = {
    default: 'border border-gray-200 bg-white hover:bg-gray-50 text-gray-800',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-800',
    primary: 'bg-primary text-white hover:bg-secondary',
    danger: 'border border-red-200 text-red-600 hover:bg-red-50',
  };
  const cls = `${base} ${size} ${palette[variant]} ${className}`.trim();
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </button>
  );
}
