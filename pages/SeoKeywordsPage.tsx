
import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ContextSelector } from '../components/ContextSelector';
import { EmptyState } from '../components/EmptyState';
import { KeywordIcon } from '../components/icons/Icons';
import { Persona, Keyword, KeywordSet, ID } from '../types';
import { useTranslations } from '../i18n';
import { PageNavigation } from '../components/PageNavigation';
import { uuidv4 } from '../utils';

export const SeoKeywordsPage: React.FC = () => {
    const t = useTranslations();
    const activeIds = useAppStore(state => state.activeIds);
    const setActiveId = useAppStore(state => state.setActiveId);
    const addKeywordSet = useAppStore(state => state.addKeywordSet);
    const addToast = useAppStore(state => state.addToast);
    const language = useAppStore(state => state.language);
    
    const personasMap = useAppStore(state => state.data.personas);
    const productsMap = useAppStore(state => state.data.products);
    const personas = useMemo(() => Object.values(personasMap) as Persona[], [personasMap]);
    const activePersona = activeIds.personaId ? personasMap[activeIds.personaId] : null;
    const activeProduct = activePersona ? productsMap[activePersona.productId] : null;
    
    const keywordSetsMap = useAppStore(state => state.data.keywordSets);
    const keywordSetsForPersona = useMemo(() =>
        Object.values(keywordSetsMap).filter((ks: KeywordSet) => ks.personaId === activeIds.personaId)
         .sort((a: KeywordSet, b: KeywordSet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [keywordSetsMap, activeIds.personaId]
    );

    const activeKeywordSet = activeIds.keywordSetId ? keywordSetsMap[activeIds.keywordSetId] : null;
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!activePersona) {
            addToast({ type: 'warning', message: t.toasts.selectPersonaFirst }); return;
        }
        setIsLoading(true);
        const result = await geminiService.generateKeywords(activePersona.summary, language, activeProduct?.location);
        setIsLoading(false);
        if (result && result.keywords) {
            const keywordsWithIds: Keyword[] = result.keywords.map((k: any) => ({ ...k, id: uuidv4() }));
            addKeywordSet({ items: keywordsWithIds, personaId: activePersona.id });
            addToast({ type: 'success', message: 'Keyword set generated!' });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate('keywords') });
        }
    };

    return (
        <div className="max-w-6xl mx-auto">
            <Header title={t.seoKeywords.title} description={t.seoKeywords.description}>
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!activePersona}>
                    {t.seoKeywords.generateButton}
                </Button>
            </Header>
            <div className="mb-lg">
                <ContextSelector<Persona>
                    label={t.seoKeywords.personaLabel}
                    items={personas}
                    selectedId={activeIds.personaId}
                    onSelect={(id) => setActiveId('personaId', id)}
                    missingMessage={t.seoKeywords.personaMissing}
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="lg:col-span-2">
                     {!activeKeywordSet && !isLoading && (
                        <EmptyState Icon={KeywordIcon} title={t.seoKeywords.emptyTitle} message={t.seoKeywords.emptyMessage} />
                    )}
                    {isLoading && <p className="text-center p-xl">{t.seoKeywords.generating}</p>}
                    {activeKeywordSet && (
                        <Card className="overflow-hidden p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-muted uppercase bg-bg/50 border-b border-border">
                                        <tr>
                                            <th className="p-sm w-12 text-center">Sel</th>
                                            <th className="p-sm">{t.seoKeywords.keyword}</th>
                                            <th className="p-sm">{t.seoKeywords.intent}</th>
                                            <th className="p-sm text-right">Vol</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeKeywordSet.items.map(kw => (
                                            <tr key={kw.id} className={`border-b border-border last:border-0 hover:bg-bg/40 transition-colors ${(activeIds.keywordIds || []).includes(kw.id) ? 'bg-primary/5' : ''}`}>
                                                <td className="p-sm text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={(activeIds.keywordIds || []).includes(kw.id)}
                                                        onChange={() => {
                                                            const current = new Set(activeIds.keywordIds || []);
                                                            if (current.has(kw.id)) current.delete(kw.id); else current.add(kw.id);
                                                            setActiveId('keywordIds', Array.from(current));
                                                        }}
                                                        className="h-4 w-4 text-primary rounded border-border" 
                                                    />
                                                </td>
                                                <td className="p-sm font-medium">{kw.term}</td>
                                                <td className="p-sm"><span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-accent/10 text-accent uppercase tracking-wider">{kw.intent}</span></td>
                                                <td className="p-sm text-right text-muted">{kw.searchVolume.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </div>
                <div>
                     <h3 className="text-lg font-semibold mb-md">{t.seoKeywords.historyTitle}</h3>
                     <div className="space-y-sm max-h-[60vh] overflow-y-auto pr-sm custom-scrollbar">
                        {keywordSetsForPersona.map((ks: KeywordSet) => (
                             <Card 
                                key={ks.id}
                                onClick={() => setActiveId('keywordSetId', ks.id)}
                                className={`border-2 cursor-pointer ${activeIds.keywordSetId === ks.id ? 'border-primary' : 'border-transparent'}`}
                            >
                                <p className="font-semibold">{ks.items.length} Keywords</p>
                                <p className="text-[10px] text-muted mt-1 uppercase">{new Date(ks.createdAt).toLocaleString()}</p>
                            </Card>
                        ))}
                     </div>
                </div>
            </div>
            <PageNavigation />
        </div>
    );
};
