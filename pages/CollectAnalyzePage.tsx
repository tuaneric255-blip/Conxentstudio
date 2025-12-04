import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/EmptyState';
import { AnalyzeIcon } from '../components/icons/Icons';
import { Keyword, Analysis, Persona, ID } from '../types';
import { useTranslations } from '../i18n';
import { Textarea } from '../components/ui/Textarea';

const areSetsEqual = (a: Set<ID>, b: Set<ID>): boolean => {
    if (a.size !== b.size) return false;
    for (const item of a) {
        if (!b.has(item)) return false;
    }
    return true;
};

export const CollectAnalyzePage: React.FC = () => {
    const t = useTranslations();
    const activeIds = useAppStore(state => state.activeIds);
    const setActiveId = useAppStore(state => state.setActiveId);
    const addAnalysis = useAppStore(state => state.addAnalysis);
    const addToast = useAppStore(state => state.addToast);
    const language = useAppStore(state => state.language);
    
    const activePersona = useAppStore(state => activeIds.personaId ? state.data.personas[activeIds.personaId] : null);
    const activeKeywordSet = useAppStore(state => activeIds.keywordSetId ? state.data.keywordSets[activeIds.keywordSetId] : null);
    const activeKeywordIds = useMemo(() => new Set<ID>(activeIds.keywordIds || []), [activeIds.keywordIds]);
    
    const activeKeywords: Keyword[] = useMemo(() => {
        if (!activeKeywordSet || activeKeywordIds.size === 0) return [];
        return activeKeywordSet.items.filter(k => activeKeywordIds.has(k.id));
    }, [activeKeywordSet, activeKeywordIds]);
    
    const analysesMap = useAppStore(state => state.data.analyses);
    const analysesForKeywords = useMemo(() =>
        Object.values(analysesMap)
         .filter((a: Analysis) => Array.isArray(a.keywordIds) && areSetsEqual(new Set(a.keywordIds), activeKeywordIds))
         .sort((a: Analysis, b: Analysis) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [analysesMap, activeKeywordIds]
    );

    const activeAnalysis = activeIds.analysisId ? analysesMap[activeIds.analysisId] : null;

    const objectives = useMemo(() => activeAnalysis?.objectives || [], [activeAnalysis]);
    const contentGaps = useMemo(() => activeAnalysis?.contentGaps || [], [activeAnalysis]);
    const creativeIdeas = useMemo(() => activeAnalysis?.creativeIdeas || [], [activeAnalysis]);


    const [isLoading, setIsLoading] = useState(false);
    const [manualContent, setManualContent] = useState('');

    const handleWebAnalyze = async () => {
        if (!activePersona || activeKeywords.length === 0) {
            addToast({ type: 'warning', message: t.toasts.selectKeywordFirst });
            return;
        }
        setIsLoading(true);
        const result = await geminiService.analyzeWebForKeywords(activeKeywords.map(k => k.term), activePersona.summary, language);
        setIsLoading(false);
        if (result) {
            addAnalysis({ ...result, keywordIds: Array.from(activeKeywordIds) });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate('analysis') });
        }
    };

    const handleManualAnalyze = async () => {
        if (!activePersona || activeKeywords.length === 0 || !manualContent) {
            addToast({ type: 'warning', message: 'Please select keywords and provide content to analyze.' });
            return;
        }
        setIsLoading(true);
        const result = await geminiService.generateManualAnalysis(manualContent, activeKeywords.map(k => k.term), activePersona.summary, language);
        setIsLoading(false);
        if (result) {
            addAnalysis({ ...result, sources: [], keywordIds: Array.from(activeKeywordIds) });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate('analysis') });
        }
    };
    
    return (
        <div>
            <Header title={t.collectAnalyze.title} description={t.collectAnalyze.description} />
            
            <div className="mb-lg">
                 {activeKeywords.length === 0 ? (
                    <div className="text-warning bg-warning/10 border border-warning/20 p-md rounded-md">
                        {t.collectAnalyze.keywordMissing}
                    </div>
                 ) : (
                    <Card>
                        <h4 className="font-bold text-lg">{t.collectAnalyze.activeKeywords}: <span className="text-primary">{activeKeywords.map(k => k.term).join(', ')}</span></h4>
                    </Card>
                 )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-md">{t.collectAnalyze.analysisFor(activeKeywords.map(k=>k.term).join(', ') || '...')}</h3>
                     {!activeAnalysis && !isLoading && (
                        <EmptyState
                            Icon={AnalyzeIcon}
                            title={t.collectAnalyze.emptyTitle}
                            message={t.collectAnalyze.emptyMessage}
                        />
                    )}
                    {isLoading && <p>{t.collectAnalyze.generating}</p>}
                    {activeAnalysis && (
                        <div className="space-y-md">
                            <Card>
                                <h4 className="font-bold text-lg mb-sm">{t.collectAnalyze.summary}</h4>
                                <p className="text-muted text-sm">{activeAnalysis.summary}</p>
                            </Card>
                            <Card>
                                <h4 className="font-bold text-lg mb-sm">{t.collectAnalyze.objectives}</h4>
                                <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                    {objectives.map((topic, i) => <li key={i}>{topic}</li>)}
                                </ul>
                            </Card>
                            <Card>
                                <h4 className="font-bold text-lg mb-sm">{t.collectAnalyze.contentGaps}</h4>
                                <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                    {contentGaps.map((gap, i) => <li key={i}>{gap}</li>)}
                                </ul>
                            </Card>
                            <Card>
                                <h4 className="font-bold text-lg mb-sm">{t.collectAnalyze.creativeIdeas}</h4>
                                <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                    {creativeIdeas.map((idea, i) => <li key={i}>{idea}</li>)}
                                </ul>
                            </Card>
                            <Card>
                                <h4 className="font-bold text-lg mb-sm">{t.collectAnalyze.breakthroughs.title}</h4>
                                <div className="space-y-md">
                                    <div>
                                        <h5 className="font-semibold text-text mb-xs">{t.collectAnalyze.breakthroughs.uniqueInsights}</h5>
                                        <p className="text-muted text-sm">{activeAnalysis.breakthroughs?.uniqueInsights}</p>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-text mb-xs">{t.collectAnalyze.breakthroughs.humanExperienceEEAT}</h5>
                                        <p className="text-muted text-sm">{activeAnalysis.breakthroughs?.humanExperienceEEAT}</p>
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-text mb-xs">{t.collectAnalyze.breakthroughs.hcuExploitation}</h5>
                                        <p className="text-muted text-sm">{activeAnalysis.breakthroughs?.hcuExploitation}</p>
                                    </div>
                                </div>
                            </Card>
                             <Card>
                                <h4 className="font-bold text-lg mb-sm">{t.collectAnalyze.sources}</h4>
                                <div className="space-y-sm">
                                    {(activeAnalysis.sources || []).length > 0 ? (
                                        (activeAnalysis.sources || []).map((item, i) => (
                                            <div key={i} className="text-sm">
                                                <a href={item.uri} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">{item.title}</a>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted">{t.collectAnalyze.noSources}</p>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
                <div>
                    <div className="mb-lg">
                        <h3 className="text-lg font-semibold mb-md">{t.collectAnalyze.webAnalysis}</h3>
                        <Button onClick={handleWebAnalyze} isLoading={isLoading} disabled={activeKeywords.length === 0 || !activePersona}>
                            {t.collectAnalyze.analyzeButton}
                        </Button>
                    </div>

                    <div className="mb-lg">
                        <h3 className="text-lg font-semibold mb-md">{t.collectAnalyze.manualAnalysis}</h3>
                        <div className="space-y-md">
                           <Textarea 
                                label={t.collectAnalyze.manualInputLabel}
                                id="manual-content"
                                value={manualContent}
                                onChange={(e) => setManualContent(e.target.value)}
                                placeholder={t.collectAnalyze.manualInputPlaceholder}
                                rows={8}
                           />
                           <Button onClick={handleManualAnalyze} isLoading={isLoading} disabled={activeKeywords.length === 0 || !activePersona || !manualContent} variant="secondary">
                                {t.collectAnalyze.manualAnalyzeButton}
                            </Button>
                        </div>
                    </div>

                    <h3 className="text-lg font-semibold mb-md">{t.collectAnalyze.historyTitle}</h3>
                    {analysesForKeywords.length === 0 && <p className="text-sm text-muted">{t.persona.emptyHistory}</p>}
                    <div className="space-y-sm max-h-[40vh] overflow-y-auto pr-sm">
                    {analysesForKeywords.map((a: Analysis) => (
                            <Card 
                            key={a.id}
                            onClick={() => setActiveId('analysisId', a.id)}
                            className={`border-2 ${activeIds.analysisId === a.id ? 'border-primary' : 'border-transparent'}`}
                        >
                            <p className="font-semibold text-text truncate">{a.summary}</p>
                            <p className="text-xs text-muted mt-1">{new Date(a.createdAt).toLocaleString()}</p>
                        </Card>
                    ))}
                    </div>
                </div>
            </div>
        </div>
    );
};