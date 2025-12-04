
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
    const activeProduct = useMemo(() => {
        if (!activePersona) return null;
        return productsMap[activePersona.productId];
    }, [activePersona, productsMap]);
    
    const keywordSetsMap = useAppStore(state => state.data.keywordSets);
    const keywordSetsForPersona = useMemo(() =>
        Object.values(keywordSetsMap).filter((ks: KeywordSet) => ks.personaId === activeIds.personaId)
         .sort((a: KeywordSet, b: KeywordSet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [keywordSetsMap, activeIds.personaId]
    );

    const activeKeywordSet = activeIds.keywordSetId ? keywordSetsMap[activeIds.keywordSetId] : null;
    const selectedKeywordIds = useMemo(() => new Set(activeIds.keywordIds || []), [activeIds.keywordIds]);

    const [isLoading, setIsLoading] = useState(false);

    const handleGenerate = async () => {
        if (!activePersona) {
            addToast({ type: 'warning', message: t.toasts.selectPersonaFirst });
            return;
        }
        setIsLoading(true);
        const result = await geminiService.generateKeywords(activePersona.summary, language, activeProduct?.location);
        setIsLoading(false);
        if (result && result.keywords) {
            const keywordsWithIds: Keyword[] = result.keywords.map((k: any) => ({ ...k, id: uuidv4() }));
            addKeywordSet({ items: keywordsWithIds, personaId: activePersona.id });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate('keywords') });
        }
    };

    const handleKeywordSelect = (keywordId: ID) => {
        const newSelection = new Set(selectedKeywordIds);
        if (newSelection.has(keywordId)) {
            newSelection.delete(keywordId);
        } else {
            newSelection.add(keywordId);
        }
        setActiveId('keywordIds', Array.from(newSelection));
    };

    const handleExport = () => {
        if (!activeKeywordSet || !Array.isArray(activeKeywordSet.items) || activeKeywordSet.items.length === 0) {
            addToast({ type: 'warning', message: t.toasts.noKeywordsToExport });
            return;
        }

        const headers = ['Term', 'LSI Keywords', 'Intent', 'Search Volume', 'KEI', 'KGR'];
        
        const escapeCsvValue = (value: any): string => {
            if (value === null || value === undefined) return '';
            const strValue = String(value);
            if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
                return `"${strValue.replace(/"/g, '""')}"`;
            }
            return strValue;
        };

        const csvRows = [
            headers.join(','),
            ...activeKeywordSet.items.map(kw => [
                escapeCsvValue(kw.term),
                escapeCsvValue((kw.lsiKeywords || []).join('; ')),
                escapeCsvValue(kw.intent),
                escapeCsvValue(kw.searchVolume || 0),
                escapeCsvValue((kw.kei || 0).toFixed(2)),
                escapeCsvValue((kw.kgr || 0).toFixed(2)),
            ].join(','))
        ];

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `seo_keywords_${activePersona?.summary.substring(0, 20).replace(/\s/g, '_') || 'export'}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        addToast({ type: 'success', message: t.toasts.keywordsExported });
    };

    const getIntentBadgeColor = (intent: string) => {
        switch (intent?.toLowerCase()) {
            case 'informational': return 'bg-blue-100 text-blue-800';
            case 'navigational': return 'bg-yellow-100 text-yellow-800';
            case 'commercial': return 'bg-purple-100 text-purple-800';
            case 'transactional': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <div>
            <Header title={t.seoKeywords.title} description={t.seoKeywords.description}>
                <div className="flex gap-sm">
                    <Button 
                        onClick={handleExport} 
                        variant="secondary" 
                        disabled={!activeKeywordSet || !Array.isArray(activeKeywordSet.items) || activeKeywordSet.items.length === 0}
                    >
                        {t.seoKeywords.exportButton}
                    </Button>
                    <Button onClick={handleGenerate} isLoading={isLoading} disabled={!activePersona}>
                        {t.seoKeywords.generateButton}
                    </Button>
                </div>
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
                    <h3 className="text-lg font-semibold mb-md">{t.seoKeywords.generatedFor(activePersona?.summary || '...')}</h3>
                     {!activeKeywordSet && !isLoading && (
                        <EmptyState
                            Icon={KeywordIcon}
                            title={t.seoKeywords.emptyTitle}
                            message={t.seoKeywords.emptyMessage}
                        />
                    )}
                    {isLoading && <p>{t.seoKeywords.generating}</p>}
                    {activeKeywordSet && (
                        <Card className="overflow-hidden">
                            <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left table-fixed min-w-[600px]">
                                <thead className="text-xs text-muted uppercase bg-panel/50">
                                    <tr>
                                        <th scope="col" className="p-sm w-10"></th>
                                        <th scope="col" className="px-sm py-sm w-1/4">{t.seoKeywords.keyword}</th>
                                        <th scope="col" className="px-sm py-sm w-1/6">{t.seoKeywords.intent}</th>
                                        <th scope="col" className="px-sm py-sm w-1/4">LSI Keywords</th>
                                        <th scope="col" className="px-sm py-sm w-20 text-right">{t.seoKeywords.volume}</th>
                                        <th scope="col" className="px-sm py-sm w-16 text-right">{t.seoKeywords.kei}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.isArray(activeKeywordSet.items) && activeKeywordSet.items.map(kw => (
                                        <tr 
                                            key={kw.id} 
                                            className={`border-b border-border last:border-b-0 ${selectedKeywordIds.has(kw.id) ? 'bg-primary/10' : ''}`}
                                        >
                                            <td className="p-sm text-center align-top">
                                                <input 
                                                    type="checkbox"
                                                    checked={selectedKeywordIds.has(kw.id)}
                                                    onChange={() => handleKeywordSelect(kw.id)}
                                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary mt-1"
                                                />
                                            </td>
                                            <td className="px-sm py-md font-medium text-text align-top">
                                                <p className="break-words">{kw.term}</p>
                                            </td>
                                            <td className="px-sm py-md align-top">
                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${getIntentBadgeColor(kw.intent)}`}>
                                                    {kw.intent}
                                                </span>
                                            </td>
                                            <td className="px-sm py-md align-top">
                                                 <div className="flex flex-wrap gap-1">
                                                    {(kw.lsiKeywords || []).map((lsi, i) => (
                                                        <span key={i} className="inline-block bg-border/50 text-muted text-[10px] px-1.5 py-0.5 rounded border border-border">
                                                            {lsi}
                                                        </span>
                                                    ))}
                                                 </div>
                                            </td>
                                            <td className="px-sm py-md text-right align-top text-muted">{(kw.searchVolume || 0).toLocaleString()}</td>
                                            <td className="px-sm py-md text-right align-top text-muted">{(kw.kei || 0).toFixed(0)}</td>
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
                     {keywordSetsForPersona.length === 0 && <p className="text-sm text-muted">{t.persona.emptyHistory}</p>}
                     <div className="space-y-sm max-h-[60vh] overflow-y-auto pr-sm">
                        {keywordSetsForPersona.map((ks: KeywordSet) => (
                             <Card 
                                key={ks.id}
                                onClick={() => setActiveId('keywordSetId', ks.id)}
                                className={`border-2 ${activeIds.keywordSetId === ks.id ? 'border-primary' : 'border-transparent'}`}
                            >
                                <p className="font-semibold text-text">{Array.isArray(ks.items) ? ks.items.length : 0} Keywords</p>
                                <p className="text-xs text-muted mt-1">{new Date(ks.createdAt).toLocaleString()}</p>
                            </Card>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};
