import { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'white' | 'ghost';
  size?: 'default' | 'sm';
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'default',
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variantClasses = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    accent: 'btn-accent',
    danger: 'btn-danger',
    white: 'btn-white',
    ghost: 'btn-ghost',
  };

  const sizeClasses = {
    default: '',
    sm: 'btn-sm',
  };

  return (
    <button
      className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
