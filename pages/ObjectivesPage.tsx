import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/EmptyState';
import { TargetIcon } from '../components/icons/Icons';
import { ObjectiveOption, ObjectiveSet } from '../types';
import { useTranslations } from '../i18n';
import { uuidv4 } from '../utils';

export const ObjectivesPage: React.FC = () => {
    const t = useTranslations();
    const activeIds = useAppStore(state => state.activeIds);
    const setActiveId = useAppStore(state => state.setActiveId);
    const addToast = useAppStore(state => state.addToast);
    const language = useAppStore(state => state.language);
    const addObjectiveSet = useAppStore(state => state.addObjectiveSet);
    
    const activeAnalysis = useAppStore(state => activeIds.analysisId ? state.data.analyses[activeIds.analysisId] : null);
    
    const objectiveSetsMap = useAppStore(state => state.data.objectiveSets);
    const objectiveSetsForAnalysis = useMemo(() =>
        Object.values(objectiveSetsMap)
            .filter((os: ObjectiveSet) => os.analysisId === activeIds.analysisId)
            .sort((a: ObjectiveSet, b: ObjectiveSet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [objectiveSetsMap, activeIds.analysisId]
    );

    const activeObjectiveSet = activeIds.objectiveSetId ? objectiveSetsMap[activeIds.objectiveSetId] : null;
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!activeAnalysis) {
            addToast({ type: 'warning', message: t.toasts.selectAnalysisFirst });
            return;
        }
        setIsLoading(true);
        const analysisString = JSON.stringify(activeAnalysis);
        const result = await geminiService.generateObjectives(analysisString, language);
        setIsLoading(false);
        if (result && result.options) {
            const optionsWithIds: ObjectiveOption[] = result.options.map(opt => ({ ...opt, id: uuidv4() }));
            addObjectiveSet({ options: optionsWithIds, analysisId: activeAnalysis.id });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate(t.objectives.objectives) });
        }
    };

    const handleToggleObjective = (id: string) => {
        const currentSelectedIds = activeIds.objectiveIds || [];
        const newSelectedIds = new Set(currentSelectedIds);
        if (newSelectedIds.has(id)) {
            newSelectedIds.delete(id);
        } else {
            newSelectedIds.add(id);
        }
        setActiveId('objectiveIds', Array.from(newSelectedIds));
    };

    return (
        <div>
            <Header title={t.objectives.title} description={t.objectives.description}>
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!activeAnalysis}>
                    {t.objectives.generateButton}
                </Button>
            </Header>

            <div className="mb-lg">
                <Card>
                    <h4 className="font-bold text-lg mb-sm">{t.objectives.activeAnalysis}</h4>
                    {activeAnalysis ? <p className="text-muted text-sm line-clamp-2">{activeAnalysis.summary}</p> : <p className="text-warning text-sm">{t.objectives.noAnalysis}</p>}
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-md">{t.objectives.generatedObjectives}</h3>
                     {!activeObjectiveSet && !isLoading && (
                        <EmptyState
                            Icon={TargetIcon}
                            title={t.objectives.emptyTitle}
                            message={t.objectives.emptyMessage}
                        />
                    )}
                    {isLoading && <p>{t.objectives.generating}</p>}
                    {activeObjectiveSet && (
                        <div className="space-y-md">
                            {Array.isArray(activeObjectiveSet.options) && activeObjectiveSet.options.map(opt => (
                                <Card 
                                    key={opt.id}
                                    onClick={() => handleToggleObjective(opt.id)}
                                    className={`border-2 ${(activeIds.objectiveIds || []).includes(opt.id) ? 'border-primary' : 'border-transparent'}`}
                                >
                                    <div className="flex justify-between items-start gap-md">
                                        <div className="flex-1">
                                            <p className="font-semibold text-text">{opt.description}</p>
                                            <p className="text-xs text-muted mt-2"><span className="font-bold">{t.objectives.rationale}:</span> {opt.rationale}</p>
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-lg text-primary flex-shrink-0">{opt.score}/10</span>
                                            <span className="text-xs font-semibold text-muted">{t.objectives.score}</span>
                                        </div>
                                    </div>
                                    {(activeIds.objectiveIds || []).includes(opt.id) && <span className="mt-sm text-xs bg-primary/20 text-primary font-bold py-1 px-2 rounded-full self-start">{t.active}</span>}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                     <h3 className="text-lg font-semibold mb-md">{t.objectives.historyTitle}</h3>
                     {objectiveSetsForAnalysis.length === 0 && <p className="text-sm text-muted">{t.persona.emptyHistory}</p>}
                     <div className="space-y-sm max-h-[60vh] overflow-y-auto pr-sm">
                        {objectiveSetsForAnalysis.map((os: ObjectiveSet) => (
                             <Card 
                                key={os.id}
                                onClick={() => setActiveId('objectiveSetId', os.id)}
                                className={`border-2 ${activeIds.objectiveSetId === os.id ? 'border-primary' : 'border-transparent'}`}
                            >
                                <p className="font-semibold text-text">{t.objectives.objectiveSet(Array.isArray(os.options) ? os.options.length : 0)}</p>
                                <p className="text-xs text-muted mt-1">{new Date(os.createdAt).toLocaleString()}</p>
                            </Card>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};