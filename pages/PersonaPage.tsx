
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ContextSelector } from '../components/ContextSelector';
import { EmptyState } from '../components/EmptyState';
import { PersonaIcon } from '../components/icons/Icons';
import { ProductInfo, Persona, PersonaModel } from '../types';
import { useTranslations } from '../i18n';
import { PageNavigation } from '../components/PageNavigation';

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

    const handleModelToggle = (model: PersonaModel) => {
        setSelectedModels(prev => {
            const newSelection = new Set(prev);
            if (newSelection.has(model)) {
                if (newSelection.size > 1) newSelection.delete(model);
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
        setIsLoading(true);
        const productInfoString = `Name: ${activeProduct.name}\nPrice: ${activeProduct.price || 'N/A'}\nDesired Outcome: ${activeProduct.desiredOutcome || 'N/A'}\nLocation: ${activeProduct.location || 'N/A'}`;
        const result = await geminiService.generatePersona(productInfoString, selectedModels, language);
        setIsLoading(false);
        if (result && result.summary) {
            addPersona({
                productId: activeProduct.id, 
                summary: result.summary!, 
                models: selectedModels,
                details: result.details, 
                empathyMap: result.empathyMap, 
                valueProposition: result.valueProposition,
                jtbd: result.jtbd, 
                journey: result.journey, 
                mentalModel: result.mentalModel
            });
            addToast({ type: 'success', message: 'Persona generated!' });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate('persona') });
        }
    };

    const renderList = (title: string, items: string[] | undefined) => {
        if (!items || !Array.isArray(items) || items.length === 0) return null;
        return (
            <div className="mb-4">
                <p className="text-xs font-bold uppercase text-primary mb-1">{title}</p>
                <ul className="list-disc list-inside space-y-1">
                    {items.map((item, i) => <li key={i} className="text-sm text-text leading-snug">{item}</li>)}
                </ul>
            </div>
        );
    };

    return (
        <div className="max-w-6xl mx-auto">
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
                        {(['standard', 'empathy', 'value-prop', 'jtbd', 'journey', 'mental'] as PersonaModel[]).map(model => (
                            <Button
                                key={model}
                                variant={selectedModels.includes(model) ? 'primary' : 'secondary'}
                                onClick={() => handleModelToggle(model)}
                                size="sm"
                                className="px-3"
                            >
                                {t.persona.models[model]}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-lg">
                <div className="lg:col-span-3 space-y-md">
                     {!activePersona && !isLoading && (
                        <EmptyState Icon={PersonaIcon} title={t.persona.emptyTitle} message={t.persona.emptyMessage} />
                    )}
                    
                    {isLoading && (
                        <Card className="flex flex-col items-center justify-center p-xl">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
                            <p className="text-center font-medium">{t.persona.generating}</p>
                        </Card>
                    )}
                    
                    {activePersona && !isLoading && (
                        <div className="animate-fade-in space-y-md">
                            <Card className="border-l-4 border-primary shadow-lg">
                                <h4 className="font-bold text-xl mb-sm text-primary uppercase tracking-tight">{t.persona.summary}</h4>
                                <p className="text-text leading-relaxed text-lg font-medium italic">"{activePersona.summary}"</p>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                                {activePersona.details && (
                                    <Card className="h-full">
                                        <h4 className="font-bold text-lg mb-4 border-b border-border pb-2 flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-accent"></span>
                                            {t.persona.models.standard}
                                        </h4>
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs font-bold uppercase text-muted mb-1">{t.persona.demographics}</p>
                                                <p className="text-sm bg-bg p-3 rounded-lg border border-border/50">{activePersona.details.demographics}</p>
                                            </div>
                                            {renderList(t.persona.goals, activePersona.details.goals)}
                                            {renderList(t.persona.challenges, activePersona.details.challenges)}
                                        </div>
                                    </Card>
                                )}

                                {activePersona.empathyMap && (
                                    <Card className="h-full">
                                        <h4 className="font-bold text-lg mb-4 border-b border-border pb-2 flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-pink-500"></span>
                                            {t.persona.models.empathy}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-bg p-2 rounded-lg border border-border/30">{renderList(t.persona.empathyMap.says, activePersona.empathyMap.says)}</div>
                                            <div className="bg-bg p-2 rounded-lg border border-border/30">{renderList(t.persona.empathyMap.thinks, activePersona.empathyMap.thinks)}</div>
                                            <div className="bg-bg p-2 rounded-lg border border-border/30">{renderList(t.persona.empathyMap.does, activePersona.empathyMap.does)}</div>
                                            <div className="bg-bg p-2 rounded-lg border border-border/30">{renderList(t.persona.empathyMap.feels, activePersona.empathyMap.feels)}</div>
                                        </div>
                                    </Card>
                                )}

                                {activePersona.valueProposition && (
                                    <Card className="md:col-span-2">
                                        <h4 className="font-bold text-lg mb-4 border-b border-border pb-2 flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                                            {t.persona.models['value-prop']}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-4">
                                                <h5 className="font-bold text-xs uppercase text-center bg-primary/10 text-primary py-2 rounded-full tracking-widest">Customer Profile</h5>
                                                {renderList(t.persona.valueProp.customerJobs, activePersona.valueProposition.customerJobs)}
                                                {renderList(t.persona.valueProp.pains, activePersona.valueProposition.pains)}
                                                {renderList(t.persona.valueProp.gains, activePersona.valueProposition.gains)}
                                            </div>
                                            <div className="space-y-4">
                                                <h5 className="font-bold text-xs uppercase text-center bg-accent/10 text-accent py-2 rounded-full tracking-widest">Value Map</h5>
                                                {renderList(t.persona.valueProp.productsServices, activePersona.valueProposition.productsServices)}
                                                {renderList(t.persona.valueProp.painRelievers, activePersona.valueProposition.painRelievers)}
                                                {renderList(t.persona.valueProp.gainCreators, activePersona.valueProposition.gainCreators)}
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {activePersona.jtbd && (
                                    <Card className="h-full">
                                        <h4 className="font-bold text-lg mb-4 border-b border-border pb-2 flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                                            {t.persona.jtbd.title}
                                        </h4>
                                        <div className="mb-4 bg-primary/5 p-4 rounded-xl border border-primary/20">
                                            <p className="text-[10px] font-black uppercase text-primary/70 mb-1">{t.persona.jtbd.jobStatement}</p>
                                            <p className="text-sm font-bold text-text">{activePersona.jtbd.jobStatement}</p>
                                        </div>
                                        <div className="space-y-3">
                                            {renderList(t.persona.jtbd.functionalAspects, activePersona.jtbd.functionalAspects)}
                                            {renderList(t.persona.jtbd.emotionalAspects, activePersona.jtbd.emotionalAspects)}
                                            {renderList(t.persona.jtbd.socialAspects, activePersona.jtbd.socialAspects)}
                                        </div>
                                    </Card>
                                )}

                                {activePersona.mentalModel && (
                                    <Card className="h-full">
                                        <h4 className="font-bold text-lg mb-4 border-b border-border pb-2 flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                                            {t.persona.mentalModel.title}
                                        </h4>
                                        <div className="space-y-4">
                                            {renderList(t.persona.mentalModel.coreBeliefs, activePersona.mentalModel.coreBeliefs)}
                                            <div className="p-3 bg-bg rounded-lg border border-border/50">
                                                <p className="text-xs font-bold uppercase text-primary mb-1">{t.persona.mentalModel.thoughtProcess}</p>
                                                <p className="text-sm text-text leading-relaxed">{activePersona.mentalModel.thoughtProcess}</p>
                                            </div>
                                            <div className="p-3 bg-bg rounded-lg border border-border/50">
                                                <p className="text-xs font-bold uppercase text-primary mb-1">{t.persona.mentalModel.informationStructure}</p>
                                                <p className="text-sm text-text leading-relaxed">{activePersona.mentalModel.informationStructure}</p>
                                            </div>
                                        </div>
                                    </Card>
                                )}

                                {activePersona.journey && (
                                    <Card className="md:col-span-2 overflow-hidden">
                                        <h4 className="font-bold text-lg mb-4 border-b border-border pb-2 flex items-center gap-2">
                                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                                            {t.persona.journey.title}
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border rounded-xl overflow-hidden">
                                            {(['awareness', 'consideration', 'decision'] as const).map(stage => (
                                                <div key={stage} className={`bg-bg/40 p-4 ${stage !== 'decision' ? 'md:border-r border-b md:border-b-0 border-border' : ''}`}>
                                                    <h5 className="font-black text-xs text-center mb-4 text-primary uppercase bg-primary/10 py-1.5 rounded-md tracking-tighter">{t.persona.journey[stage]}</h5>
                                                    <div className="space-y-4">
                                                        {renderList(t.persona.journey.actions, activePersona.journey![stage]?.actions)}
                                                        {renderList(t.persona.journey.painPoints, activePersona.journey![stage]?.painPoints)}
                                                        {renderList(t.persona.journey.opportunities, activePersona.journey![stage]?.opportunities)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div>
                     <h3 className="text-lg font-bold mb-md text-text uppercase flex items-center gap-2">
                         <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                         {t.persona.historyTitle}
                     </h3>
                     <div className="space-y-sm max-h-[85vh] overflow-y-auto pr-sm custom-scrollbar pb-10">
                        {personasForProduct.length === 0 ? (
                            <p className="text-sm text-muted italic p-md bg-panel rounded-lg border border-dashed border-border">{t.persona.emptyHistory}</p>
                        ) : (
                            personasForProduct.map((p: Persona) => (
                                <Card 
                                   key={p.id}
                                   onClick={() => setActiveId('personaId', p.id)}
                                   className={`border-2 cursor-pointer transition-all hover:translate-x-1 ${activeIds.personaId === p.id ? 'border-primary bg-primary/5 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'}`}
                               >
                                   <p className="font-bold text-text truncate text-sm leading-tight">{p.summary}</p>
                                   <div className="flex items-center justify-between mt-2.5">
                                       <div className="flex gap-1">
                                           {p.models.map(m => {
                                               const colors: Record<string, string> = {
                                                   standard: 'bg-accent',
                                                   empathy: 'bg-pink-500',
                                                   'value-prop': 'bg-green-500',
                                                   jtbd: 'bg-yellow-500',
                                                   journey: 'bg-blue-500',
                                                   mental: 'bg-purple-500'
                                               };
                                               return <span key={m} className={`w-2 h-2 rounded-full ${colors[m] || 'bg-muted'}`} title={m}></span>;
                                           })}
                                       </div>
                                       <p className="text-[9px] text-muted font-mono font-bold">{new Date(p.createdAt).toLocaleDateString()}</p>
                                   </div>
                               </Card>
                           ))
                        )}
                     </div>
                </div>
            </div>
            <PageNavigation />
        </div>
    );
};
