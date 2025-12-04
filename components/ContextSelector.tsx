import React from 'react';
import { ID } from '../types';
import { useTranslations } from '../i18n';

interface ContextSelectorProps<T extends { id: ID; name: string } | { id: ID; summary: string }> {
  label: string;
  items: T[];
  selectedId: ID | undefined;
  onSelect: (id: ID) => void;
  missingMessage: string;
}

export const ContextSelector = <T extends { id: ID; name: string } | { id: ID; summary: string }>(
  { label, items, selectedId, onSelect, missingMessage }: ContextSelectorProps<T>
) => {
  const t = useTranslations();
  if (items.length === 0) {
    return (
      <div className="mb-md">
        <label className="block text-sm font-medium text-muted mb-2">{label}</label>
        <div className="w-full text-sm p-2.5 bg-panel border border-border rounded-md text-warning">
          {missingMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-md">
      <label htmlFor={label} className="block text-sm font-medium text-muted mb-2">{label}</label>
      <select
        id={label}
        value={selectedId || ''}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full text-sm p-2.5 bg-panel border border-border rounded-md text-text focus:ring-primary focus:border-primary"
      >
        <option value="" disabled>{t.contextSelector.selectA(label)}</option>
        {items.map(item => (
          <option key={item.id} value={item.id}>
            {'name' in item ? item.name : item.summary}
          </option>
        ))}
      </select>
    </div>
  );
};