
import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { Language } from '../types';
import { useTranslations } from '../i18n';
import { Modal } from './ui/Modal';
import { ThemeToggle } from './ThemeToggle';
import { Input } from './ui/Input';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const t = useTranslations();
  const setLanguage = useAppStore(state => state.setLanguage);
  const language = useAppStore(state => state.language);
  const userName = useAppStore(state => state.userName);
  const setUserName = useAppStore(state => state.setUserName);
  
  const geminiApiKey = useAppStore(state => state.geminiApiKey);
  const setGeminiApiKey = useAppStore(state => state.setGeminiApiKey);

  const googleConfig = useAppStore(state => state.googleConfig);
  const setGoogleConfig = useAppStore(state => state.setGoogleConfig);

  const handleGoogleConfigChange = (key: 'clientId' | 'apiKey', value: string) => {
      setGoogleConfig({ ...googleConfig, [key]: value });
  };
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.settingsModal.title}>
      <div className="space-y-lg">
        <Input 
          label={t.settingsModal.yourName}
          id="user-name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
          placeholder={t.settingsModal.yourNamePlaceholder}
        />

        <div className="flex items-center justify-between">
          <span className="text-text font-medium">{t.sidebar.themeToggle}</span>
          <ThemeToggle />
        </div>

        <div className="flex items-center justify-between">
            <span className="text-text font-medium">{t.settingsModal.language}</span>
            <div className="flex items-center gap-xs p-1 bg-border rounded-md">
                <button 
                    onClick={() => setLanguage('en')}
                    className={`text-sm font-bold p-2 rounded ${language === 'en' ? 'bg-panel text-primary' : 'text-muted'}`}>EN</button>
                <button 
                    onClick={() => setLanguage('vi')}
                    className={`text-sm font-bold p-2 rounded ${language === 'vi' ? 'bg-panel text-primary' : 'text-muted'}`}>VI</button>
            </div>
        </div>

        {/* AI Configuration Section */}
        <div className="pt-md border-t border-border">
            <h4 className="text-text font-medium mb-sm">{t.settingsModal.geminiSectionTitle}</h4>
            <p className="text-xs text-muted mb-md">{t.settingsModal.geminiHelp}</p>
            
            <Input 
                label={t.settingsModal.geminiApiKey}
                id="gemini-api-key"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="e.g., AIza..."
            />
            <p className="text-xs text-muted mt-2">
                Get a free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">aistudio.google.com</a>
            </p>
        </div>
        
        {/* Drive Configuration Section */}
        <div className="pt-md border-t border-border">
            <h4 className="text-text font-medium mb-sm">{t.settingsModal.driveSectionTitle}</h4>
            <p className="text-xs text-muted mb-md">{t.settingsModal.driveHelp}</p>
            
             <details className="mb-md p-md bg-bg rounded-md border border-border text-sm group">
                <summary className="font-semibold cursor-pointer text-primary list-none flex items-center gap-2">
                    <span className="group-open:rotate-90 transition-transform">▶</span>
                    {t.settingsModal.driveGuideTitle}
                </summary>
                <ol className="list-decimal list-inside mt-sm space-y-2 text-muted pl-4">
                    {t.settingsModal.driveGuideSteps.map((step, i) => (
                        <li key={i}>{step}</li>
                    ))}
                </ol>
            </details>

            <div className="space-y-sm">
                <Input 
                    label={t.settingsModal.driveClientId}
                    id="google-client-id"
                    value={googleConfig.clientId}
                    onChange={(e) => handleGoogleConfigChange('clientId', e.target.value)}
                    placeholder="e.g., 123...apps.googleusercontent.com"
                />
                <Input 
                    label={t.settingsModal.driveApiKey}
                    id="google-api-key"
                    value={googleConfig.apiKey}
                    onChange={(e) => handleGoogleConfigChange('apiKey', e.target.value)}
                    placeholder="e.g., AIza..."
                />
            </div>
        </div>

        <div>
            <h4 className="text-text font-medium mb-2">System Info</h4>
             <p className="text-xs text-muted">
                All your work data is saved to your browser's local storage.
            </p>
        </div>
      </div>
    </Modal>
  );
};