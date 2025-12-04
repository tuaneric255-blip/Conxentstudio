

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/EmptyState';
import { MetaDescriptionIcon } from '../components/icons/Icons';
import { MetaDescriptionOption, MetaDescriptionSet } from '../types';
import { uuidv4 } from '../utils';
import { useTranslations } from '../i18n';

export const MetaDescriptionPage: React.FC = () => {
    const t = useTranslations();
    const activeIds = useAppStore(state => state.activeIds);
    const setActiveId = useAppStore(state => state.setActiveId);
    const addMetaDescriptionSet = useAppStore(state => state.addMetaDescriptionSet);
    const addToast = useAppStore(state => state.addToast);
    const language = useAppStore(state => state.language);

    const activeKeywordSet = useAppStore(state => activeIds.keywordSetId ? state.data.keywordSets[activeIds.keywordSetId] : null);
    const activeKeyword = useMemo(() => {
        const keywordIds = activeIds.keywordIds || [];
        if (!activeKeywordSet || keywordIds.length === 0) return null;
        // Use the first selected keyword as the primary for meta description
        return activeKeywordSet.items.find(k => k.id === keywordIds[0]) || null;
    }, [activeKeywordSet, activeIds.keywordIds]);

    const activeTitleSet = useAppStore(state => activeIds.titleSetId ? state.data.titleSets[activeIds.titleSetId] : null);
    const activeTitle = useMemo(() => 
        activeTitleSet && activeIds.titleId ? activeTitleSet.options.find(t => t.id === activeIds.titleId) : null,
        [activeTitleSet, activeIds.titleId]
    );

    const metaDescriptionSetsMap = useAppStore(state => state.data.metaDescriptionSets);
    const metaDescriptionSetsForTitle = useMemo(() =>
        Object.values(metaDescriptionSetsMap).filter((mds: MetaDescriptionSet) => mds.titleId === activeIds.titleId)
         .sort((a: MetaDescriptionSet, b: MetaDescriptionSet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [metaDescriptionSetsMap, activeIds.titleId]
    );

    const activeMetaDescriptionSet = activeIds.metaDescriptionSetId ? metaDescriptionSetsMap[activeIds.metaDescriptionSetId] : null;

    const [isLoading, setIsLoading] = useState(false);
    const [sortByScore, setSortByScore] = useState(false);

    const sortedDescriptions = useMemo(() => {
        if (!activeMetaDescriptionSet || !Array.isArray(activeMetaDescriptionSet.options)) return [];
        const descriptions = [...activeMetaDescriptionSet.options];
        if (sortByScore) {
            descriptions.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        }
        return descriptions;
    }, [activeMetaDescriptionSet, sortByScore]);

    const handleGenerate = async () => {
        if (!activeKeyword || !activeTitle) {
            addToast({ type: 'warning', message: t.toasts.selectTitleFirst });
            return;
        }
        setIsLoading(true);
        const result = await geminiService.generateMetaDescriptions(activeTitle.title, activeKeyword.term, language);
        setIsLoading(false);
        if (result && result.options) {
            const optionsWithIds: MetaDescriptionOption[] = result.options.map(opt => ({ ...opt, id: uuidv4() }));
            addMetaDescriptionSet({ 
                options: optionsWithIds, 
                titleId: activeTitle.id,
                keywordTerm: activeKeyword.term,
                title: activeTitle.title,
            });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate(t.metaDescription.descriptions) });
        }
    };
    
    return (
        <div>
            <Header title={t.metaDescription.title} description={t.metaDescription.description}>
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!activeTitle || !activeKeyword}>
                    {t.metaDescription.generateButton}
                </Button>
            </Header>

            {!activeTitle || !activeKeyword ? (
                <div className="text-warning bg-warning/10 border border-warning/20 p-md rounded-md">
                    {t.metaDescription.noTitleWarning}
                </div>
            ) : (
                <div className="mb-md p-sm bg-panel rounded-md space-y-2">
                    <p>{t.metaDescription.selectedKeyword} <span className="font-bold text-accent">{activeKeyword.term}</span></p>
                    <p>{t.metaDescription.selectedTitle} <span className="font-bold text-primary">{activeTitle.title}</span></p>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-md">
                        <h3 className="text-lg font-semibold">{t.metaDescription.generatedDescriptions}</h3>
                        {activeMetaDescriptionSet && (
                            <Button variant="secondary" onClick={() => setSortByScore(!sortByScore)}>
                                {sortByScore ? t.metaDescription.showOriginalOrder : t.metaDescription.sortByScore}
                            </Button>
                        )}
                    </div>

                    {metaDescriptionSetsForTitle.length === 0 && !isLoading && (
                        <EmptyState
                            Icon={MetaDescriptionIcon}
                            title={t.metaDescription.emptyTitle}
                            message={t.metaDescription.emptyMessage}
                        />
                    )}
                    {isLoading && <p>{t.metaDescription.generating}</p>}

                    {activeMetaDescriptionSet && (
                        <div className="space-y-md">
                            {sortedDescriptions.map(opt => (
                                <Card 
                                    key={opt.id} 
                                    className={`flex flex-col justify-between border-2 ${activeIds.metaDescriptionId === opt.id ? 'border-primary' : 'border-transparent'}`}
                                    onClick={() => setActiveId('metaDescriptionId', opt.id)}
                                >
                                    <div>
                                        <div className="flex justify-between items-start">
                                            <p className="font-semibold text-text mb-xs pr-2">{opt.description}</p>
                                            {opt.score && (
                                                <span className="font-bold text-lg text-primary flex-shrink-0">{opt.score}/10</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted font-mono mb-sm">{opt.description.length} {t.metaDescription.characters}</p>
                                        <p className="text-sm text-muted">{opt.rationale}</p>
                                    </div>
                                    {activeIds.metaDescriptionId === opt.id && <span className="mt-sm text-xs bg-primary/20 text-primary font-bold py-1 px-2 rounded-full self-start">{t.active}</span>}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                     <h3 className="text-lg font-semibold mb-md">{t.persona.historyTitle}</h3>
                     {metaDescriptionSetsForTitle.length === 0 && <p className="text-sm text-muted">{t.persona.emptyHistory}</p>}
                     <div className="space-y-sm max-h-[60vh] overflow-y-auto pr-sm">
                        {metaDescriptionSetsForTitle.map((mds: MetaDescriptionSet) => (
                             <Card 
                                key={mds.id}
                                onClick={() => setActiveId('metaDescriptionSetId', mds.id)}
                                className={`border-2 ${activeIds.metaDescriptionSetId === mds.id ? 'border-primary' : 'border-transparent'}`}
                            >
                                <p className="font-semibold text-text">{Array.isArray(mds.options) ? mds.options.length : 0} Descriptions</p>
                                <p className="text-xs text-muted mt-1">{new Date(mds.createdAt).toLocaleString()}</p>
                            </Card>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};