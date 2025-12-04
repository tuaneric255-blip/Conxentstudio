
import React from 'react';
import { XCircleIcon } from '../icons/Icons';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div 
        className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-md" 
        onClick={onClose}
        aria-modal="true"
        role="dialog"
    >
      <div 
        className="bg-panel rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-fade-in"
        onClick={e => e.stopPropagation()}
      >
        <header className="flex items-center justify-between p-md border-b border-border flex-shrink-0">
          <h2 className="text-xl font-bold text-text">{title}</h2>
          <button onClick={onClose} className="text-muted hover:text-text">
            <span className="sr-only">Close</span>
            <XCircleIcon className="w-6 h-6" />
          </button>
        </header>
        <main className="overflow-y-auto p-md">
          {children}
        </main>
      </div>
    </div>
  );
};
