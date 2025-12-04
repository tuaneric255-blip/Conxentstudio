
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/EmptyState';
import { SapoIcon } from '../components/icons/Icons';
import { SapoOption, SapoSet } from '../types';
import { uuidv4 } from '../utils';
import { useTranslations } from '../i18n';

export const SapoPage: React.FC = () => {
    const t = useTranslations();
    const activeIds = useAppStore(state => state.activeIds);
    const setActiveId = useAppStore(state => state.setActiveId);
    const addSapoSet = useAppStore(state => state.addSapoSet);
    const addToast = useAppStore(state => state.addToast);
    const language = useAppStore(state => state.language);

    const activeKeywordSet = useAppStore(state => activeIds.keywordSetId ? state.data.keywordSets[activeIds.keywordSetId] : null);
    const activeKeyword = useMemo(() => {
        const keywordIds = activeIds.keywordIds || [];
        if (!activeKeywordSet || keywordIds.length === 0) return null;
        return activeKeywordSet.items.find(k => k.id === keywordIds[0]) || null;
    }, [activeKeywordSet, activeIds.keywordIds]);

    const activeTitleSet = useAppStore(state => activeIds.titleSetId ? state.data.titleSets[activeIds.titleSetId] : null);
    const activeTitle = useMemo(() => 
        activeTitleSet && activeIds.titleId ? activeTitleSet.options.find(t => t.id === activeIds.titleId) : null,
        [activeTitleSet, activeIds.titleId]
    );

    const activeMetaSet = useAppStore(state => activeIds.metaDescriptionSetId ? state.data.metaDescriptionSets[activeIds.metaDescriptionSetId] : null);
    const activeMeta = useMemo(() =>
        activeMetaSet && activeIds.metaDescriptionId ? activeMetaSet.options.find(m => m.id === activeIds.metaDescriptionId) : null,
        [activeMetaSet, activeIds.metaDescriptionId]
    );

    const activePersona = useAppStore(state => activeIds.personaId ? state.data.personas[activeIds.personaId] : null);

    const sapoSetsMap = useAppStore(state => state.data.sapoSets);
    const sapoSetsForMeta = useMemo(() =>
        Object.values(sapoSetsMap).filter((ss: SapoSet) => ss.metaDescriptionId === activeIds.metaDescriptionId)
         .sort((a: SapoSet, b: SapoSet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [sapoSetsMap, activeIds.metaDescriptionId]
    );

    const activeSapoSet = activeIds.sapoSetId ? sapoSetsMap[activeIds.sapoSetId] : null;

    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!activeTitle || !activeKeyword || !activeMeta || !activePersona) {
            addToast({ type: 'warning', message: t.toasts.selectMetaDescriptionFirst });
            return;
        }
        setIsLoading(true);
        const result = await geminiService.generateSapos(activeTitle.title, activeKeyword.term, activePersona.summary, language);
        setIsLoading(false);
        if (result && result.options) {
            const optionsWithIds: SapoOption[] = result.options.map(opt => ({ ...opt, id: uuidv4() }));
            addSapoSet({ 
                options: optionsWithIds, 
                metaDescriptionId: activeMeta.id,
            });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate('Sapos') });
        }
    };
    
    return (
        <div>
            <Header title={t.sapo.title} description={t.sapo.description}>
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!activeTitle || !activeKeyword || !activeMeta}>
                    {t.sapo.generateButton}
                </Button>
            </Header>

            {!activeMeta ? (
                <div className="text-warning bg-warning/10 border border-warning/20 p-md rounded-md">
                    {t.sapo.noContextWarning}
                </div>
            ) : (
                <div className="mb-md p-sm bg-panel rounded-md space-y-2 border border-border">
                    <p>{t.metaDescription.selectedTitle} <span className="font-bold text-primary">{activeTitle?.title}</span></p>
                    <p className="text-sm text-muted">{t.writePublish.metaDescription}: {activeMeta.description}</p>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-md">{t.sapo.generatedSapos}</h3>

                    {!activeSapoSet && !isLoading && (
                        <EmptyState
                            Icon={SapoIcon}
                            title={t.sapo.emptyTitle}
                            message={t.sapo.emptyMessage}
                        />
                    )}
                    {isLoading && <p>{t.sapo.generating}</p>}

                    {activeSapoSet && (
                        <div className="space-y-md">
                            {Array.isArray(activeSapoSet.options) && activeSapoSet.options.map(opt => (
                                <Card 
                                    key={opt.id} 
                                    className={`flex flex-col justify-between border-2 ${activeIds.sapoId === opt.id ? 'border-primary' : 'border-transparent'}`}
                                    onClick={() => setActiveId('sapoId', opt.id)}
                                >
                                    <div>
                                        <p className="font-medium text-text mb-sm">{opt.content}</p>
                                        <p className="text-sm text-muted italic">{opt.rationale}</p>
                                    </div>
                                    {activeIds.sapoId === opt.id && <span className="mt-sm text-xs bg-primary/20 text-primary font-bold py-1 px-2 rounded-full self-start">{t.active}</span>}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                     <h3 className="text-lg font-semibold mb-md">{t.persona.historyTitle}</h3>
                     {sapoSetsForMeta.length === 0 && <p className="text-sm text-muted">{t.persona.emptyHistory}</p>}
                     <div className="space-y-sm max-h-[60vh] overflow-y-auto pr-sm">
                        {sapoSetsForMeta.map((ss: SapoSet) => (
                             <Card 
                                key={ss.id}
                                onClick={() => setActiveId('sapoSetId', ss.id)}
                                className={`border-2 ${activeIds.sapoSetId === ss.id ? 'border-primary' : 'border-transparent'}`}
                            >
                                <p className="font-semibold text-text">{Array.isArray(ss.options) ? ss.options.length : 0} Sapos</p>
                                <p className="text-xs text-muted mt-1">{new Date(ss.createdAt).toLocaleString()}</p>
                            </Card>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};
