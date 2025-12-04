
import React, { useEffect, useState, useCallback } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';

import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { MobileSidebar } from './components/MobileSidebar';
import { BottomNavBar } from './components/BottomNavBar';
import { SettingsModal } from './components/SettingsModal';
import { Toaster } from './components/ui/Toast';
import { TourGuide } from './components/TourGuide';

import { ProductInfoPage } from './pages/ProductInfoPage';
import { PersonaPage } from './pages/PersonaPage';
import { SeoKeywordsPage } from './pages/SeoKeywordsPage';
import { CollectAnalyzePage } from './pages/CollectAnalyzePage';
import { ObjectivesPage } from './pages/ObjectivesPage';
import { TitlesPage } from './pages/TitlesPage';
import { MetaDescriptionPage } from './pages/MetaDescriptionPage';
import { SapoPage } from './pages/SapoPage';
import { CtaPage } from './pages/CtaPage';
import { OutlinePage } from './pages/OutlinePage';
import { WritePublishPage } from './pages/WritePublishPage';
import { ImageGenerationPage } from './pages/ImageGenerationPage';
import { SeoChecklistPage } from './pages/SeoChecklistPage';
import { LibraryPage } from './pages/LibraryPage';

function App() {
  const toasts = useAppStore(state => state.toasts);
  const removeToast = useAppStore(state => state.removeToast);
  const theme = useAppStore(state => state.theme);
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

  const handleOpenMobileMenu = useCallback(() => setIsMobileMenuOpen(true), []);
  const handleCloseMobileMenu = useCallback(() => setIsMobileMenuOpen(false), []);
  const handleOpenSettingsModal = useCallback(() => setIsSettingsModalOpen(true), []);
  const handleCloseSettingsModal = useCallback(() => setIsSettingsModalOpen(false), []);

  return (
    <Router>
      <div className="flex h-screen bg-bg text-text">
        {/* Desktop Sidebar */}
        <Sidebar onSettingsClick={handleOpenSettingsModal} />
        
        {/* Mobile Sidebar (Slide-out) */}
        <MobileSidebar isOpen={isMobileMenuOpen} onClose={handleCloseMobileMenu} />
        
        <div className="flex flex-col flex-1 w-full md:w-auto">
          {/* Mobile Header */}
          <MobileHeader onMenuClick={handleOpenMobileMenu} />
          
          <main className="flex-1 overflow-y-auto p-lg pt-20 pb-20 md:pt-lg md:pb-lg">
            <Routes>
              <Route path="/" element={<ProductInfoPage />} />
              <Route path="/personas" element={<PersonaPage />} />
              <Route path="/seo-keywords" element={<SeoKeywordsPage />} />
              <Route path="/collect-analyze" element={<CollectAnalyzePage />} />
              <Route path="/objectives" element={<ObjectivesPage />} />
              <Route path="/titles" element={<TitlesPage />} />
              <Route path="/meta-description" element={<MetaDescriptionPage />} />
              <Route path="/sapo" element={<SapoPage />} />
              <Route path="/cta" element={<CtaPage />} />
              <Route path="/outline" element={<OutlinePage />} />
              <Route path="/write-publish" element={<WritePublishPage />} />
              <Route path="/image-generation" element={<ImageGenerationPage />} />
              <Route path="/seo-checklist" element={<SeoChecklistPage />} />
              <Route path="/library" element={<LibraryPage />} />
            </Routes>
          </main>
          
          {/* Mobile Bottom Navigation */}
          <BottomNavBar onSettingsClick={handleOpenSettingsModal} />
        </div>

        <Toaster toasts={toasts} removeToast={removeToast} />
        <SettingsModal isOpen={isSettingsModalOpen} onClose={handleCloseSettingsModal} />
        <TourGuide />
      </div>
    </Router>
  );
}

export default App;