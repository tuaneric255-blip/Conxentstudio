
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, id, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-muted mb-2">{label}</label>
      <input
        id={id}
        className="w-full text-sm p-2.5 bg-panel border border-border rounded-md text-text focus:ring-primary focus:border-primary"
        {...props}
      />
    </div>
  );
};
