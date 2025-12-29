
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
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono font-bold">v3.3</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-md text-muted hover:bg-border">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 space-y-xs overflow-y-auto custom-scrollbar mb-md">
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

        <div className="mt-auto pt-md border-t border-border/50">
          <a 
              href="https://zalo.me/g/ughbhd622" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#0068ff] text-white rounded-md transition-all font-bold text-sm mb-4"
          >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.44 2.22c-5.52 0-10 4.48-10 10 0 1.95.56 3.77 1.52 5.3l-1.31 4.26 4.38-1.27c1.45.83 3.13 1.3 4.93 1.3 5.52 0 10-4.48 10-10s-4.48-10-10-10zm-1.12 13.92h-2.14l-1.63-4.38h-.02l.02 4.38h-1.85V8.12h2.16l1.62 4.34h.02l-.02-4.34h1.84v8.02zm4.64 0h-1.92V9.82h-1.22V8.12h4.36v1.7h-1.22v6.32zm4.14-5.26c-.32-.22-.72-.34-1.14-.34-.84 0-1.54.54-1.84 1.28h3.84c-.16-.36-.46-.68-.86-.94zm-1.14-1.46c.86 0 1.62.34 2.2 1.02.58.68.86 1.64.86 2.82s-.28 2.14-.86 2.82c-.58.68-1.34 1.02-2.2 1.02s-1.62-.34-2.2-1.02c-.58-.68-.86-1.64-.86-2.82s.28-2.14.86-2.82c.58-.68 1.34-1.02 2.2-1.02z"/>
              </svg>
              <span>{t.sidebar.supportGroup}</span>
          </a>
          <p className="text-[10px] text-muted text-center opacity-70">© Eric Nguyen - Odinflows</p>
        </div>
      </aside>
    </>
  );
};
