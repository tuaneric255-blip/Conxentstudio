
import React, { useState, useEffect, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { geminiService } from '../services/geminiService';
import { Header } from '../components/Header';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useTranslations } from '../i18n';
import { calculateWordCount, calculateReadingTime } from '../utils';
import { WritingStyle, OutlineSection } from '../types';
import { CheckCircleIcon } from '../components/icons/Icons';
import { Textarea } from '../components/ui/Textarea';

export const WritePublishPage: React.FC = () => {
  const t = useTranslations();
  const navigate = useNavigate();
  const activeIds = useAppStore(state => state.activeIds);
  const addArticle = useAppStore(state => state.addArticle);
  const addToast = useAppStore(state => state.addToast);
  const language = useAppStore(state => state.language);
  
  const activeOutline = useAppStore(state => activeIds.outlineId ? state.data.outlines[activeIds.outlineId] : null);
  const activeAnalysis = useAppStore(state => activeIds.analysisId ? state.data.analyses[activeIds.analysisId] : null);
  const activeTitle = useAppStore(state => activeIds.titleId && activeIds.titleSetId ? state.data.titleSets[activeIds.titleSetId].options.find(o => o.id === activeIds.titleId) : null);
  const activeMetaDescription = useAppStore(state => activeIds.metaDescriptionId && activeIds.metaDescriptionSetId ? state.data.metaDescriptionSets[activeIds.metaDescriptionSetId].options.find(o => o.id === activeIds.metaDescriptionId) : null);
  const activeSapo = useAppStore(state => activeIds.sapoId && activeIds.sapoSetId ? state.data.sapoSets[activeIds.sapoSetId].options.find(s => s.id === activeIds.sapoId) : null);
  
  // V2.2: Multiple CTAs
  const activeCtaSet = useAppStore(state => activeIds.ctaSetId ? state.data.ctaSets[activeIds.ctaSetId] : null);
  const activeCtas = useMemo(() => {
      if (!activeCtaSet || !activeIds.ctaIds) return [];
      return activeCtaSet.options.filter(c => activeIds.ctaIds?.includes(c.id));
  }, [activeCtaSet, activeIds.ctaIds]);
  // Primary CTA for legacy reference if needed, though we use the list now.
  const activeCta = activeCtas.length > 0 ? activeCtas[0] : null;


  const activePersona = useAppStore(state => activeIds.personaId ? state.data.personas[activeIds.personaId] : null);
  const featureImage = useAppStore(state => activeIds.featureImageId && activeIds.imageSetId ? state.data.imageSets[activeIds.imageSetId].options.find(o => o.id === activeIds.featureImageId) : null);
  
  const imageSet = useAppStore(state => state.activeIds.imageSetId ? state.data.imageSets[state.activeIds.imageSetId] : null);
  const imageIds = useAppStore(state => state.activeIds.imageIds);
  const featureImageId = useAppStore(state => state.activeIds.featureImageId);

  const bodyImages = useMemo(() => {
      if (!imageSet || !imageIds || !Array.isArray(imageSet.options)) return [];
      return imageSet.options
          .filter(o => imageIds.includes(o.id) && o.id !== featureImageId)
          .map(o => o.url);
  }, [imageSet, imageIds, featureImageId]);
  
  const isReadyToGenerate = activeOutline && activeTitle && activeMetaDescription && activeSapo && activeCtas.length > 0 && activePersona && featureImage && activeAnalysis;

  // Split Logic
  const outlineSplits = useMemo(() => {
      if (!activeOutline || !Array.isArray(activeOutline.sections)) return { part1: [], part2: [], part3: [] };
      const sections = activeOutline.sections;
      const total = sections.length;
      
      if (total < 3) {
           return { part1: sections, part2: [], part3: [] };
      }

      const third = Math.floor(total / 3);
      // Ensure at least some distribution if small
      const part1End = Math.max(1, third);
      const part2End = Math.max(part1End + 1, third * 2);

      return {
          part1: sections.slice(0, part1End),
          part2: sections.slice(part1End, part2End),
          part3: sections.slice(part2End),
      };
  }, [activeOutline]);

  const imageSplits = useMemo(() => {
      const total = bodyImages.length;
      if (total === 0) return { part1: [], part2: [], part3: [] };
      
      const third = Math.ceil(total / 3);
      return {
          part1: bodyImages.slice(0, third),
          part2: bodyImages.slice(third, third * 2),
          part3: bodyImages.slice(third * 2),
      };
  }, [bodyImages]);

  // State
  const [activeStep, setActiveStep] = useState<'options' | 'links' | 'part1' | 'part2' | 'part3' | 'publish'>('options');
  const [isLoading, setIsLoading] = useState(false);
  
  const [part1Content, setPart1Content] = useState('');
  const [part2Content, setPart2Content] = useState('');
  const [part3Content, setPart3Content] = useState('');
  const [finalContent, setFinalContent] = useState(''); // Merged content for editing

  // Options
  const [writingStyle, setWritingStyle] = useState<WritingStyle>('default');
  const [includeFaq, setIncludeFaq] = useState<boolean>(true);
  const [useInvertedPyramid, setUseInvertedPyramid] = useState<boolean>(true);
  const [optimizeForAIOverview, setOptimizeForAIOverview] = useState<boolean>(true);
  const [useTables, setUseTables] = useState<boolean>(true);
  const [useQuotes, setUseQuotes] = useState<boolean>(true);
  const [addWikipediaLinks, setAddWikipediaLinks] = useState<boolean>(true);
  
  // V2.2 Links
  const [internalLinksText, setInternalLinksText] = useState('');
  const [externalLinksText, setExternalLinksText] = useState('');

  const writingStyles: { key: WritingStyle, label: string }[] = [
    { key: 'default', label: t.writePublish.styles.default },
    { key: 'pas', label: t.writePublish.styles.pas },
    { key: '3s', label: t.writePublish.styles.s3 },
    { key: 'aidasas', label: t.writePublish.styles.aidasas },
    { key: 'storytelling', label: t.writePublish.styles.storytelling },
    { key: 'expository', label: t.writePublish.styles.expository },
    { key: 'persuasive', label: t.writePublish.styles.persuasive },
    { key: 'descriptive', label: t.writePublish.styles.descriptive },
    { key: 'narrative', label: t.writePublish.styles.narrative },
    { key: 'technical', label: t.writePublish.styles.technical },
    { key: 'conversational', label: t.writePublish.styles.conversational },
  ];

  // V3.0: Update Image Injection to use HTML tags for better compatibility and robustness
  const injectImages = (content: string, imageUrls: string[]) => {
      let result = content;
      imageUrls.forEach((url, index) => {
          // Robust styling for the image. Double newlines ensure it breaks out of paragraphs in markdown.
          const imageTag = `\n\n<img src="${url}" alt="Article Image ${index + 1}" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px; margin: 20px 0; display: block;" />\n\n`;
          
          // Regex to match [IMAGE_1], [IMAGE_2] etc. case insensitive
          const placeholderRegex = new RegExp(`\\[IMAGE_${index + 1}\\]`, 'gi');
          
          if (placeholderRegex.test(result)) {
              result = result.replace(placeholderRegex, imageTag);
          } else {
              // Fallback: Append if not found. This ensures images are NEVER lost.
              // Find the best place to append (end of a paragraph near the middle or end)
              result += `\n\n${imageTag}\n`;
          }
      });
      return result;
  };
  
  // Update final content when parts change or we enter publish mode
  useEffect(() => {
      // Always reconstruction when entering publish to ensure latest edits are captured
      if (activeStep === 'publish') {
          // Merge parts and inject images
          const p1 = injectImages(part1Content, imageSplits.part1);
          const p2 = injectImages(part2Content, imageSplits.part2);
          const p3 = injectImages(part3Content, imageSplits.part3);
          
          // Prepend Feature Image logic using HTML tag
          const featureImgHtml = featureImage ? `<img src="${featureImage.url}" alt="Feature Image" style="width: 100%; max-width: 800px; height: auto; border-radius: 8px; margin-bottom: 24px; display: block;" />\n\n` : '';

          setFinalContent(`${featureImgHtml}${p1}\n\n${p2}\n\n${p3}`);
      }
  }, [activeStep, part1Content, part2Content, part3Content, imageSplits, featureImage]);


  const generateSection = async (part: 'part1' | 'part2' | 'part3') => {
      if (!isReadyToGenerate) return;
      
      setIsLoading(true);
      
      let sections: OutlineSection[] = [];
      let images: string[] = [];
      let sectionCtas: string[] = [];
      
      const allCtaTexts = activeCtas.map(c => c.content);

      if (part === 'part1') {
          sections = outlineSplits.part1;
          images = imageSplits.part1;
          // Distribute CTAs loosely: 1st CTA in part 1
          if(allCtaTexts.length > 0) sectionCtas.push(allCtaTexts[0]);
      } else if (part === 'part2') {
          sections = outlineSplits.part2;
          images = imageSplits.part2;
           // Distribute CTAs loosely: 2nd CTA in part 2
          if(allCtaTexts.length > 1) sectionCtas.push(allCtaTexts[1]);
      } else {
          sections = outlineSplits.part3;
          images = imageSplits.part3;
           // Distribute CTAs loosely: Remaining CTAs in part 3
          if(allCtaTexts.length > 2) sectionCtas = allCtaTexts.slice(2);
      }
      
      // Split links roughly
      const intLinks = internalLinksText.split('\n').filter(l => l.trim());
      const extLinks = externalLinksText.split('\n').filter(l => l.trim());

      const result = await geminiService.generateArticleSection(
          part,
          sections,
          activeTitle!.title,
          activeSapo!.content,
          sectionCtas, 
          activePersona!,
          activeAnalysis!,
          language,
          images, // Passed for context in prompt, but we handle physical injection here
          {
            style: writingStyle,
            includeFaq: includeFaq,
            useInvertedPyramid: useInvertedPyramid,
            optimizeForAIOverview: optimizeForAIOverview,
            useTables: useTables,
            useQuotes: useQuotes,
            addWikipediaLinks: addWikipediaLinks,
            internalLinks: intLinks,
            externalLinks: extLinks,
          }
      );
      
      setIsLoading(false);
      
      if (result) {
          if (part === 'part1') setPart1Content(result);
          if (part === 'part2') setPart2Content(result);
          if (part === 'part3') setPart3Content(result);
          addToast({ type: 'success', message: `${t.writePublish.partGenerated} ${part.replace('part', '')}` });
      } else {
          addToast({ type: 'error', message: t.toasts.failedToGenerate('section') });
      }
  };

  const handleSave = () => {
    if (!finalContent || !isReadyToGenerate) return;

    // The first selected keyword is considered the primary one.
    const primaryKeywordId = (activeIds.keywordIds || [])[0];
    if (!primaryKeywordId) {
        addToast({ type: 'warning', message: 'Primary keyword not found.'});
        return;
    }

    addArticle({
        title: activeTitle!.title,
        content: finalContent,
        parts: {
            part1: part1Content,
            part2: part2Content,
            part3: part3Content
        },
        metaDescription: activeMetaDescription!.description,
        sapo: activeSapo!.content,
        cta: activeCta!.content, // Legacy single CTA field
        outlineId: activeOutline!.id,
        featureImage: featureImage!.url,
        images: bodyImages,
        personaId: activePersona!.id,
        analysisId: activeAnalysis!.id,
        primaryKeywordId: primaryKeywordId,
        objectiveIds: activeIds.objectiveIds || [],
        writingStyle: writingStyle,
        generationOptions: {
            includeFaq: includeFaq,
            useTables: useTables,
            useQuotes: useQuotes,
            addWikipediaLinks: addWikipediaLinks,
            internalLinks: internalLinksText.split('\n').filter(Boolean),
            externalLinks: externalLinksText.split('\n').filter(Boolean),
        },
    });
    addToast({ type: 'success', message: t.toasts.articleSaved });
    navigate('/seo-checklist');
  };
  
  const handleCopyToClipboard = () => {
    // Basic copy
    navigator.clipboard.writeText(finalContent);
    addToast({ type: 'success', message: t.library.copied });
  };

  const getStepStatus = (step: string) => {
      if (step === 'part1') return part1Content ? 'complete' : 'pending';
      if (step === 'part2') return part2Content ? 'complete' : 'pending';
      if (step === 'part3') return part3Content ? 'complete' : 'pending';
      return 'pending';
  };

  const canProceedToPublish = part1Content && part2Content && part3Content;

  if (!isReadyToGenerate) {
      return (
          <div>
              <Header title={t.writePublish.title} description={t.writePublish.description} />
              <div className="text-warning bg-warning/10 border border-warning/20 p-md rounded-md mb-lg">
                  {t.writePublish.noContext}
              </div>
          </div>
      );
  }

  return (
    <div>
      <Header title={t.writePublish.title} description={t.writePublish.description}>
          {activeStep === 'publish' && (
              <Button onClick={handleSave} disabled={!finalContent}>
                {t.writePublish.saveButton}
              </Button>
          )}
      </Header>

      {/* Workflow Navigation */}
      <div className="flex items-center gap-2 mb-lg overflow-x-auto pb-2">
          {['options', 'links', 'part1', 'part2', 'part3', 'publish'].map((step, idx) => {
               const isComplete = (step === 'options' || step === 'links') ? true : step === 'publish' ? canProceedToPublish : getStepStatus(step) === 'complete';
               const isCurrent = activeStep === step;
               const label = step === 'links' ? 'Links' : t.writePublish.steps[step as keyof typeof t.writePublish.steps];
               
               return (
                   <button
                        key={step}
                        onClick={() => setActiveStep(step as any)}
                        disabled={step === 'publish' && !canProceedToPublish}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                            ${isCurrent ? 'bg-primary text-white' : 'bg-panel border border-border text-muted hover:text-text'}
                            ${step === 'publish' && !canProceedToPublish ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                   >
                       {isComplete && step !== 'publish' && step !== 'options' && step !== 'links' && <CheckCircleIcon className="w-4 h-4" />}
                       {label}
                   </button>
               )
          })}
      </div>

      {activeStep === 'options' && (
         <Card className="mb-lg animate-fade-in">
            <h3 className="text-lg font-semibold mb-md">{t.writePublish.advancedOptions.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                <div>
                    <label htmlFor="writing-style" className="block text-sm font-medium text-muted mb-2">{t.writePublish.advancedOptions.writingStyle}</label>
                    <select
                        id="writing-style"
                        value={writingStyle}
                        onChange={(e) => setWritingStyle(e.target.value as WritingStyle)}
                        className="w-full text-sm p-2.5 bg-panel border border-border rounded-md text-text focus:ring-primary focus:border-primary"
                    >
                        {writingStyles.map(style => (
                            <option key={style.key} value={style.key}>{style.label}</option>
                        ))}
                    </select>
                </div>
                 <div className="space-y-sm">
                    <label className="block text-sm font-medium text-muted">{t.writePublish.advancedOptions.features}</label>
                    <div className="flex flex-wrap gap-x-md gap-y-sm">
                        <div className="flex items-center">
                            <input id="faq-checkbox" type="checkbox" checked={includeFaq} onChange={(e) => setIncludeFaq(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="faq-checkbox" className="ml-2 block text-sm text-text">{t.writePublish.advancedOptions.includeFaq}</label>
                        </div>
                         <div className="flex items-center">
                            <input id="pyramid-checkbox" type="checkbox" checked={useInvertedPyramid} onChange={(e) => setUseInvertedPyramid(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="pyramid-checkbox" className="ml-2 block text-sm text-text">{t.writePublish.advancedOptions.useInvertedPyramid}</label>
                        </div>
                         <div className="flex items-center">
                            <input id="tables-checkbox" type="checkbox" checked={useTables} onChange={(e) => setUseTables(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="tables-checkbox" className="ml-2 block text-sm text-text">{t.writePublish.advancedOptions.useTables}</label>
                        </div>
                        <div className="flex items-center">
                            <input id="quotes-checkbox" type="checkbox" checked={useQuotes} onChange={(e) => setUseQuotes(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="quotes-checkbox" className="ml-2 block text-sm text-text">Include Quotes/Takeaways</label>
                        </div>
                        <div className="flex items-center">
                            <input id="seo-checkbox" type="checkbox" checked={optimizeForAIOverview} onChange={(e) => setOptimizeForAIOverview(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="seo-checkbox" className="ml-2 block text-sm text-text">{t.writePublish.advancedOptions.optimizeForAI}</label>
                        </div>
                         <div className="flex items-center">
                            <input id="wiki-checkbox" type="checkbox" checked={addWikipediaLinks} onChange={(e) => setAddWikipediaLinks(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                            <label htmlFor="wiki-checkbox" className="ml-2 block text-sm text-text">{t.writePublish.advancedOptions.addWikipediaLinks}</label>
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-lg flex justify-end">
                <Button onClick={() => setActiveStep('links')}>Next: Links</Button>
            </div>
        </Card>
      )}

      {activeStep === 'links' && (
          <Card className="mb-lg animate-fade-in">
              <h3 className="text-lg font-semibold mb-md">Internal & External Links</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
                  <div>
                      <Textarea 
                        label="Internal Links (One per line)" 
                        placeholder="e.g. [Product Page](https://mysite.com/product)"
                        value={internalLinksText}
                        onChange={(e) => setInternalLinksText(e.target.value)}
                        rows={8}
                      />
                  </div>
                  <div>
                      <Textarea 
                        label="External Links (One per line)" 
                        placeholder="e.g. [Industry Report](https://forbes.com/report)"
                        value={externalLinksText}
                        onChange={(e) => setExternalLinksText(e.target.value)}
                        rows={8}
                      />
                  </div>
              </div>
              <div className="mt-lg flex justify-end">
                <Button onClick={() => setActiveStep('part1')}>Next: Part 1</Button>
            </div>
          </Card>
      )}

      {(activeStep === 'part1' || activeStep === 'part2' || activeStep === 'part3') && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg animate-fade-in">
              <div>
                  <Card className="h-full flex flex-col">
                      <h3 className="text-lg font-bold mb-sm capitalize">{t.writePublish.steps[activeStep]} Setup</h3>
                      <div className="flex-1 space-y-md">
                          <div>
                              <h4 className="font-semibold text-sm text-muted">Sections Covered:</h4>
                              <ul className="list-disc list-inside text-sm">
                                  {outlineSplits[activeStep].map((s, i) => (
                                      <li key={i} className="truncate">{s.h2}</li>
                                  ))}
                              </ul>
                          </div>
                          <div>
                              <h4 className="font-semibold text-sm text-muted">Images to Insert:</h4>
                              <div className="flex gap-2 mt-2 overflow-x-auto">
                                  {imageSplits[activeStep].length > 0 ? imageSplits[activeStep].map((url, i) => (
                                      <img key={i} src={url} className="w-16 h-16 object-cover rounded border border-border" alt="Thumbnail" />
                                  )) : <span className="text-sm text-muted">None</span>}
                              </div>
                          </div>
                      </div>
                      <div className="mt-md pt-md border-t border-border">
                          <Button 
                            onClick={() => generateSection(activeStep)} 
                            isLoading={isLoading} 
                            className="w-full"
                            disabled={isLoading}
                          >
                              {getStepStatus(activeStep) === 'complete' ? t.writePublish.regenerate : t.writePublish.generateButton}
                          </Button>
                      </div>
                  </Card>
              </div>
              <div>
                  <Card className="h-full min-h-[400px]">
                      <h3 className="text-lg font-bold mb-sm">Output</h3>
                      <textarea
                        className="w-full h-[350px] bg-bg border border-border rounded-md p-md font-mono text-sm resize-none focus:ring-primary focus:border-primary"
                        value={
                            activeStep === 'part1' ? part1Content :
                            activeStep === 'part2' ? part2Content :
                            part3Content
                        }
                        onChange={(e) => {
                            if (activeStep === 'part1') setPart1Content(e.target.value);
                            else if (activeStep === 'part2') setPart2Content(e.target.value);
                            else setPart3Content(e.target.value);
                        }}
                        placeholder="Content will appear here..."
                      />
                  </Card>
              </div>
          </div>
      )}

      {activeStep === 'publish' && (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg animate-fade-in">
             <div className="lg:col-span-2">
                <Card>
                    <div className="flex justify-between items-center mb-md pb-md border-b border-border">
                        <h2 className="text-2xl font-bold">{activeTitle?.title}</h2>
                        <Button size="sm" variant="secondary" onClick={handleCopyToClipboard}>{t.library.copyContent}</Button>
                    </div>
                    {/* Display Raw Markdown with HTML tags for user transparency */}
                    <textarea 
                        className="w-full h-[70vh] bg-bg border border-border rounded-md p-md font-mono text-sm focus:ring-primary focus:border-primary"
                        value={finalContent}
                        onChange={(e) => setFinalContent(e.target.value)}
                    />
                </Card>
             </div>
             <div>
                 <Card>
                     <h3 className="font-bold text-lg mb-md">Publish Summary</h3>
                     <div className="space-y-sm text-sm">
                         <p><span className="font-semibold">{t.writePublish.wordCount}:</span> {calculateWordCount(finalContent).toLocaleString()}</p>
                         <p><span className="font-semibold">Reading Time:</span> {t.writePublish.readTime(calculateReadingTime(calculateWordCount(finalContent)))}</p>
                         <p><span className="font-semibold">Images Used:</span> {bodyImages.length + (featureImage ? 1 : 0)}</p>
                     </div>
                     <div className="mt-lg">
                        <img src={featureImage?.url} alt="Feature" className="w-full h-auto rounded-lg mb-2" />
                        <p className="text-xs text-center text-muted">{t.imageGeneration.feature}</p>
                     </div>
                 </Card>
             </div>
         </div>
      )}
    </div>
  );
};
