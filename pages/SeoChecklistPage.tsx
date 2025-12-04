import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/EmptyState';
import { SeoCheckIcon, CheckCircleIcon, XCircleIcon } from '../components/icons/Icons';
import { SeoChecklistResult, SeoChecklistItem, KeywordSet, ObjectiveSet } from '../types';
import { useTranslations } from '../i18n';

export const SeoChecklistPage: React.FC = () => {
    const t = useTranslations();
    const activeIds = useAppStore(state => state.activeIds);
    const data = useAppStore(state => state.data);
    const addToast = useAppStore(state => state.addToast);
    const language = useAppStore(state => state.language);
    
    const activeArticle = useMemo(() => 
        activeIds.activeArticleId ? data.articles[activeIds.activeArticleId] : null,
        [activeIds.activeArticleId, data.articles]
    );

    const evaluationContext = useMemo(() => {
        if (!activeArticle) return null;
        const persona = data.personas[activeArticle.personaId];
        const analysis = data.analyses[activeArticle.analysisId];
        // FIX: Cast Object.values to the correct type to avoid type inference issues.
        const keywordSet = (Object.values(data.keywordSets) as KeywordSet[]).find((ks: KeywordSet) => 
            Array.isArray(ks.items) && ks.items.some(k => k.id === activeArticle.primaryKeywordId));
        const primaryKeyword = keywordSet?.items.find(k => k.id === activeArticle.primaryKeywordId);
        // FIX: Cast Object.values to the correct type to avoid type inference issues.
        const objectiveSet = (Object.values(data.objectiveSets) as ObjectiveSet[]).find((os: ObjectiveSet) => os.analysisId === activeArticle.analysisId);
        const objectives = (objectiveSet && Array.isArray(objectiveSet.options) ? objectiveSet.options : [])
            .filter(opt => activeArticle.objectiveIds.includes(opt.id));

        if (!persona || !analysis || !primaryKeyword || objectives.length === 0) return null;

        return {
            articleContent: activeArticle.content,
            title: activeArticle.title,
            metaDescription: activeArticle.metaDescription,
            primaryKeyword: primaryKeyword,
            objectiveDescriptions: objectives.map(o => o.description),
            writingStyle: activeArticle.writingStyle,
            options: activeArticle.generationOptions,
            language,
        };
    }, [activeArticle, data, language]);
    
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [checklistResult, setChecklistResult] = useState<SeoChecklistResult | null>(null);
    
    const handleEvaluateSeo = async () => {
        if (!evaluationContext) {
            addToast({ type: 'error', message: 'Could not gather all context for evaluation.' });
            return;
        }
    
        setIsEvaluating(true);
        setChecklistResult(null);
    
        const result = await geminiService.evaluateArticleSeo({
            ...evaluationContext,
            primaryKeyword: evaluationContext.primaryKeyword.term,
            lsiKeywords: evaluationContext.primaryKeyword.lsiKeywords,
        });
        
        setIsEvaluating(false);
    
        if (result) {
            setChecklistResult(result);
            addToast({ type: 'success', message: t.seoChecklistPage.evaluationComplete });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate('SEO score') });
        }
    };

    if (!activeArticle || !evaluationContext) {
        return (
            <div>
                <Header title={t.seoChecklistPage.title} description={t.seoChecklistPage.description} />
                <EmptyState
                    Icon={SeoCheckIcon}
                    title={t.seoChecklistPage.noArticle}
                    message="Navigate to 'Write & Publish', generate an article, and click 'Save & Go to SEO Check' to evaluate it here."
                />
            </div>
        );
    }
      
    return (
        <div>
            <Header title={t.seoChecklistPage.title} description={t.seoChecklistPage.description}>
                <Button onClick={handleEvaluateSeo} isLoading={isEvaluating}>
                    {t.seoChecklistPage.scoreButton}
                </Button>
            </Header>

            <Card className="mb-lg">
                <h3 className="text-lg font-semibold">{t.seoChecklistPage.activeArticle}</h3>
                <p className="text-text font-bold text-xl">{activeArticle.title}</p>
            </Card>

            <Card>
                <h3 className="text-lg font-semibold mb-md">{t.seoChecklist.sectionTitle}</h3>
                {isEvaluating && <p className="text-sm text-muted mt-md">{t.seoChecklistPage.evaluating}</p>}
                {checklistResult && (
                    <ul className="space-y-md mt-md">
                    {Object.entries(checklistResult).map(([key, itemValue]) => {
                        const item = itemValue as SeoChecklistItem;
                        if (typeof item !== 'object' || item === null || typeof item.pass === 'undefined') {
                            return null; 
                        }
                        const translationKey = key as keyof typeof t.seoChecklist;
                        if (!t.seoChecklist[translationKey]) return null;

                        return (
                        <li key={key} className="flex items-start gap-sm">
                        {item.pass ? <CheckCircleIcon className="w-5 h-5 text-success mt-0.5 flex-shrink-0" /> : <XCircleIcon className="w-5 h-5 text-danger mt-0.5 flex-shrink-0" />}
                        <div>
                            <p className="font-semibold text-text">{t.seoChecklist[translationKey]}</p>
                            <p className="text-xs text-muted">{item.reason}</p>
                        </div>
                        </li>
                    );
                    })}
                    </ul>
                )}
            </Card>
        </div>
    );
};
