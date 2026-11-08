import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200/80 shadow-subtle ${
        hoverable ? 'transition-all duration-200 hover:shadow-premium hover:border-slate-300 cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
