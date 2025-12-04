
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/EmptyState';
import { CtaIcon } from '../components/icons/Icons';
import { CtaOption, CtaSet } from '../types';
import { uuidv4 } from '../utils';
import { useTranslations } from '../i18n';

export const CtaPage: React.FC = () => {
    const t = useTranslations();
    const activeIds = useAppStore(state => state.activeIds);
    const setActiveId = useAppStore(state => state.setActiveId);
    const addCtaSet = useAppStore(state => state.addCtaSet);
    const addToast = useAppStore(state => state.addToast);
    const language = useAppStore(state => state.language);

    const activeObjectiveSet = useAppStore(state => activeIds.objectiveSetId ? state.data.objectiveSets[activeIds.objectiveSetId] : null);
    const activeObjectives = useMemo(() => {
        if (!activeObjectiveSet || !activeIds.objectiveIds) return [];
        return activeObjectiveSet.options.filter(opt => activeIds.objectiveIds?.includes(opt.id));
    }, [activeObjectiveSet, activeIds.objectiveIds]);

    const activePersona = useAppStore(state => activeIds.personaId ? state.data.personas[activeIds.personaId] : null);
    
    const activeSapoSet = useAppStore(state => activeIds.sapoSetId ? state.data.sapoSets[activeIds.sapoSetId] : null);
    const activeSapo = useMemo(() =>
        activeSapoSet && activeIds.sapoId ? activeSapoSet.options.find(s => s.id === activeIds.sapoId) : null,
        [activeSapoSet, activeIds.sapoId]
    );

    const ctaSetsMap = useAppStore(state => state.data.ctaSets);
    const ctaSetsForSapo = useMemo(() =>
        Object.values(ctaSetsMap).filter((cs: CtaSet) => cs.sapoId === activeIds.sapoId)
         .sort((a: CtaSet, b: CtaSet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [ctaSetsMap, activeIds.sapoId]
    );

    const activeCtaSet = activeIds.ctaSetId ? ctaSetsMap[activeIds.ctaSetId] : null;
    const selectedCtaIds = useMemo(() => new Set(activeIds.ctaIds || []), [activeIds.ctaIds]);

    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!activeSapo || activeObjectives.length === 0 || !activePersona) {
            addToast({ type: 'warning', message: t.toasts.selectSapoFirst });
            return;
        }
        setIsLoading(true);
        const objectivesList = activeObjectives.map(o => o.description);
        const result = await geminiService.generateCtas(objectivesList, activePersona.summary, language);
        setIsLoading(false);
        if (result && result.options) {
            const optionsWithIds: CtaOption[] = result.options.map(opt => ({ ...opt, id: uuidv4() }));
            addCtaSet({ 
                options: optionsWithIds, 
                sapoId: activeSapo.id,
            });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate('CTAs') });
        }
    };

    const handleToggleCta = (id: string) => {
        const newSet = new Set(selectedCtaIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        
        const newArray = Array.from(newSet);
        setActiveId('ctaIds', newArray);
        // Set primary to the first one selected, or undefined if none
        setActiveId('ctaId', newArray.length > 0 ? newArray[0] : undefined);
    };
    
    return (
        <div>
            <Header title={t.cta.title} description={t.cta.description}>
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!activeSapo || activeObjectives.length === 0}>
                    {t.cta.generateButton}
                </Button>
            </Header>

            {!activeSapo || activeObjectives.length === 0 ? (
                <div className="text-warning bg-warning/10 border border-warning/20 p-md rounded-md">
                    {t.cta.noContextWarning}
                </div>
            ) : (
                <div className="mb-md p-sm bg-panel rounded-md space-y-2 border border-border">
                    <p className="text-sm font-semibold">{t.titles.selectedObjectives}:</p>
                    <ul className="list-disc list-inside text-xs text-muted">
                        {activeObjectives.map(obj => <li key={obj.id}>{obj.description}</li>)}
                    </ul>
                </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-md">{t.cta.generatedCtas}</h3>

                    {!activeCtaSet && !isLoading && (
                        <EmptyState
                            Icon={CtaIcon}
                            title={t.cta.emptyTitle}
                            message={t.cta.emptyMessage}
                        />
                    )}
                    {isLoading && <p>{t.cta.generating}</p>}

                    {activeCtaSet && (
                        <div className="space-y-md">
                            {Array.isArray(activeCtaSet.options) && activeCtaSet.options.map(opt => (
                                <Card 
                                    key={opt.id} 
                                    className={`flex flex-col justify-between border-2 cursor-pointer ${selectedCtaIds.has(opt.id) ? 'border-primary' : 'border-transparent'}`}
                                    onClick={() => handleToggleCta(opt.id)}
                                >
                                    <div className="flex items-start gap-sm">
                                        <div className="mt-1">
                                            <input 
                                                type="checkbox"
                                                checked={selectedCtaIds.has(opt.id)}
                                                readOnly
                                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                            />
                                        </div>
                                        <div>
                                            <p className="font-medium text-text mb-sm">"{opt.content}"</p>
                                            <p className="text-sm text-muted italic">{opt.rationale}</p>
                                        </div>
                                    </div>
                                    {activeIds.ctaId === opt.id && <span className="mt-sm text-xs bg-primary/20 text-primary font-bold py-1 px-2 rounded-full self-start">Primary</span>}
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                     <h3 className="text-lg font-semibold mb-md">{t.persona.historyTitle}</h3>
                     {ctaSetsForSapo.length === 0 && <p className="text-sm text-muted">{t.persona.emptyHistory}</p>}
                     <div className="space-y-sm max-h-[60vh] overflow-y-auto pr-sm">
                        {ctaSetsForSapo.map((cs: CtaSet) => (
                             <Card 
                                key={cs.id}
                                onClick={() => setActiveId('ctaSetId', cs.id)}
                                className={`border-2 ${activeIds.ctaSetId === cs.id ? 'border-primary' : 'border-transparent'}`}
                            >
                                <p className="font-semibold text-text">{Array.isArray(cs.options) ? cs.options.length : 0} CTAs</p>
                                <p className="text-xs text-muted mt-1">{new Date(cs.createdAt).toLocaleString()}</p>
                            </Card>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};
