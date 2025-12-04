import React, { useState, useEffect, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/EmptyState';
import { ImageIcon } from '../components/icons/Icons';
import { ImageOption, ImageSet } from '../types';
import { useTranslations } from '../i18n';
import { uuidv4 } from '../utils';
import { Input } from '../components/ui/Input';

export const ImageGenerationPage: React.FC = () => {
    const t = useTranslations();
    const activeIds = useAppStore(state => state.activeIds);
    const setActiveId = useAppStore(state => state.setActiveId);
    const addImageSet = useAppStore(state => state.addImageSet);
    const addToast = useAppStore(state => state.addToast);
    
    const activeOutline = useAppStore(state => activeIds.outlineId ? state.data.outlines[activeIds.outlineId] : null);
    
    const imageSetsMap = useAppStore(state => state.data.imageSets);
    const imageSetsForOutline = useMemo(() =>
        Object.values(imageSetsMap).filter((is: ImageSet) => is.outlineId === activeIds.outlineId)
         .sort((a: ImageSet, b: ImageSet) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
        [imageSetsMap, activeIds.outlineId]
    );

    const activeImageSet = activeIds.imageSetId ? imageSetsMap[activeIds.imageSetId] : null;

    const [isLoading, setIsLoading] = useState(false);
    const [prompts, setPrompts] = useState<{ id: string, value: string }[]>([]);

    useEffect(() => {
        if (activeOutline && Array.isArray(activeOutline.sections)) {
            // Select sections at odd positions (1st, 3rd, 5th, etc.) which are at even indices (0, 2, 4, ...).
            // Then take a maximum of 4 of these sections.
            const selectedSections = activeOutline.sections
                .filter((_, index) => index % 2 === 0) 
                .slice(0, 4);

            const initialPrompts = selectedSections.map(section => ({
                id: uuidv4(),
                // Updated prompt to be more specific and avoid text.
                value: `A visually stunning, photorealistic image representing: ${section.h2}. ${section.bullets.join('. ')}. Style: cinematic, high detail. IMPORTANT: Do not include any text, letters, or words in the image.`
            }));
            setPrompts(initialPrompts);
        } else {
            setPrompts([]);
        }
    }, [activeOutline]);

    const handlePromptChange = (id: string, value: string) => {
        setPrompts(prompts.map(p => p.id === id ? { ...p, value } : p));
    };

    const addPrompt = () => {
        setPrompts([...prompts, { id: uuidv4(), value: '' }]);
    };

    const handleGenerate = async () => {
        if (!activeOutline) {
            addToast({ type: 'warning', message: t.toasts.selectOutlineFirst });
            return;
        }
        const validPrompts = prompts.map(p => p.value).filter(p => p.trim() !== '');
        if (validPrompts.length === 0) {
            addToast({ type: 'warning', message: 'Please add at least one prompt.' });
            return;
        }
        
        setIsLoading(true);
        const result = await geminiService.generateImages(validPrompts);
        setIsLoading(false);
        
        if (result && result.length > 0) {
            const newOptions: ImageOption[] = result.map(img => ({ ...img, id: uuidv4() }));
            addImageSet({ options: newOptions, outlineId: activeOutline.id });
            addToast({ type: 'success', message: t.toasts.imagesGenerated });
        } else {
            addToast({ type: 'error', message: t.toasts.failedToGenerate('images') });
        }
    };

    const handleSelectImage = (id: string) => {
        const currentIds = new Set(activeIds.imageIds || []);
        if (currentIds.has(id)) {
            currentIds.delete(id);
        } else {
            currentIds.add(id);
        }
        setActiveId('imageIds', Array.from(currentIds));
    };

    const handleSetFeatureImage = (id: string) => {
        // Also select it if not already selected
        if (!activeIds.imageIds?.includes(id)) {
            const currentIds = new Set(activeIds.imageIds || []);
            currentIds.add(id)
            setActiveId('imageIds', Array.from(currentIds));
        }
        setActiveId('featureImageId', id);
    };
    
    return (
        <div>
            <Header title={t.imageGeneration.title} description={t.imageGeneration.description}>
                <Button onClick={handleGenerate} isLoading={isLoading} disabled={!activeOutline || prompts.length === 0}>
                    {t.imageGeneration.generateButton}
                </Button>
            </Header>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
                <div className="lg:col-span-1">
                    <Card className="mb-md">
                        <h4 className="font-bold text-lg mb-sm">{t.imageGeneration.selectedOutline}</h4>
                        {activeOutline ? (
                            <p className="text-muted text-sm">{t.outline.sectionsCount(Array.isArray(activeOutline.sections) ? activeOutline.sections.length : 0)}</p>
                        ) : (
                            <p className="text-warning text-sm">{t.imageGeneration.noOutline}</p>
                        )}
                    </Card>

                    <h3 className="text-lg font-semibold mb-md">{t.imageGeneration.prompts}</h3>
                    <div className="space-y-md max-h-[60vh] overflow-y-auto pr-sm">
                        {prompts.map((prompt, index) => (
                            <Input
                                key={prompt.id}
                                label={`${t.imageGeneration.prompt} #${index + 1}`}
                                id={`prompt-${prompt.id}`}
                                value={prompt.value}
                                onChange={(e) => handlePromptChange(prompt.id, e.target.value)}
                            />
                        ))}
                    </div>
                     <Button variant="secondary" onClick={addPrompt} className="mt-md">{t.imageGeneration.addPrompt}</Button>
                </div>
                
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-md">{t.imageGeneration.generatedImages}</h3>
                    {isLoading && <p>{t.imageGeneration.generating}</p>}
                    {!activeImageSet && !isLoading && (
                        <EmptyState
                            Icon={ImageIcon}
                            title={t.imageGeneration.emptyTitle}
                            message={t.imageGeneration.emptyMessage}
                        />
                    )}
                    {activeImageSet && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                            {Array.isArray(activeImageSet.options) && activeImageSet.options.map(opt => (
                                <Card key={opt.id} className="relative">
                                    <img src={opt.url} alt={opt.prompt} className="w-full h-auto rounded-md mb-sm" />
                                    <p className="text-xs text-muted italic">"{opt.prompt}"</p>
                                    <div className="absolute top-2 right-2 flex flex-col gap-sm">
                                        <Button
                                            size="sm"
                                            variant={activeIds.featureImageId === opt.id ? 'primary' : 'secondary'}
                                            onClick={() => handleSetFeatureImage(opt.id)}
                                        >
                                            {t.imageGeneration.feature}
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={(activeIds.imageIds || []).includes(opt.id) ? 'primary' : 'secondary'}
                                            onClick={() => handleSelectImage(opt.id)}
                                        >
                                            {(activeIds.imageIds || []).includes(opt.id) ? t.imageGeneration.selected : 'Select'}
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                     <h3 className="text-lg font-semibold my-md">{t.imageGeneration.historyTitle}</h3>
                     {imageSetsForOutline.length === 0 && <p className="text-sm text-muted">{t.persona.emptyHistory}</p>}
                     <div className="space-y-sm max-h-[40vh] overflow-y-auto pr-sm">
                        {imageSetsForOutline.map((is: ImageSet) => (
                             <Card 
                                key={is.id}
                                onClick={() => setActiveId('imageSetId', is.id)}
                                className={`border-2 ${activeIds.imageSetId === is.id ? 'border-primary' : 'border-transparent'}`}
                            >
                                <p className="font-semibold text-text">{Array.isArray(is.options) ? is.options.length : 0} Images</p>
                                <p className="text-xs text-muted mt-1">{new Date(is.createdAt).toLocaleString()}</p>
                            </Card>
                        ))}
                     </div>
                </div>
            </div>
        </div>
    );
};