import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export function Card({ children, padded = true, style, ...rest }: CardProps) {
  return (
    <div
      style={{
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: padded ? 20 : 0,
        boxShadow: 'var(--shadow-soft)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}
