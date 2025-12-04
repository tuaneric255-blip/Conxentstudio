import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslations } from '../i18n';
import { ProductIcon, KeywordIcon, AnalyzeIcon, LibraryIcon, SettingsIcon } from './icons/Icons';

interface BottomNavBarProps {
  onSettingsClick: () => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ onSettingsClick }) => {
  const t = useTranslations();
  const navItems = useMemo(() => [
    { to: '/', Icon: ProductIcon, label: t.bottomNav.product },
    { to: '/seo-keywords', Icon: KeywordIcon, label: t.bottomNav.keywords },
    { to: '/collect-analyze', Icon: AnalyzeIcon, label: t.bottomNav.analyze },
    { to: '/library', Icon: LibraryIcon, label: t.bottomNav.library },
  ], [t]);

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-muted hover:text-text'}`;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-panel border-t border-border h-16 flex items-center justify-around">
      {navItems.map(({ to, Icon, label }) => (
        <NavLink key={to} to={to} end={to === '/'} className={navLinkClasses}>
          <Icon className="w-6 h-6" />
          <span className="text-xs">{label}</span>
        </NavLink>
      ))}
      <button onClick={onSettingsClick} className="flex flex-col items-center gap-1 text-muted hover:text-text transition-colors">
        <SettingsIcon className="w-6 h-6" />
        <span className="text-xs">{t.bottomNav.settings}</span>
      </button>
    </nav>
  );
};