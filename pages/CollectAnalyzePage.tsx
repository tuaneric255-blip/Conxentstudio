
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
    
    const productsMap = useAppStore(state => state.data.products);
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

    const renderList = (title: string, items: string[] | undefined) => {
        if (!items || !Array.isArray(items) || items.length === 0) return null;
        return (
            <div className="mb-4">
                <p className="text-xs font-bold uppercase text-primary mb-2 tracking-widest">{title}</p>
                <ul className="space-y-2">
                    {items.map((item, i) => (
                        <li key={i} className="flex gap-2 text-sm text-text leading-relaxed">
                            <span className="text-primary font-bold">•</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };
    
    return (
        <div className="max-w-6xl mx-auto pb-32">
            <Header title={t.collectAnalyze.title} description={t.collectAnalyze.description}>
                <Button onClick={handleWebAnalyze} isLoading={isLoading} disabled={activeKeywords.length === 0 || !activePersona}>
                    {t.collectAnalyze.analyzeButton}
                </Button>
            </Header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg">
                <div className="lg:col-span-3 space-y-md">
                     {!activeAnalysis && !isLoading && (
                        <EmptyState Icon={AnalyzeIcon} title={t.collectAnalyze.emptyTitle} message={t.collectAnalyze.emptyMessage} />
                    )}
                    
                    {isLoading && (
                        <Card className="flex flex-col items-center justify-center p-xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                            <p className="text-center font-medium">{t.collectAnalyze.generating}</p>
                        </Card>
                    )}
                    
                    {activeAnalysis && !isLoading && (
                        <div className="space-y-md animate-fade-in">
                            {/* Summary Section */}
                            <Card className="border-l-4 border-primary">
                                <h4 className="font-bold text-lg mb-sm text-primary uppercase tracking-tight">{t.collectAnalyze.summary}</h4>
                                <p className="text-text leading-relaxed text-sm">{activeAnalysis.summary}</p>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                {/* Gaps & Ideas */}
                                <Card>
                                    <h4 className="font-bold text-lg mb-4 border-b border-border pb-2 flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-danger"></span>
                                        {t.collectAnalyze.contentGaps}
                                    </h4>
                                    {renderList("Competitor Weaknesses", activeAnalysis.contentGaps)}
                                </Card>

                                <Card>
                                    <h4 className="font-bold text-lg mb-4 border-b border-border pb-2 flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                                        {t.collectAnalyze.creativeIdeas}
                                    </h4>
                                    {renderList("Creative Angles", activeAnalysis.creativeIdeas)}
                                </Card>
                            </div>

                            {/* Objectives */}
                            <Card>
                                <h4 className="font-bold text-lg mb-4 border-b border-border pb-2 flex items-center gap-2 text-success">
                                    <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                                    {t.collectAnalyze.objectives}
                                </h4>
                                {renderList("Core Intentions", activeAnalysis.objectives)}
                            </Card>

                            {/* Breakthrough Points - E-E-A-T / HCU */}
                            <Card className="bg-gradient-to-br from-panel to-primary/5 border-primary/20">
                                <h4 className="font-bold text-lg mb-6 border-b border-primary/10 pb-2 flex items-center gap-2 text-primary">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                                    {t.collectAnalyze.breakthroughs.title}
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-primary/70 mb-2">{t.collectAnalyze.breakthroughs.uniqueInsights}</p>
                                        <p className="text-sm text-text leading-relaxed italic">"{activeAnalysis.breakthroughs?.uniqueInsights || 'N/A'}"</p>
                                    </div>
                                    <div className="border-l border-border/50 pl-lg">
                                        <p className="text-[10px] font-black uppercase text-accent/70 mb-2">{t.collectAnalyze.breakthroughs.humanExperienceEEAT}</p>
                                        <p className="text-sm text-text leading-relaxed italic">"{activeAnalysis.breakthroughs?.humanExperienceEEAT || 'N/A'}"</p>
                                    </div>
                                    <div className="border-l border-border/50 pl-lg">
                                        <p className="text-[10px] font-black uppercase text-success/70 mb-2">{t.collectAnalyze.breakthroughs.hcuExploitation}</p>
                                        <p className="text-sm text-text leading-relaxed italic">"{activeAnalysis.breakthroughs?.hcuExploitation || 'N/A'}"</p>
                                    </div>
                                </div>
                            </Card>

                            {/* Sources */}
                            {activeAnalysis.sources && activeAnalysis.sources.length > 0 && (
                                <Card>
                                    <h4 className="font-bold text-sm mb-4 text-muted uppercase tracking-widest">{t.collectAnalyze.sources}</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {activeAnalysis.sources.map((s, i) => (
                                            <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-bg border border-border rounded-full hover:border-primary hover:text-primary transition-colors truncate max-w-[250px]">
                                                {s.title}
                                            </a>
                                        ))}
                                    </div>
                                </Card>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <h3 className="text-lg font-bold mb-md text-text uppercase flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                        {t.collectAnalyze.historyTitle}
                    </h3>
                    <div className="space-y-sm max-h-[85vh] overflow-y-auto pr-sm custom-scrollbar pb-10">
                    {analysesForKeywords.length === 0 ? (
                        <p className="text-sm text-muted italic p-md bg-panel rounded-lg border border-dashed border-border">{t.persona.emptyHistory}</p>
                    ) : (
                        analysesForKeywords.map((a: Analysis) => (
                                <Card 
                                key={a.id}
                                onClick={() => setActiveId('analysisId', a.id)}
                                className={`border-2 cursor-pointer transition-all hover:translate-x-1 ${activeIds.analysisId === a.id ? 'border-primary bg-primary/5 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'}`}
                            >
                                <p className="font-bold text-text truncate text-sm leading-tight">{a.summary}</p>
                                <p className="text-[9px] text-muted mt-2 font-mono font-bold uppercase">{new Date(a.createdAt).toLocaleString()}</p>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
            <PageNavigation />
        </div>
    );
};
