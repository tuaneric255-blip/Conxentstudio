
import React from 'react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}

export const Textarea: React.FC<TextareaProps> = ({ label, id, ...props }) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-muted mb-2">{label}</label>
      <textarea
        id={id}
        rows={4}
        className="w-full text-sm p-2.5 bg-panel border border-border rounded-md text-text focus:ring-primary focus:border-primary"
        {...props}
      />
    </div>
  );
};
