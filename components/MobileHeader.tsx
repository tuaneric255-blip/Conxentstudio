
import React from 'react';
import { MenuIcon } from './icons/Icons';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-panel border-b border-border p-md flex items-center justify-between h-16">
      <div className="flex items-center gap-sm">
        <div className="p-2 bg-primary/20 rounded-lg">
          <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.25 10.25L12 15.5L6.75 10.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12C3.5 7.30558 7.30558 3.5 12 3.5Z" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold text-text leading-tight">ConXent</h1>
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-muted leading-tight">Basic 2 Magic</p>
            <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono font-bold">v2.8</span>
          </div>
        </div>
      </div>
      <button onClick={onMenuClick} className="p-2 rounded-md text-muted hover:bg-border hover:text-text transition-colors">
        <MenuIcon className="w-6 h-6" />
      </button>
    </header>
  );
};