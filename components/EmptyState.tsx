
import React from 'react';

interface EmptyStateProps {
  Icon: React.ElementType;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ Icon, title, message, action }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-xl bg-panel/50 rounded-lg border-2 border-dashed border-border">
      <Icon className="w-12 h-12 text-muted mb-md" />
      <h3 className="text-lg font-semibold text-text mb-xs">{title}</h3>
      <p className="text-muted max-w-sm mb-md">{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
