import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { SunIcon, MoonIcon } from './icons/Icons';
import { useTranslations } from '../i18n';

export const ThemeToggle: React.FC = () => {
    const theme = useAppStore(state => state.theme);
    const setTheme = useAppStore(state => state.setTheme);
    const t = useTranslations();

    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2.5 rounded-md text-muted hover:bg-border hover:text-text transition-colors"
            aria-label={t.sidebar.themeToggle}
        >
            {theme === 'light' ? (
                <MoonIcon className="w-5 h-5" />
            ) : (
                <SunIcon className="w-5 h-5" />
            )}
        </button>
    );
};