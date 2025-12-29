
import { GoogleGenAI, Modality } from "@google/genai";
import { 
  Language, 
  PersonaModel,
  Persona,
  Keyword,
  Analysis,
  ObjectiveOption,
  TitleOption,
  MetaDescriptionOption,
  SapoOption,
  CtaOption,
  Outline,
  ImageOption,
  WritingStyle,
  SeoChecklistResult,
  OutlineSection,
} from '../types';
import { safeJsonParse, uuidv4 } from '../utils';
import { useAppStore } from '../store/useAppStore';

declare const process: any;

const normalizeStringArray = (data: unknown): string[] => {
    if (!data) return [];
    if (Array.isArray(data)) {
        return data.map(item => {
            if (typeof item === 'string') return item;
            if (typeof item === 'object' && item !== null) {
                if ('title' in item && typeof item.title === 'string' && 'description' in item && typeof item.description === 'string') {
                    return `${item.title}: ${item.description}`;
                }
                if ('title' in item && typeof item.title === 'string') return item.title;
                if ('description' in item && typeof item.description === 'string') return item.description;
                if ('name' in item && typeof item.name === 'string') return item.name;
                return JSON.stringify(item);
            }
            return String(item);
        }).filter(s => s && s.trim() !== '');
    }
    if (typeof data === 'string') {
        return data.split('\n').map(s => s.replace(/^- /, '').trim()).filter(Boolean);
    }
    return [];
};

const normalizeBreakthroughs = (data: any) => {
    const defaultVal = {
        uniqueInsights: '',
        humanExperienceEEAT: '',
        hcuExploitation: '',
    };
    if (!data || typeof data !== 'object') return defaultVal;
    return {
        uniqueInsights: data.uniqueInsights || data['uniqueInsights'] || '',
        humanExperienceEEAT: data.humanExperienceEEAT || data['humanExperienceEEAT'] || '',
        hcuExploitation: data.hcuExploitation || data['hcuExploitation'] || '',
    };
};

const getAiClient = () => {
    const userSettingsApiKey = useAppStore.getState().geminiApiKey;
    if (userSettingsApiKey && userSettingsApiKey.trim() !== '') {
        return new GoogleGenAI({ apiKey: userSettingsApiKey });
    }
    const viteEnvKey = (import.meta as any)?.env?.VITE_API_KEY;
    if (viteEnvKey) {
        return new GoogleGenAI({ apiKey: viteEnvKey });
    }
    const processEnvKey = process.env.API_KEY;
    if (processEnvKey) {
        return new GoogleGenAI({ apiKey: processEnvKey });
    }
    throw new Error("API Key is missing. Please enter your Google API Key in Settings.");
};

const textModel = 'gemini-3-pro-preview';
const flashModel = 'gemini-2.5-flash';
const imageModel = 'gemini-2.5-flash-image';

const callGemini = async (prompt: string, model: 'flash' | 'pro' = 'pro', useJson = true): Promise<string | null> => {
    let selectedModel = model === 'pro' ? textModel : flashModel;
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const ai = getAiClient();
            const config: any = {};
            if (useJson) config.responseMimeType = 'application/json';
            if (selectedModel === textModel) config.thinkingConfig = { thinkingBudget: 8192 };
            const response = await ai.models.generateContent({
                model: selectedModel,
                contents: prompt,
                config: config,
            });
            return response.text || null;
        } catch (e: any) {
            console.error(`Gemini API error (Attempt ${attempt + 1}):`, e);
            if (attempt === maxAttempts - 1) return null;
            if (model === 'pro' && attempt === 1) selectedModel = flashModel;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    }
    return null;
};

const callGeminiWithSearch = async (prompt: string) => {
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const ai = getAiClient();
            const response = await ai.models.generateContent({
                model: flashModel, 
                contents: prompt,
                config: { tools: [{ googleSearch: {} }] },
            });
            const text = response.text;
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
                ?.map((chunk: any) => chunk.web)
                .filter(Boolean)
                .map((web: any) => ({ title: web.title, uri: web.uri })) || [];
            return { text, sources };
        } catch (e) {
            console.error(`Gemini Search error (Attempt ${attempt + 1}):`, e);
            if (attempt === maxAttempts - 1) return null;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    }
    return null;
};

const generatePersona = async (productInfo: string, models: PersonaModel[], language: Language): Promise<Partial<Persona> | null> => {
    const modelsString = models.join(', ');
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    
    const schemaParts = [
      '"summary": "A deep, comprehensive summary of the ideal customer persona (minimum 3 sentences)."',
      models.includes('standard') && '"details": { "demographics": "Detailed demographics (age, location, job, income, etc.)", "goals": ["Goal 1 (detailed)", "Goal 2", "Goal 3"], "challenges": ["Pain point 1", "Pain point 2", "Pain point 3"] }',
      models.includes('empathy') && '"empathyMap": { "says": ["Quotes they might say", "..."], "thinks": ["Internal thoughts", "..."], "does": ["Observable behaviors", "..."], "feels": ["Core emotions", "..."] }',
      models.includes('value-prop') && '"valueProposition": { "customerJobs": ["Tasks they try to perform", "..."], "pains": ["Frustrations", "..."], "gains": ["Desired outcomes", "..."], "productsServices": ["Specific product features"], "painRelievers": ["How features reduce pains"], "gainCreators": ["How features create gains"] }',
      models.includes('jtbd') && '"jtbd": { "jobStatement": "Main job to be done statement", "functionalAspects": ["Required functions"], "emotionalAspects": ["Emotional needs"], "socialAspects": ["Social standing needs"] }',
      models.includes('journey') && '"journey": { "awareness": { "actions": ["..."], "painPoints": ["..."], "opportunities": ["..."] }, "consideration": { "actions": ["..."], "painPoints": ["..."], "opportunities": ["..."] }, "decision": { "actions": ["..."], "painPoints": ["..."], "opportunities": ["..."] } }',
      models.includes('mental') && '"mentalModel": { "coreBeliefs": ["Key beliefs related to industry"], "thoughtProcess": "Detailed description of decision making", "informationStructure": "How they prefer to consume data" }',
    ].filter(Boolean).join(',\n');

    const prompt = `Act as a world-class marketing strategist. Analyze the following product/service:
    ${productInfo}
    
    Generate a high-resolution, data-driven target audience persona using these frameworks: ${modelsString}. 
    Be extremely specific, creative, and professional. The content must be in ${lang}.
    
    Return the response strictly as JSON with the following structure:
    {
        ${schemaParts}
    }`;

    const response = await callGemini(prompt, 'pro');
    return response ? safeJsonParse<Partial<Persona>>(response) : null;
};

const generateKeywords = async (personaSummary: string, language: Language, location?: string): Promise<{ keywords: Keyword[] } | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const currentYear = new Date().getFullYear();
    const prompt = `Generate 20 SEO keywords for: ${personaSummary}. Lang: ${lang}. Location: ${location || 'Global'}. Year: ${currentYear} (Strict). JSON: { "keywords": [{ term, relevance, searchVolume, competition, kei, kgr, intent, lsiKeywords }] }`;
    const response = await callGemini(prompt);
    return response ? safeJsonParse<{ keywords: Keyword[] }>(response) : null;
};

const analyzeWebForKeywords = async (keywords: string[], personaSummary: string, language: Language): Promise<Analysis | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `Analyze top search results for: "${keywords.join(', ')}" from the perspective of: "${personaSummary}". Language: ${lang}. JSON: { summary, objectives, contentGaps, creativeIdeas, breakthroughs: { uniqueInsights, humanExperienceEEAT, hcuExploitation } }`;
    const result = await callGeminiWithSearch(prompt);
    if (!result || !result.text) return null;
    const parsed = safeJsonParse<any>(result.text);
    if (!parsed) return null;
    return {
        summary: parsed.summary || '',
        objectives: normalizeStringArray(parsed.objectives),
        contentGaps: normalizeStringArray(parsed.contentGaps),
        creativeIdeas: normalizeStringArray(parsed.creativeIdeas),
        breakthroughs: normalizeBreakthroughs(parsed.breakthroughs),
        sources: result.sources,
        keywordIds: [], id: '', createdAt: ''
    };
};

const generateManualAnalysis = async (content: string, keywords: string[], personaSummary: string, language: Language): Promise<Omit<Analysis, 'sources'> | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `Analyze content: "${content.substring(0, 5000)}" with keywords "${keywords.join(', ')}" for persona "${personaSummary}". Language: ${lang}. JSON same as web analysis.`;
    const response = await callGemini(prompt, 'pro');
    if (!response) return null;
    const parsed = safeJsonParse<any>(response);
    if (!parsed) return null;
    return {
        summary: parsed.summary || '',
        objectives: normalizeStringArray(parsed.objectives),
        contentGaps: normalizeStringArray(parsed.contentGaps),
        creativeIdeas: normalizeStringArray(parsed.creativeIdeas),
        breakthroughs: normalizeBreakthroughs(parsed.breakthroughs),
        keywordIds: [], id: '', createdAt: ''
    };
};

const generateObjectives = async (analysisString: string, language: Language): Promise<{ options: ObjectiveOption[] } | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `Based on analysis: ${analysisString.substring(0, 3000)}, generate 5 content objectives. Lang: ${lang}. JSON: { "options": [{ description, rationale, score }] }`;
    const response = await callGemini(prompt);
    return response ? safeJsonParse<{ options: ObjectiveOption[] }>(response) : null;
};

const generateTitles = async (objectiveDescriptions: string[], primaryKeyword: string, language: Language): Promise<{ options: TitleOption[] } | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `Generate 10 titles containing "${primaryKeyword}" for objectives: ${objectiveDescriptions.join('; ')}. Lang: ${lang}. JSON: { "options": [{ title, rationale, score }] }`;
    const response = await callGemini(prompt);
    return response ? safeJsonParse<{ options: TitleOption[] }>(response) : null;
};

const generateMetaDescriptions = async (title: string, keyword: string, language: Language): Promise<{ options: MetaDescriptionOption[] } | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `Generate 5 meta descriptions for Title: "${title}" and Keyword: "${keyword}". Lang: ${lang}. Under 160 chars. JSON: { "options": [{ description, rationale, score }] }`;
    const response = await callGemini(prompt);
    return response ? safeJsonParse<{ options: MetaDescriptionOption[] }>(response) : null;
};

const generateSapos = async (title: string, keyword: string, personaSummary: string, language: Language): Promise<{ options: SapoOption[] } | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `Generate 5 introductions (Sapo) for Title: "${title}", Keyword: "${keyword}", Persona: "${personaSummary}". Lang: ${lang}. JSON: { "options": [{ content, rationale }] }`;
    const response = await callGemini(prompt);
    return response ? safeJsonParse<{ options: SapoOption[] }>(response) : null;
};

const generateCtas = async (objectives: string[], personaSummary: string, language: Language): Promise<{ options: CtaOption[] } | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `Generate 5 CTAs for objectives: ${objectives.join('; ')}. Persona: "${personaSummary}". Lang: ${lang}. JSON: { "options": [{ content, rationale }] }`;
    const response = await callGemini(prompt);
    return response ? safeJsonParse<{ options: CtaOption[] }>(response) : null;
};

const generateOutline = async (analysis: Analysis, persona: Persona, title: string, metaDescription: string, objectives: string[], keyword: Keyword, language: Language): Promise<Partial<Outline> | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `Create outline for Title: "${title}". Persona: "${persona.summary}". Keyword: "${keyword.term}". Objectives: ${objectives.join('; ')}. Gaps: ${analysis.contentGaps.join('; ')}. Lang: ${lang}. JSON: { "sections": [{ h2, bullets: [] }] }`;
    const response = await callGemini(prompt);
    return response ? safeJsonParse<Partial<Outline>>(response) : null;
};

const generateImages = async (prompts: string[]): Promise<ImageOption[] | null> => {
    const imageOptions: ImageOption[] = [];
    const ai = getAiClient();
    for (const prompt of prompts) {
        let success = false;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                // Optimized clean prompt to avoid safety triggers related to text/logos
                const cleanPrompt = `${prompt}. Pure imagery, no text, no letters, no words, no signs, artistic style.`;
                const response = await ai.models.generateContent({
                    model: imageModel,
                    contents: { parts: [{ text: cleanPrompt }] },
                    config: { imageConfig: { aspectRatio: "16:9" } },
                });
                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData?.data) {
                            imageOptions.push({ id: uuidv4(), url: `data:image/png;base64,${part.inlineData.data}`, prompt });
                        }
                    }
                }
                success = true; break;
            } catch (e) {
                console.warn(`Image gen failed: ${prompt.substring(0, 30)}...`, e);
                await new Promise(r => setTimeout(r, 1500));
            }
        }
    }
    return imageOptions.length > 0 ? imageOptions : null;
};

const generateArticleSection = async (sectionType: 'part1' | 'part2' | 'part3', outlineSections: OutlineSection[], title: string, sapo: string, ctas: string[], persona: Persona, analysis: Analysis, language: Language, sectionImages: string[], options: any): Promise<string | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const outlineString = outlineSections.map(s => `## ${s.h2}\n${s.bullets.map(b => `- ${b}`).join('\n')}`).join('\n\n');
    const prompt = `You are writing ${sectionType.toUpperCase()} of article "${title}". Outline: ${outlineString}. Sapo: ${sapo}. CTAs: ${ctas.join('; ')}. Persona: ${persona.summary}. Style: ${options.style}. Breakthroughs: ${analysis.breakthroughs.uniqueInsights}. Lang: ${lang}. Include placeholders [IMAGE_1], [IMAGE_2]... appropriately. Output: Markdown only. Approx 800-1000 words.`;
    return await callGemini(prompt, 'pro', false);
};

const evaluateArticleSeo = async (params: any): Promise<SeoChecklistResult | null> => {
    const { articleContent, title, metaDescription, primaryKeyword, writingStyle, options, language } = params;
    const prompt = `SEO Audit for Title: "${title}". Keyword: "${primaryKeyword}". Content: ${articleContent.substring(0, 5000)}. Lang: ${language === 'en' ? 'English' : 'Vietnamese'}. JSON audit checklist results.`;
    const response = await callGemini(prompt, 'flash', true);
    return response ? safeJsonParse<SeoChecklistResult>(response) : null;
};

export const geminiService = { generatePersona, generateKeywords, analyzeWebForKeywords, generateManualAnalysis, generateObjectives, generateTitles, generateMetaDescriptions, generateSapos, generateCtas, generateOutline, generateImages, generateArticleSection, evaluateArticleSeo };
