import { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'blue' | 'purple' | 'glass' | 'dashed' | 'stats';
  children: ReactNode;
}

export function Card({ variant = 'default', children, className = '', ...props }: CardProps) {
  const variantClasses = {
    default: '',
    blue: 'card-blue',
    purple: 'card-purple',
    glass: 'card-glass',
    dashed: 'card-dashed',
    stats: 'card-stats',
  };

  return (
    <div className={`card ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </div>
  );
}
