
import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useTranslations } from '../i18n';
import { ThemeToggle } from './ThemeToggle';
import { ProductIcon, PersonaIcon, KeywordIcon, AnalyzeIcon, TargetIcon, TitleIcon, MetaDescriptionIcon, SapoIcon, CtaIcon, OutlineIcon, WriteIcon, ImageIcon, SeoCheckIcon, LibraryIcon, SettingsIcon, QuestionMarkIcon } from './icons/Icons';

interface SidebarProps {
  onSettingsClick: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onSettingsClick }) => {
  const t = useTranslations();
  const setLanguage = useAppStore(state => state.setLanguage);
  const language = useAppStore(state => state.language);
  const userName = useAppStore(state => state.userName);
  const toggleTour = useAppStore(state => state.toggleTour);
  const isCollapsed = useAppStore(state => state.isSidebarCollapsed);
  const toggleSidebar = useAppStore(state => state.toggleSidebar);

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
    <aside className={`hidden md:flex flex-col bg-panel border-r border-border p-md transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className="mb-lg flex items-center justify-between">
        <div className={`flex items-center gap-sm transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
          <div className="p-2 bg-primary/20 rounded-lg shrink-0">
            <svg className="w-6 h-6 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.25 10.25L12 15.5L6.75 10.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 3.5C16.6944 3.5 20.5 7.30558 20.5 12C20.5 16.6944 16.6944 20.5 12 20.5C7.30558 20.5 3.5 16.6944 3.5 12C3.5 7.30558 7.30558 3.5 12 3.5Z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <div className="overflow-hidden">
            <h1 className="text-xl font-bold text-text leading-tight whitespace-nowrap">ConXent</h1>
            <div className="flex items-center gap-2">
                <p className="text-xs font-medium text-muted leading-tight">Basic 2 Magic</p>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-mono font-bold">v3.3</span>
            </div>
          </div>
        </div>
        
        <button 
            onClick={toggleSidebar}
            className="p-2 rounded-md hover:bg-border text-muted transition-colors shrink-0"
            title={isCollapsed ? "Expand" : "Collapse"}
        >
            {isCollapsed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"/></svg>
            )}
        </button>
      </div>

      <nav className="flex-1 space-y-xs overflow-y-auto custom-scrollbar">
        {SIDEBAR_ITEMS.map(({ to, Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            title={isCollapsed ? label : ""}
            className={({ isActive }) =>
              `flex items-center gap-sm p-sm rounded-md transition-colors ${
                isActive
                  ? 'bg-primary/20 text-primary font-semibold'
                  : 'text-muted hover:bg-border hover:text-text'
              } ${isCollapsed ? 'justify-center' : ''}`
            }
          >
            <Icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className={`mt-auto pt-md border-t border-border/50 flex flex-col gap-sm ${isCollapsed ? 'items-center' : ''}`}>
        
        {/* Support Group Button */}
        <a 
            href="https://zalo.me/g/ughbhd622" 
            target="_blank" 
            rel="noopener noreferrer"
            className={`flex items-center gap-2 px-3 py-2 bg-[#0068ff]/10 text-[#0068ff] hover:bg-[#0068ff]/20 rounded-md transition-all font-bold text-sm mb-2 ${isCollapsed ? 'justify-center w-10 h-10 p-0 overflow-hidden' : ''}`}
            title={t.sidebar.supportGroup}
        >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.44 2.22c-5.52 0-10 4.48-10 10 0 1.95.56 3.77 1.52 5.3l-1.31 4.26 4.38-1.27c1.45.83 3.13 1.3 4.93 1.3 5.52 0 10-4.48 10-10s-4.48-10-10-10zm-1.12 13.92h-2.14l-1.63-4.38h-.02l.02 4.38h-1.85V8.12h2.16l1.62 4.34h.02l-.02-4.34h1.84v8.02zm4.64 0h-1.92V9.82h-1.22V8.12h4.36v1.7h-1.22v6.32zm4.14-5.26c-.32-.22-.72-.34-1.14-.34-.84 0-1.54.54-1.84 1.28h3.84c-.16-.36-.46-.68-.86-.94zm-1.14-1.46c.86 0 1.62.34 2.2 1.02.58.68.86 1.64.86 2.82s-.28 2.14-.86 2.82c-.58.68-1.34 1.02-2.2 1.02s-1.62-.34-2.2-1.02c-.58-.68-.86-1.64-.86-2.82s.28-2.14.86-2.82c.58-.68 1.34-1.02 2.2-1.02z"/>
            </svg>
            {!isCollapsed && <span className="truncate">{t.sidebar.supportGroup}</span>}
        </a>

        <div className={`flex items-center ${isCollapsed ? 'flex-col gap-2' : 'justify-between'}`}>
            <div className={`flex items-center ${isCollapsed ? 'flex-col' : 'gap-xs'}`}>
                <ThemeToggle />
                <button 
                    onClick={toggleTour}
                    className="p-2.5 rounded-md text-muted hover:bg-border hover:text-text transition-colors"
                    title={t.sidebar.help}
                >
                    <QuestionMarkIcon className="w-5 h-5" />
                </button>
                <button 
                    onClick={onSettingsClick} 
                    className="p-2.5 rounded-md text-muted hover:bg-border hover:text-text transition-colors"
                    title={t.sidebar.settings}
                >
                    <SettingsIcon className="w-5 h-5" />
                </button>
            </div>
            
            {!isCollapsed && (
                <div className="flex items-center gap-xs">
                    <button onClick={() => setLanguage('en')} className={`text-xs font-bold p-1 ${language === 'en' ? 'text-primary' : 'text-muted'}`}>EN</button>
                    <span className="text-muted">|</span>
                    <button onClick={() => setLanguage('vi')} className={`text-xs font-bold p-1 ${language === 'vi' ? 'text-primary' : 'text-muted'}`}>VI</button>
                </div>
            )}
        </div>
        
        {!isCollapsed && userName && (
            <p className="text-xs text-muted text-center italic">{t.sidebar.welcome(userName)}</p>
        )}
      </div>
      
      {!isCollapsed && (
          <div className="text-center mt-md pt-md border-t border-border/50">
            <p className="text-[10px] text-muted leading-tight opacity-70">© Eric Nguyen - Odinflows</p>
          </div>
      )}
    </aside>
  );
};
