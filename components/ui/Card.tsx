
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const baseClasses = 'bg-panel border border-border rounded-lg p-md shadow-card transition-all duration-200';
  const clickableClasses = onClick ? 'cursor-pointer hover:border-primary hover:shadow-lg' : '';

  return (
    <div className={`${baseClasses} ${clickableClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
};
