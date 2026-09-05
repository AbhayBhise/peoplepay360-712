import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 transition-all duration-200 ${
        hoverable ? 'hover-card-lift cursor-pointer hover:border-slate-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
