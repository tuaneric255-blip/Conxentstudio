

import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ContextSelector } from '../components/ContextSelector';
import { EmptyState } from '../components/EmptyState';
import { PersonaIcon } from '../components/icons/Icons';
import { ProductInfo, Persona, PersonaModel, CustomerJourneyMapStage } from '../types';
import { useTranslations } from '../i18n';

export const PersonaPage: React.FC = () => {
    const t = useTranslations();
    const activeIds = useAppStore(state => state.activeIds);
    const setActiveId = useAppStore(state => state.setActiveId);
    const addPersona = useAppStore(state => state.addPersona);
    const addToast = useAppStore(state => state.addToast);
    const language = useAppStore(state => state.language);
    
    const productsMap = useAppStore(state => state.data.products);
    const products = useMemo(() => Object.values(productsMap) as ProductInfo[], [productsMap]);
    const activeProduct = activeIds.productId ? productsMap[activeIds.productId] : null;

    const personasMap = useAppStore(state => state.data.personas);
    const personasForProduct = useMemo(() =>
        Object.values(personasMap).filter((p: Persona) => p.productId === activeIds.productId)
          .sort((a: Persona, b: Persona) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    , [personasMap, activeIds.productId]);

    const activePersona = activeIds.personaId ? personasMap[activeIds.personaId] : null;

    const [isLoading, setIsLoading] = useState(false);
    const [selectedModels, setSelectedModels] = useState<PersonaModel[]>(['standard']);

    const allModels: PersonaModel[] = ['standard', 'empathy', 'value-prop', 'jtbd', 'journey', 'mental'];

    const handleModelToggle = (model: PersonaModel) => {
        setSelectedModels(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(model)) {
                if (newSelection.size > 1) {
                    newSelection.delete(model);
                }
            } else {
                newSelection.add(model);
            }
            return Array.from(newSelection);
        });
    };

    const handleGenerate = async () => {
        if (!activeProduct) {
            addToast({ type: 'warning', message: t.toasts.selectProductFirst });
            return;
        }
        if (selectedModels.length === 0) {
            addToast({ type: 'warning', message: t.toasts.selectPersonaModel });
            return;
        }
        setIsLoading(true);
        const productInfoString = `Name: ${activeProduct.name}\nPrice: ${activeProduct.price || 'N/A'}\nDesired Outcome: ${activeProduct.desiredOutcome || 'N/A'}`;
        
        const result = await geminiService.generatePersona(productInfoString, selectedModels, language);
        setIsLoading(false);
        if (result && result.summary) {
            const newPersona: Omit<Persona, 'id' | 'createdAt'> = {
                productId: activeProduct.id,
                summary: result.summary,
                models: selectedModels,
                details: result.details,
                empathyMap: result.empathyMap,
                valueProposition: result.valueProposition,
                jtbd: result.jtbd,
                journey: result.journey,
                mentalModel: result.mentalModel
            };
            addPersona(newPersona);
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate('persona') });
        }
    };

    const memoizedPersonaDetails = useMemo(() => {
        if (!activePersona) return null;
        return (
            <>
                {activePersona.details && (
                    <div className="mb-md pb-md border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                        <h5 className="font-bold text-base mb-sm text-accent">{t.persona.models.standard}</h5>
                        <div className="space-y-md">
                            <div>
                                <h5 className="font-semibold text-text mb-xs">{t.persona.demographics}</h5>
                                <p className="text-muted text-sm">{activePersona.details?.demographics}</p>
                            </div>
                            <div>
                                <h5 className="font-semibold text-text mb-xs">{t.persona.goals}</h5>
                                <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                    {Array.isArray(activePersona.details?.goals) && activePersona.details.goals.map((goal, i) => <li key={i}>{goal}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-semibold text-text mb-xs">{t.persona.challenges}</h5>
                                <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                    {Array.isArray(activePersona.details?.challenges) && activePersona.details.challenges.map((c, i) => <li key={i}>{c}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
                {activePersona.empathyMap && (
                     <div className="mb-md pb-md border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                        <h5 className="font-bold text-base mb-sm text-accent">{t.persona.models.empathy}</h5>
                        <div className="space-y-md">
                            {Object.entries(activePersona.empathyMap || {}).map(([key, value]) => (
                                <div key={key}>
                                    <h5 className="font-semibold text-text mb-xs capitalize">{t.persona.empathyMap[key as keyof typeof t.persona.empathyMap]}</h5>
                                    <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                        {Array.isArray(value) && value.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activePersona.valueProposition && (
                     <div className="mb-md pb-md border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                        <h5 className="font-bold text-base mb-sm text-accent">{t.persona.models['value-prop']}</h5>
                        <div className="space-y-md">
                            {Object.entries(activePersona.valueProposition || {}).map(([key, value]) => (
                                <div key={key}>
                                    <h5 className="font-semibold text-text mb-xs capitalize">{t.persona.valueProp[key as keyof typeof t.persona.valueProp]}</h5>
                                    <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                        {Array.isArray(value) && value.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activePersona.jtbd && (
                    <div className="mb-md pb-md border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                        <h5 className="font-bold text-base mb-sm text-accent">{t.persona.jtbd.title}</h5>
                        <div className="space-y-md">
                            <div>
                                <h5 className="font-semibold text-text mb-xs">{t.persona.jtbd.jobStatement}</h5>
                                <p className="text-muted text-sm italic">"{activePersona.jtbd.jobStatement}"</p>
                            </div>
                            <div>
                                <h5 className="font-semibold text-text mb-xs">{t.persona.jtbd.functionalAspects}</h5>
                                <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                    {Array.isArray(activePersona.jtbd.functionalAspects) && activePersona.jtbd.functionalAspects.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-semibold text-text mb-xs">{t.persona.jtbd.emotionalAspects}</h5>
                                <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                    {Array.isArray(activePersona.jtbd.emotionalAspects) && activePersona.jtbd.emotionalAspects.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-semibold text-text mb-xs">{t.persona.jtbd.socialAspects}</h5>
                                <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                    {Array.isArray(activePersona.jtbd.socialAspects) && activePersona.jtbd.socialAspects.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}
                {activePersona.journey && (
                    <div className="mb-md pb-md border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                        <h5 className="font-bold text-base mb-sm text-accent">{t.persona.journey.title}</h5>
                        <div className="space-y-md">
                            {Object.entries(activePersona.journey || {}).map(([stage, details]: [string, CustomerJourneyMapStage]) => (
                                <div key={stage}>
                                    <h5 className="font-semibold text-text mb-sm capitalize">{t.persona.journey[stage as keyof typeof t.persona.journey]}</h5>
                                    <div className="pl-sm border-l-2 border-border ml-sm space-y-sm">
                                        <div>
                                            <h6 className="font-medium text-text text-sm mb-xs">{t.persona.journey.actions}</h6>
                                            <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                                {Array.isArray(details?.actions) && details.actions.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                            <h6 className="font-medium text-text text-sm mb-xs">{t.persona.journey.painPoints}</h6>
                                             <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                                {Array.isArray(details?.painPoints) && details.painPoints.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                            </ul>
                                        </div>
                                        <div>
                                             <h6 className="font-medium text-text text-sm mb-xs">{t.persona.journey.opportunities}</h6>
                                             <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                                {Array.isArray(details?.opportunities) && details.opportunities.map((item: string, i: number) => <li key={i}>{item}</li>)}
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                {activePersona.mentalModel && (
                    <div className="mb-md pb-md border-b border-border last:border-b-0 last:mb-0 last:pb-0">
                        <h5 className="font-bold text-base mb-sm text-accent">{t.persona.mentalModel.title}</h5>
                        <div className="space-y-md">
                            <div>
                                <h5 className="font-semibold text-text mb-xs">{t.persona.mentalModel.coreBeliefs}</h5>
                                <ul className="list-disc list-inside text-muted text-sm space-y-xs">
                                    {Array.isArray(activePersona.mentalModel.coreBeliefs) && activePersona.mentalModel.coreBeliefs.map((item, i) => <li key={i}>{item}</li>)}
                                </ul>
                            </div>
                            <div>
                                <h5 className="font-semibold text-text mb-xs">{t.persona.mentalModel.thoughtProcess}</h5>
                                <p className="text-muted text-sm">{activePersona.mentalModel.thoughtProcess}</p>
                            </div>
                            <div>
                                <h5 className="font-semibold text-text mb-xs">{t.persona.mentalModel.informationStructure}</h5>
                                <p className="text-muted text-sm">{activePersona.mentalModel.informationStructure}</p>
                            </div>
                        </div>
                    </div>
                )}
            </>
        );
    }, [activePersona, t]);


    return (
        <div>
            <Header title={t.persona.title} description={t.persona.description}>
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!activeProduct}>
                    {t.persona.generateButton}
                </Button>
            </Header>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md mb-lg">
                <ContextSelector<ProductInfo>
                    label={t.persona.productLabel}
                    items={products}
                    selectedId={activeIds.productId}
                    onSelect={(id) => setActiveId('productId', id)}
                    missingMessage={t.persona.productMissing}
                />
                <div>
                    <label className="block text-sm font-medium text-muted mb-2">{t.persona.model}</label>
                    <div className="flex flex-wrap gap-2">
                        {allModels.map(model => (
                            <Button
                                key={model}
                                variant={selectedModels.includes(model) ? 'primary' : 'secondary'}
                                onClick={() => handleModelToggle(model)}
                                size="sm"
                            >
                                {t.persona.models[model]}
                            </Button>
                        ))}
                    </div>
                    <p className="text-xs text-muted mt-2">{t.persona.modelHelper}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-md">{t.persona.generatedFor(activeProduct?.name || '...')}</h3>
                     {!activePersona && !isLoading && (
                        <EmptyState
                            Icon={PersonaIcon}
                            title={t.persona.emptyTitle}
                            message={t.persona.emptyMessage}
                        />
                    )}
                    {isLoading && <p>{t.persona.generating}</p>}
                    {activePersona && (
                        <Card>
                            <h4 className="font-bold text-lg mb-sm">{t.persona.summary}</h4>
                            <p className="text-muted text-sm mb-md">{activePersona.summary}</p>
                            
                            <h4 className="font-bold text-lg mb-sm">{t.persona.details}</h4>
                            {memoizedPersonaDetails}
                        </Card>
                    )}
                </div>
                <div>
                     <h3 className="text-lg font-semibold mb-md">{t.persona.historyTitle}</h3>
                     {personasForProduct.length === 0 && <p className="text-sm text-muted">{t.persona.emptyHistory}</p>}
                     <div className="space-y-sm max-h-[60vh] overflow-y-auto pr-sm">
                        {personasForProduct.map((p: Persona) => (
                             <Card 
                                key={p.id}
                                onClick={() => setActiveId('personaId', p.id)}
                                className={`border-2 ${activeIds.personaId === p.id ? 'border-primary' : 'border-transparent'}`}
                            >
                                <div className="flex justify-between items-start">
                                    <p className="font-semibold text-text truncate pr-2">{p.summary}</p>
                                    <span className="text-xs bg-accent/20 text-accent font-bold py-1 px-2 rounded-full flex-shrink-0 text-center">
                                        {p.models.map(m => t.persona.models[m]).join(' + ')}
                                    </span>
                                </div>
                                <p className="text-xs text-muted mt-1">{new Date(p.createdAt).toLocaleString()}</p>
                            </Card>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};