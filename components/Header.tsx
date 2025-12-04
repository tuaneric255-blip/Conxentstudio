
import React from 'react';

interface HeaderProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, description, children }) => {
  return (
    <header className="mb-lg pb-md border-b border-border">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-text">{title}</h2>
          <p className="text-muted mt-1">{description}</p>
        </div>
        <div className="flex items-center gap-sm">
          {children}
        </div>
      </div>
    </header>
  );
};
