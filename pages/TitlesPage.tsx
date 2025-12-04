

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/EmptyState';
import { TitleIcon } from '../components/icons/Icons';
import { TitleOption, TitleSet } from '../types';
import { uuidv4 } from '../utils';
import { useTranslations } from '../i18n';

export const TitlesPage: React.FC = () => {
    const t = useTranslations();
    const activeIds = useAppStore(state => state.activeIds);
    const setActiveId = useAppStore(state => state.setActiveId);
    const addTitleSet = useAppStore(state => state.addTitleSet);
    const addToast = useAppStore(state => state.addToast);
    const language = useAppStore(state => state.language);
    
    const activeObjectiveSet = useAppStore(state => activeIds.objectiveSetId ? state.data.objectiveSets[activeIds.objectiveSetId] : null);
    const activeObjectives = useMemo(() => {
        if (!activeObjectiveSet || !activeIds.objectiveIds) return [];
        return activeObjectiveSet.options.filter(opt => activeIds.objectiveIds?.includes(opt.id));
    }, [activeObjectiveSet, activeIds.objectiveIds]);

    const primaryKeyword = useAppStore(state => {
        const keywordSet = activeIds.keywordSetId ? state.data.keywordSets[activeIds.keywordSetId] : null;
        const keywordId = (activeIds.keywordIds || [])[0];
        return keywordSet && keywordId ? keywordSet.items.find(k => k.id === keywordId) : null;
    });
    
    const titleSetsMap = useAppStore(state => state.data.titleSets);
    const titleSetsForObjectives = useMemo(() =>
        Object.values(titleSetsMap).filter((ts: TitleSet) => 
            // A simple check if the sets of objective IDs overlap.
            Array.isArray(ts.objectiveIds) && ts.objectiveIds.some(id => (activeIds.objectiveIds || []).includes(id))
        )
         .sort((a: TitleSet, b: TitleSet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [titleSetsMap, activeIds.objectiveIds]
    );

    const activeTitleSet = activeIds.titleSetId ? titleSetsMap[activeIds.titleSetId] : null;
    const [isLoading, setIsLoading] = useState(false);
    const [sortByScore, setSortByScore] = useState(false);

    const sortedTitles = useMemo(() => {
        if (!activeTitleSet) return [];
        const titles = Array.isArray(activeTitleSet.options) ? [...activeTitleSet.options] : [];
        if (sortByScore) {
            titles.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
        }
        return titles;
    }, [activeTitleSet, sortByScore]);

    const handleGenerate = async () => {
        if (!activeObjectives || activeObjectives.length === 0) {
            addToast({ type: 'warning', message: t.toasts.selectObjectivesFirst });
            return;
        }
        if (!primaryKeyword) {
            addToast({ type: 'warning', message: t.toasts.selectKeywordFirst });
            return;
        }
        setIsLoading(true);
        const objectiveDescriptions = activeObjectives.map(o => o.description);
        const result = await geminiService.generateTitles(objectiveDescriptions, primaryKeyword.term, language);
        setIsLoading(false);
        if (result && result.options) {
            const optionsWithIds: TitleOption[] = result.options.map(opt => ({ ...opt, id: uuidv4() }));
            addTitleSet({ options: optionsWithIds, objectiveIds: activeIds.objectiveIds || [] });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate(t.titles.titles) });
        }
    };
    
    return (
        <div>
            <Header title={t.titles.title} description={t.titles.description}>
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!activeObjectives || activeObjectives.length === 0 || !primaryKeyword}>
                    {t.titles.generateButton}
                </Button>
            </Header>

            <div className="mb-lg">
                <Card>
                    <h4 className="font-bold text-lg mb-sm">{t.titles.selectedObjectives} ({t.titles.count(activeObjectives.length)})</h4>
                    {activeObjectives.length === 0 ? <p className="text-warning text-sm">{t.titles.noObjectives}</p> : (
                        <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                            {activeObjectives.map(obj => <li key={obj.id}>{obj.description}</li>)}
                        </ul>
                    )}
                </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="lg:col-span-2">
                    <div className="flex justify-between items-center mb-md">
                        <h3 className="text-lg font-semibold">{t.titles.generatedTitles}</h3>
                        {activeTitleSet && (
                            <Button variant="secondary" onClick={() => setSortByScore(!sortByScore)}>
                                {sortByScore ? t.metaDescription.showOriginalOrder : t.metaDescription.sortByScore}
                            </Button>
                        )}
                    </div>
                    
                    {!activeTitleSet && !isLoading && (
                        <EmptyState
                            Icon={TitleIcon}
                            title={t.titles.emptyTitle}
                            message={t.titles.emptyMessage}
                        />
                    )}
                    {isLoading && <p>{t.titles.generating}</p>}
                    {activeTitleSet && (
                        <div className="space-y-md">
                            {sortedTitles.map(opt => (
                                <Card 
                                    key={opt.id} 
                                    className={`relative flex justify-between items-start gap-md border-2 ${activeIds.titleId === opt.id ? 'border-primary' : 'border-transparent'}`}
                                    onClick={() => setActiveId('titleId', opt.id)}
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-text">{opt.title}</p>
                                        <p className="text-xs text-muted mt-2">{opt.rationale}</p>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-lg text-primary flex-shrink-0">{opt.score}/10</span>
                                        <span className="text-xs font-semibold text-muted">{t.titles.score}</span>
                                    </div>
                                    {activeIds.titleId === opt.id && <span className="absolute bottom-2 left-2 text-xs bg-primary/20 text-primary font-bold py-1 px-2 rounded-full">{t.active}</span>}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                     <h3 className="text-lg font-semibold mb-md">{t.titles.historyTitle}</h3>
                     {titleSetsForObjectives.length === 0 && <p className="text-sm text-muted">{t.persona.emptyHistory}</p>}
                     <div className="space-y-sm max-h-[60vh] overflow-y-auto pr-sm">
                        {titleSetsForObjectives.map((ts: TitleSet) => (
                             <Card 
                                key={ts.id}
                                onClick={() => setActiveId('titleSetId', ts.id)}
                                className={`border-2 ${activeIds.titleSetId === ts.id ? 'border-primary' : 'border-transparent'}`}
                            >
                                <p className="font-semibold text-text">{t.titles.titleSet(ts.options.length)}</p>
                                <p className="text-xs text-muted mt-1">{new Date(ts.createdAt).toLocaleString()}</p>
                            </Card>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};
