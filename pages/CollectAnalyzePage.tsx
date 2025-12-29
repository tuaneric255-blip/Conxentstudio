
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/EmptyState';
import { AnalyzeIcon } from '../components/icons/Icons';
import { Analysis, ID } from '../types';
import { useTranslations } from '../i18n';
import { PageNavigation } from '../components/PageNavigation';

export const CollectAnalyzePage: React.FC = () => {
    const t = useTranslations();
    const activeIds = useAppStore(state => state.activeIds);
    const setActiveId = useAppStore(state => state.setActiveId);
    const addAnalysis = useAppStore(state => state.addAnalysis);
    const addToast = useAppStore(state => state.addToast);
    const language = useAppStore(state => state.language);
    
    const activePersona = activeIds.personaId ? useAppStore.getState().data.personas[activeIds.personaId] : null;
    const activeKeywordSet = activeIds.keywordSetId ? useAppStore.getState().data.keywordSets[activeIds.keywordSetId] : null;
    const activeKeywords = activeKeywordSet ? activeKeywordSet.items.filter(k => (activeIds.keywordIds || []).includes(k.id)) : [];
    
    const analysesMap = useAppStore(state => state.data.analyses);
    const analysesForKeywords = useMemo(() =>
        Object.values(analysesMap).sort((a: Analysis, b: Analysis) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    , [analysesMap]);

    const activeAnalysis = activeIds.analysisId ? analysesMap[activeIds.analysisId] : null;
    const [isLoading, setIsLoading] = useState(false);

    const handleWebAnalyze = async () => {
        if (!activePersona || activeKeywords.length === 0) {
            addToast({ type: 'warning', message: t.toasts.selectKeywordFirst }); return;
        }
        setIsLoading(true);
        const result = await geminiService.analyzeWebForKeywords(activeKeywords.map(k => k.term), activePersona.summary, language);
        setIsLoading(false);
        if (result) {
            addAnalysis({ ...result, keywordIds: activeIds.keywordIds || [] });
            addToast({ type: 'success', message: 'Analysis complete!' });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate('analysis') });
        }
    };
    
    return (
        <div className="max-w-6xl mx-auto">
            <Header title={t.collectAnalyze.title} description={t.collectAnalyze.description}>
                <Button onClick={handleWebAnalyze} isLoading={isLoading} disabled={activeKeywords.length === 0 || !activePersona}>
                    {t.collectAnalyze.analyzeButton}
                </Button>
            </Header>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="lg:col-span-2">
                     {!activeAnalysis && !isLoading && (
                        <EmptyState Icon={AnalyzeIcon} title={t.collectAnalyze.emptyTitle} message={t.collectAnalyze.emptyMessage} />
                    )}
                    {isLoading && <p className="text-center p-xl">{t.collectAnalyze.generating}</p>}
                    {activeAnalysis && (
                        <div className="space-y-md animate-fade-in">
                            <Card>
                                <h4 className="font-bold text-lg mb-sm text-primary">{t.collectAnalyze.summary}</h4>
                                <p className="text-text leading-relaxed text-sm">{activeAnalysis.summary}</p>
                            </Card>
                            <Card>
                                <h4 className="font-bold text-lg mb-sm text-accent">{t.collectAnalyze.breakthroughs.title}</h4>
                                <p className="text-sm font-semibold">{t.collectAnalyze.breakthroughs.uniqueInsights}:</p>
                                <p className="text-muted text-sm mb-2">{activeAnalysis.breakthroughs?.uniqueInsights}</p>
                            </Card>
                        </div>
                    )}
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-md">{t.collectAnalyze.historyTitle}</h3>
                    <div className="space-y-sm max-h-[60vh] overflow-y-auto pr-sm custom-scrollbar">
                    {analysesForKeywords.map((a: Analysis) => (
                            <Card 
                            key={a.id}
                            onClick={() => setActiveId('analysisId', a.id)}
                            className={`border-2 cursor-pointer ${activeIds.analysisId === a.id ? 'border-primary' : 'border-transparent'}`}
                        >
                            <p className="font-semibold text-text truncate text-sm">{a.summary}</p>
                            <p className="text-[10px] text-muted mt-1 uppercase">{new Date(a.createdAt).toLocaleString()}</p>
                        </Card>
                    ))}
                    </div>
                </div>
            </div>
            <PageNavigation />
        </div>
    );
};
