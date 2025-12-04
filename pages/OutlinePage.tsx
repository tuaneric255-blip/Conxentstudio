
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/EmptyState';
import { OutlineIcon } from '../components/icons/Icons';
import { Persona, Analysis, Outline, ID } from '../types';
import { useTranslations } from '../i18n';
import { ContextSelector } from '../components/ContextSelector';

export const OutlinePage: React.FC = () => {
    const t = useTranslations();
    const activeIds = useAppStore(state => state.activeIds);
    const setActiveId = useAppStore(state => state.setActiveId);
    const addOutline = useAppStore(state => state.addOutline);
    const addToast = useAppStore(state => state.addToast);
    const language = useAppStore(state => state.language);
    
    const personasMap = useAppStore(state => state.data.personas);
    const personas = useMemo(() => Object.values(personasMap) as Persona[], [personasMap]);
    const activePersona = activeIds.personaId ? personasMap[activeIds.personaId] : null;
    
    const analysesMap = useAppStore(state => state.data.analyses);
    const analyses = useMemo(() => Object.values(analysesMap) as Analysis[], [analysesMap]);
    const activeAnalysis = activeIds.analysisId ? analysesMap[activeIds.analysisId] : null;

    const analysesForSelector = useMemo(() => 
        analyses.map(a => ({ id: a.id, summary: typeof a.summary === 'string' ? a.summary : JSON.stringify(a.summary) })),
        [analyses]
    );

    const activeTitle = useAppStore(state => activeIds.titleId && activeIds.titleSetId ? state.data.titleSets[activeIds.titleSetId].options.find(o => o.id === activeIds.titleId) : null);
    const activeMetaDescription = useAppStore(state => activeIds.metaDescriptionId && activeIds.metaDescriptionSetId ? state.data.metaDescriptionSets[activeIds.metaDescriptionSetId].options.find(o => o.id === activeIds.metaDescriptionId) : null);

    const activeKeywordSet = useAppStore(state => activeIds.keywordSetId ? state.data.keywordSets[activeIds.keywordSetId] : null);
    const activeKeyword = useMemo(() => {
        const keywordIds = activeIds.keywordIds || [];
        if (!activeKeywordSet || keywordIds.length === 0) return null;
        return activeKeywordSet.items.find(k => k.id === keywordIds[0]) || null;
    }, [activeKeywordSet, activeIds.keywordIds]);

    const activeObjectiveSet = useAppStore(state => activeIds.objectiveSetId ? state.data.objectiveSets[activeIds.objectiveSetId] : null);
    const activeObjectives = useMemo(() => {
        if (!activeObjectiveSet || !activeIds.objectiveIds) return [];
        return activeObjectiveSet.options.filter(opt => activeIds.objectiveIds?.includes(opt.id)).map(o => o.description);
    }, [activeObjectiveSet, activeIds.objectiveIds]);


    const outlinesMap = useAppStore(state => state.data.outlines);
    const outlinesForContext = useMemo(() =>
        Object.values(outlinesMap).filter((o: Outline) => o.analysisId === activeIds.analysisId && o.personaId === activeIds.personaId)
         .sort((a: Outline, b: Outline) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [outlinesMap, activeIds.analysisId, activeIds.personaId]
    );

    const activeOutline = activeIds.outlineId ? outlinesMap[activeIds.outlineId] : null;

    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!activePersona || !activeAnalysis || !activeTitle || !activeMetaDescription || !activeKeyword) {
            addToast({ type: 'warning', message: t.toasts.selectPersonaAnalysisFirst }); // General warning
            return;
        }
        setIsLoading(true);
        const result = await geminiService.generateOutline(
            activeAnalysis, 
            activePersona, 
            activeTitle.title, 
            activeMetaDescription.description, 
            activeObjectives,
            activeKeyword,
            language
        );
        setIsLoading(false);
        if (result && result.sections) {
            addOutline({ sections: result.sections, analysisId: activeAnalysis.id, personaId: activePersona.id });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate(t.outline.outline) });
        }
    };
    
    return (
        <div>
            <Header title={t.outline.title} description={t.outline.description}>
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!activePersona || !activeAnalysis || !activeTitle || !activeMetaDescription || !activeKeyword}>
                    {t.outline.generateButton}
                </Button>
            </Header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-lg">
                <ContextSelector<Persona>
                    label={t.seoKeywords.personaLabel}
                    items={personas}
                    selectedId={activeIds.personaId}
                    onSelect={(id: ID) => setActiveId('personaId', id)}
                    missingMessage={t.seoKeywords.personaMissing}
                />
                <ContextSelector<{id: ID, summary: string}>
                    label={t.objectives.activeAnalysis}
                    items={analysesForSelector}
                    selectedId={activeIds.analysisId}
                    onSelect={(id: ID) => setActiveId('analysisId', id)}
                    missingMessage={t.objectives.noAnalysis}
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-md">{t.outline.generatedOutline}</h3>
                     {!activeOutline && !isLoading && (
                        <EmptyState
                            Icon={OutlineIcon}
                            title={t.outline.emptyTitle}
                            message={t.outline.emptyMessage}
                        />
                    )}
                    {isLoading && <p>{t.outline.generating}</p>}
                    {activeOutline && (
                        <Card>
                            <div className="space-y-md">
                                {Array.isArray(activeOutline.sections) && activeOutline.sections.map((section, index) => (
                                    <div key={index} className="pb-md border-b border-border last:border-b-0">
                                        <h4 className="font-bold text-lg mb-sm text-text">{section.h2}</h4>
                                        <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                            {section.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>
                <div>
                     <h3 className="text-lg font-semibold mb-md">{t.outline.historyTitle}</h3>
                     {outlinesForContext.length === 0 && <p className="text-sm text-muted">{t.persona.emptyHistory}</p>}
                     <div className="space-y-sm max-h-[60vh] overflow-y-auto pr-sm">
                        {outlinesForContext.map((o: Outline) => (
                             <Card 
                                key={o.id}
                                onClick={() => setActiveId('outlineId', o.id)}
                                className={`border-2 ${activeIds.outlineId === o.id ? 'border-primary' : 'border-transparent'}`}
                            >
                                <p className="font-semibold text-text">{t.outline.sectionsCount(Array.isArray(o.sections) ? o.sections.length : 0)}</p>
                                <p className="text-xs text-muted mt-1">{new Date(o.createdAt).toLocaleString()}</p>
                            </Card>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};
