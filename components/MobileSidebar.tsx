
import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslations } from '../i18n';
import { ProductIcon, PersonaIcon, KeywordIcon, AnalyzeIcon, TargetIcon, TitleIcon, MetaDescriptionIcon, SapoIcon, CtaIcon, OutlineIcon, WriteIcon, ImageIcon, SeoCheckIcon, LibraryIcon, XIcon } from './icons/Icons';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose }) => {
  const t = useTranslations();

  const SIDEBAR_ITEMS = useMemo(() => [
    { to: '/', Icon: ProductIcon, label: t.sidebar.productInfo },
    { to: '/personas', Icon: PersonaIcon, label: t.sidebar.personas },
    { to: '/seo-keywords', Icon: KeywordIcon, label: t.sidebar.seoKeywords },
    { to: '/collect-analyze', Icon: AnalyzeIcon, label: t.sidebar.collectAnalyze },
    { to: '/objectives', Icon: TargetIcon, label: t.sidebar.objectives },
    { to: '/titles', Icon: TitleIcon, label: t.sidebar.titles },
    { to: '/meta-description', Icon: MetaDescriptionIcon, label: t.sidebar.metaDescription },
    { to: '/sapo', Icon: SapoIcon, label: t.sidebar.sapo },
    { to: '/cta', Icon: CtaIcon, label: t.sidebar.cta },
    { to: '/outline', Icon: OutlineIcon, label: t.sidebar.outline },
    { to: '/image-generation', Icon: ImageIcon, label: t.sidebar.imageGeneration },
    { to: '/write-publish', Icon: WriteIcon, label: t.sidebar.writePublish },
    { to: '/seo-checklist', Icon: SeoCheckIcon, label: t.sidebar.seoChecklist },
    { to: '/library', Icon: LibraryIcon, label: t.sidebar.library },
  ], [t]);
  
  return (
    <>
      <div 
        className={`md:hidden fixed inset-0 bg-black/60 z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />
      <aside 
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-panel border-r border-border flex flex-col p-md transform transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between mb-lg">
          <div className="flex items-center gap-sm">
            <div className="p-2 bg-primary/20 rounded-lg">
              <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.25 10.25L12 15.5L6.75 10.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12C3.5 7.30558 7.30558 3.5 12 3.5Z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-text leading-tight">ConXent</h1>
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted leading-tight">Basic 2 Magic</p>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono font-bold">v3.0</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-muted hover:bg-border">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 space-y-xs overflow-y-auto">
          {SIDEBAR_ITEMS.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-sm p-sm rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary/20 text-primary font-semibold'
                    : 'text-muted hover:bg-border hover:text-text'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="text-center mt-auto pt-md border-t border-border/50">
          <p className="text-xs text-muted">Copyright by Eric Nguyen - Odinflows & Teamentors</p>
        </div>
      </aside>
    </>
  );
};
