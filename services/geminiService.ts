

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
import { safeJsonParse } from '../utils';

// Declare process to fix TS error in Vercel build
declare const process: any;

// Helper to normalize fields that should be string arrays but might be returned differently by the AI.
const normalizeStringArray = (data: unknown): string[] => {
    if (!data) {
        return [];
    }
    if (Array.isArray(data)) {
        return data.map(item => {
            if (typeof item === 'string') {
                return item;
            }
            if (typeof item === 'object' && item !== null) {
                // Heuristic based on error: {title, description}
                if ('title' in item && typeof item.title === 'string' && 'description' in item && typeof item.description === 'string') {
                    return `${item.title}: ${item.description}`;
                }
                // Other common keys
                if ('title' in item && typeof item.title === 'string') return item.title;
                if ('description' in item && typeof item.description === 'string') return item.description;
                if ('name' in item && typeof item.name === 'string') return item.name;
                // Fallback for any other object
                return JSON.stringify(item);
            }
            return String(item);
        }).filter(s => s && s.trim() !== ''); // Filter out empty or null strings
    }
    if (typeof data === 'string') {
        // Handle newline-separated strings, which AI sometimes returns
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


// Initialize GoogleGenAI with a named parameter as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

// Update to recommended models
const textModel = 'gemini-3-pro-preview'; // For complex reasoning, coding, and text generation.
const flashModel = 'gemini-2.5-flash'; // For basic text tasks, summarization, etc.
// Use the correct model name for image generation as per guidelines.
const imageModel = 'gemini-2.5-flash-image';

const callGemini = async (prompt: string, model: 'flash' | 'pro' = 'pro', useJson = true): Promise<string | null> => {
    let selectedModel = model === 'pro' ? textModel : flashModel;
    const maxAttempts = 3;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            const config: any = {};
            if (useJson) {
                config.responseMimeType = 'application/json';
            }
            
            // Use thinking config for Pro model to ensure high quality and completeness.
            // Only apply if we are actually using the textModel (Pro).
            if (selectedModel === textModel) {
                config.thinkingConfig = { thinkingBudget: 8192 };
            }

            // Use ai.models.generateContent as per guidelines.
            const response = await ai.models.generateContent({
                model: selectedModel,
                contents: prompt,
                config: config,
            });
            // Access text directly from the response object.
            return response.text || null;
        } catch (e: any) {
            console.error(`Gemini API call failed (Attempt ${attempt + 1}/${maxAttempts}):`, e);
            
            // If this was the last attempt, return null
            if (attempt === maxAttempts - 1) {
                return null;
            }

            // Fallback Logic:
            // If we are using Pro model and failed twice (attempt index 1), fallback to Flash for the final attempt.
            // This ensures robustness against timeouts or specific model errors.
            if (model === 'pro' && attempt === 1) {
                console.warn("Falling back to Flash model due to repeated failures.");
                selectedModel = flashModel;
            }

            // Exponential backoff: 1s, 2s...
            const delay = 1000 * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    return null;
};

const callGeminiWithSearch = async (prompt: string) => {
    const maxAttempts = 3;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // Use flashModel (gemini-2.5-flash) for search as it is robust for tools and faster.
            const response = await ai.models.generateContent({
                model: flashModel, 
                contents: prompt,
                config: {
                    tools: [{ googleSearch: {} }],
                    // Note: responseMimeType is NOT allowed with googleSearch tool
                },
            });

            // Access text directly from the response object.
            const text = response.text;
            // Correctly access grounding metadata as per guidelines.
            const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks
                ?.map((chunk: any) => chunk.web)
                .filter(Boolean)
                .map((web: any) => ({ title: web.title, uri: web.uri })) || [];

            return { text, sources };
        } catch (e) {
            console.error(`Gemini Search API call failed (Attempt ${attempt + 1}/${maxAttempts}):`, e);
            if (attempt === maxAttempts - 1) return null;
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    }
    return null;
};

const generatePersona = async (productInfo: string, models: PersonaModel[], language: Language): Promise<Partial<Persona> | null> => {
    const modelsString = models.join(', ');
    const lang = language === 'en' ? 'English' : 'Vietnamese';

    // Constructing the JSON schema part of the prompt dynamically
    const schemaParts = [
      '"summary": "A concise, one-sentence summary of the persona."',
      models.includes('standard') && '"details": { "demographics": "Detailed demographics.", "goals": ["Goal 1", "Goal 2"], "challenges": ["Challenge 1", "Challenge 2"] }',
      models.includes('empathy') && '"empathyMap": { "says": ["..."], "thinks": ["..."], "does": ["..."], "feels": ["..."] }',
      models.includes('value-prop') && '"valueProposition": { "customerJobs": ["..."], "pains": ["..."], "gains": ["..."], "productsServices": ["..."], "painRelievers": ["..."], "gainCreators": ["..."] }',
      models.includes('jtbd') && '"jtbd": { "jobStatement": "...", "functionalAspects": ["..."], "emotionalAspects": ["..."], "socialAspects": ["..."] }',
      models.includes('journey') && '"journey": { "awareness": { "actions": ["..."], "painPoints": ["..."], "opportunities": ["..."] }, "consideration": { "actions": ["..."], "painPoints": ["..."], "opportunities": ["..."] }, "decision": { "actions": ["..."], "painPoints": ["..."], "opportunities": ["..."] } }',
      models.includes('mental') && '"mentalModel": { "coreBeliefs": ["..."], "thoughtProcess": "...", "informationStructure": "..." }',
    ].filter(Boolean).join(',\n');
    
    const prompt = `
    Analyze the following product information and generate a detailed user persona in ${lang}.
    Product Information:
    ---
    ${productInfo}
    ---
    
    Generate the following persona models: ${modelsString}.

    The final output MUST be a single, valid JSON object, with no other text before or after it. The JSON structure must be:
    {
      ${schemaParts}
    }
    Provide rich, detailed, and plausible information for every field.
    `;
    const response = await callGemini(prompt);
    if (!response) return null;
    return safeJsonParse<Partial<Persona>>(response);
};


const generateKeywords = async (personaSummary: string, language: Language, location?: string): Promise<{ keywords: Keyword[] } | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const currentYear = new Date().getFullYear();
    const locationInstruction = location ? `The target location for these keywords is "${location}". Please prioritize keywords that are geographically relevant.` : 'The keywords should be globally relevant unless the persona implies a location.';

    const prompt = `
    Based on the following user persona summary, generate a list of 20 relevant SEO keywords in ${lang}.
    Persona Summary:
    ---
    ${personaSummary}
    ---
    
    **IMPORTANT CONTEXTUAL RULES:**
    1. **Location:** ${locationInstruction}
    2. **Timeliness:** The current year is ${currentYear}. You MUST NOT generate any keywords that include past years (e.g., ${currentYear - 1}, ${currentYear - 2}, etc.). This is a strict, non-negotiable rule. Focus on evergreen or current/future year terms.

    For each keyword, provide the following metrics:
    - term: The keyword itself.
    - relevance: A score from 1-10 on how relevant it is to the persona.
    - searchVolume: An estimated monthly search volume (e.g., 1500).
    - competition: 'Low', 'Medium', or 'High'.
    - kei: Keyword Effectiveness Index (Search Volume^2 / Competition). Use 1 for Low, 5 for Medium, 10 for High competition in calculation.
    - kgr: Keyword Golden Ratio (Allintitle results / Search Volume). Estimate allintitle results.
    - intent: 'Informational', 'Navigational', 'Commercial', or 'Transactional'.
    - lsiKeywords: A list of 3-5 related Latent Semantic Indexing keywords.

    The final output MUST be a single JSON object with a "keywords" key containing an array of keyword objects. Example format:
    {
      "keywords": [
        {
          "term": "example keyword",
          "relevance": 8,
          "searchVolume": 1200,
          "competition": "Medium",
          "kei": 288000,
          "kgr": 0.15,
          "intent": "Informational",
          "lsiKeywords": ["related term 1", "related term 2"]
        }
      ]
    }
    `;
    const response = await callGemini(prompt);
    if (!response) return null;
    return safeJsonParse<{ keywords: Keyword[] }>(response);
};

const analyzeWebForKeywords = async (keywords: string[], personaSummary: string, language: Language): Promise<Analysis | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const keywordString = keywords.join(', ');
    const prompt = `
    Perform a comprehensive analysis of the top Google search results for the keywords: "${keywordString}". 
    The analysis MUST be from the perspective of this persona: "${personaSummary}".
    The output language must be ${lang}.
    
    Synthesize your findings into a structured report. Ensure ALL fields below are filled with detailed, actionable insights. Do not stop early.
    
    Required Fields:
    1. summary: A deep summary of the top-ranking content (approx 100-150 words).
    2. objectives: Infer the primary content objectives of competitors.
    3. contentGaps: Identify specific gaps or weaknesses in competitor content.
    4. creativeIdeas: Brainstorm creative angles or USPs for new content.
    5. breakthroughs: This is CRITICAL. You must provide specific strategies for:
        - uniqueInsights: Novel perspectives or data not found in current results.
        - humanExperienceEEAT: How to add authentic human experience and expertise.
        - hcuExploitation: Specific tactics to outperform generic content under Google's HCU guidelines.

    The final output MUST be a single valid JSON object. Do not include markdown formatting like \`\`\`json.
    Structure:
    {
      "summary": "...",
      "objectives": ["..."],
      "contentGaps": ["..."],
      "creativeIdeas": ["..."],
      "breakthroughs": {
        "uniqueInsights": "...",
        "humanExperienceEEAT": "...",
        "hcuExploitation": "..."
      }
    }
    `;
    const result = await callGeminiWithSearch(prompt);
    if (!result || !result.text) return null;

    const parsed = safeJsonParse<any>(result.text);
    if (!parsed) return null;
    
    const sanitizedAnalysis: Omit<Analysis, 'sources' | 'keywordIds' | 'id' | 'createdAt'> = {
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        objectives: normalizeStringArray(parsed.objectives),
        contentGaps: normalizeStringArray(parsed.contentGaps),
        creativeIdeas: normalizeStringArray(parsed.creativeIdeas),
        breakthroughs: normalizeBreakthroughs(parsed.breakthroughs),
    };

    return { ...sanitizedAnalysis, sources: result.sources, keywordIds: [], id: '', createdAt: '' };
};

const generateManualAnalysis = async (content: string, keywords: string[], personaSummary: string, language: Language): Promise<Omit<Analysis, 'sources'> | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const keywordString = keywords.join(', ');
    const prompt = `
    Analyze the following content based on keywords "${keywordString}" from the perspective of persona: "${personaSummary}".
    Content:
    ---
    ${content}
    ---

    Output language: ${lang}.
    
    Synthesize your findings. Ensure ALL fields are filled.
    
    Required JSON Structure:
    {
      "summary": "Deep summary...",
      "objectives": ["..."],
      "contentGaps": ["..."],
      "creativeIdeas": ["..."],
      "breakthroughs": {
        "uniqueInsights": "...",
        "humanExperienceEEAT": "...",
        "hcuExploitation": "..."
      }
    }
    `;
    const response = await callGemini(prompt, 'pro');
    if (!response) return null;
    
    const parsed = safeJsonParse<any>(response);
    if (!parsed) return null;

    const sanitizedAnalysis: Omit<Analysis, 'sources' | 'keywordIds' | 'id' | 'createdAt'> = {
        summary: typeof parsed.summary === 'string' ? parsed.summary : '',
        objectives: normalizeStringArray(parsed.objectives),
        contentGaps: normalizeStringArray(parsed.contentGaps),
        creativeIdeas: normalizeStringArray(parsed.creativeIdeas),
        breakthroughs: normalizeBreakthroughs(parsed.breakthroughs),
    };

    return {
        ...sanitizedAnalysis,
        id: '',
        createdAt: '',
        keywordIds: [],
    };
};

const generateObjectives = async (analysisString: string, language: Language): Promise<{ options: ObjectiveOption[] } | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `
    Based on the following content analysis, generate 5 distinct and strategic content objectives in ${lang}.
    Analysis:
    ---
    ${analysisString}
    ---
    
    For each objective, provide:
    - description: A clear, concise statement of the objective.
    - rationale: A brief explanation of why this objective is important based on the analysis.
    - score: A score from 1-10 indicating the potential impact of this objective.

    The final output MUST be a single JSON object with an "options" key containing an array of objective objects. Example:
    {
      "options": [
        { "description": "...", "rationale": "...", "score": 9 }
      ]
    }
    `;
    const response = await callGemini(prompt);
    if (!response) return null;
    return safeJsonParse<{ options: ObjectiveOption[] }>(response);
};

const generateTitles = async (objectiveDescriptions: string[], primaryKeyword: string, language: Language): Promise<{ options: TitleOption[] } | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `
    Based on the following content objectives, generate 10 compelling, SEO-friendly titles in ${lang}.
    Objectives:
    ---
    - ${objectiveDescriptions.join('\n- ')}
    ---
    
    MANDATORY REQUIREMENT: Every single title generated MUST contain the primary keyword: "${primaryKeyword}". This is a strict, non-negotiable rule.

    For each title, provide:
    - title: The title itself (under 60 characters).
    - rationale: A brief explanation of why this title is effective for the given objectives.
    - score: A score from 1-10 on its potential effectiveness and click-through rate.

    The final output MUST be a single JSON object with an "options" key containing an array of title objects. Example:
    {
      "options": [
        { "title": "...", "rationale": "...", "score": 8 }
      ]
    }
    `;
    const response = await callGemini(prompt);
    if (!response) return null;
    return safeJsonParse<{ options: TitleOption[] }>(response);
};

const generateMetaDescriptions = async (title: string, keyword: string, language: Language): Promise<{ options: MetaDescriptionOption[] } | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `
    Generate 5 concise and persuasive meta descriptions in ${lang} for an article with the following title and primary keyword.
    Title: "${title}"
    Primary Keyword: "${keyword}"
    
    For each description:
    - It MUST be under 160 characters.
    - It MUST include the primary keyword. This is a non-negotiable rule.
    - It MUST be compelling and encourage clicks.

    For each description, provide:
    - description: The meta description text.
    - rationale: A brief explanation of its strengths.
    - score: A score from 1-10 on its effectiveness.

    The final output MUST be a single JSON object with an "options" key containing an array of description objects. Example:
    {
      "options": [
        { "description": "...", "rationale": "...", "score": 9 }
      ]
    }
    `;
    const response = await callGemini(prompt);
    if (!response) return null;
    return safeJsonParse<{ options: MetaDescriptionOption[] }>(response);
};

const generateSapos = async (title: string, keyword: string, personaSummary: string, language: Language): Promise<{ options: SapoOption[] } | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `
    Generate 5 engaging, hook-filled introductory paragraphs (Sapo) in ${lang} for an article.
    
    Context:
    - Title: "${title}"
    - Primary Keyword: "${keyword}"
    - Target Audience (Persona): "${personaSummary}"

    MANDATORY REQUIREMENTS:
    1. Each Sapo MUST include the primary keyword "${keyword}" naturally.
    2. It must be engaging, setting the stage for the article and encouraging the user to read on.
    3. Length: Approximately 40-60 words.

    The final output MUST be a single JSON object with an "options" key containing an array of objects.
    Structure:
    {
      "options": [
        { "content": "The sapo text...", "rationale": "Why this hook works..." }
      ]
    }
    `;
    const response = await callGemini(prompt);
    if (!response) return null;
    return safeJsonParse<{ options: SapoOption[] }>(response);
};

const generateCtas = async (objectives: string[], personaSummary: string, language: Language): Promise<{ options: CtaOption[] } | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const prompt = `
    Generate 5 compelling Call to Action (CTA) phrases in ${lang}.
    
    Context:
    - Article Objectives: ${objectives.join(', ')}
    - Target Audience (Persona): "${personaSummary}"

    MANDATORY REQUIREMENTS:
    1. The CTA must align strictly with the article objectives (e.g., if the objective is brand awareness, the CTA shouldn't be a hard sell).
    2. It should be persuasive and action-oriented.

    The final output MUST be a single JSON object with an "options" key containing an array of objects.
    Structure:
    {
      "options": [
        { "content": "The CTA text...", "rationale": "Why this works for the objective..." }
      ]
    }
    `;
    const response = await callGemini(prompt);
    if (!response) return null;
    return safeJsonParse<{ options: CtaOption[] }>(response);
};

const generateOutline = async (
    analysis: Analysis, 
    persona: Persona, 
    title: string, 
    metaDescription: string, 
    objectives: string[], // V2.2
    keyword: Keyword, // V2.2
    language: Language
): Promise<Partial<Outline> | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';

    // Defensively handle cases where the AI might return a string instead of an array of strings.
    const contentGapsText = Array.isArray(analysis.contentGaps) 
        ? analysis.contentGaps.join(', ') 
        : (analysis.contentGaps || '');
        
    const creativeIdeasText = Array.isArray(analysis.creativeIdeas)
        ? analysis.creativeIdeas.join(', ')
        : (analysis.creativeIdeas || '');

    const prompt = `
    Create a comprehensive, logical content outline in ${lang}.
    
    **CORE CONTEXT:**
    - Title: "${title}"
    - Meta Description: "${metaDescription}"
    - Target Persona: "${persona.summary}"
    - Primary Keyword: "${keyword.term}"
    - Search Intent: "${keyword.intent}"
    - LSI Keywords to Include: ${keyword.lsiKeywords.join(', ')}
    - Strategic Objectives: ${objectives.join(', ')}

    **ANALYSIS INSIGHTS:**
    - Content Gaps to Fill: ${contentGapsText}
    - Creative Ideas: ${creativeIdeasText}

    **INSTRUCTIONS:**
    The outline should be structured with H2 headings and detailed bullet points under each heading.
    Structure the outline to match the Search Intent (${keyword.intent}).
    Ensure the LSI keywords are naturally distributed in the structure.
    Ensure the structure is MECE (Mutually Exclusive, Collectively Exhaustive).

    The final output MUST be a single JSON object with a "sections" key containing an array of section objects. Example:
    {
      "sections": [
        {
          "h2": "First Main Section Title",
          "bullets": [
            "Key point 1 for this section",
            "Key point 2 for this section"
          ]
        },
        {
          "h2": "Second Main Section Title",
          "bullets": ["..."]
        }
      ]
    }
    `;
    const response = await callGemini(prompt);
    if (!response) return null;
    return safeJsonParse<Partial<Outline>>(response);
};

const generateImages = async (prompts: string[]): Promise<ImageOption[] | null> => {
    const imageOptions: ImageOption[] = [];
    
    // Process prompts one by one, with retries for each
    for (const prompt of prompts) {
        let success = false;
        const maxAttempts = 3;
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                // Use ai.models.generateContent with the correct image model and response modality.
                const response = await ai.models.generateContent({
                    model: imageModel,
                    contents: { parts: [{ text: prompt }] },
                    config: {
                        // responseModalities must be an array with a single Modality.IMAGE element.
                        responseModalities: [Modality.IMAGE],
                    },
                });
                
                if (response.candidates && response.candidates[0] && response.candidates[0].content && response.candidates[0].content.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData && part.inlineData.data) {
                            const base64ImageBytes: string = part.inlineData.data;
                            const imageUrl = `data:image/png;base64,${base64ImageBytes}`;
                            imageOptions.push({ id: '', url: imageUrl, prompt });
                        }
                    }
                }
                success = true;
                break; // Break retry loop on success
            } catch (e) {
                console.error(`Image generation attempt ${attempt + 1} failed for prompt: "${prompt.substring(0, 20)}..."`, e);
                // Backoff
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        if (!success) {
            console.error("Failed to generate image after max attempts for prompt:", prompt);
        }
    }
    
    // Return whatever we managed to generate, or null if absolutely nothing
    return imageOptions.length > 0 ? imageOptions : null;
};

const generateArticleSection = async (
    sectionType: 'part1' | 'part2' | 'part3',
    outlineSections: OutlineSection[],
    title: string,
    sapo: string,
    ctas: string[], // V2.2 Multiple CTAs
    persona: Persona,
    analysis: Analysis,
    language: Language,
    sectionImages: string[], 
    options: {
        style: WritingStyle,
        includeFaq: boolean, // Only relevant for part3
        useInvertedPyramid: boolean,
        optimizeForAIOverview: boolean,
        useTables: boolean,
        useQuotes: boolean; // V2.5
        addWikipediaLinks: boolean;
        internalLinks?: string[]; // V2.2
        externalLinks?: string[]; // V2.2
    }
): Promise<string | null> => {
    const lang = language === 'en' ? 'English' : 'Vietnamese';
    const outlineString = outlineSections.map(s => `## ${s.h2}\n${s.bullets.map(b => `- ${b}`).join('\n')}`).join('\n\n');

    const imageInstruction = sectionImages.length > 0 
      ? `\nIMPORTANT: This section has ${sectionImages.length} associated images. You MUST strategically place image placeholders ([IMAGE_1], [IMAGE_2]...) within the text where they are most contextually relevant. Use all placeholders provided.`
      : '';
    
    const writingStyleInstruction = options.style !== 'default'
      ? `WRITING STYLE: Adopt the "${options.style}" framework.`
      : '';
    
    const invertedPyramidInstruction = options.useInvertedPyramid && sectionType === 'part1'
      ? `ARTICLE STRUCTURE: Use the Inverted Pyramid structure. Present the most crucial information, conclusions, and key takeaways at the beginning.`
      : '';

    const faqInstruction = options.includeFaq && sectionType === 'part3'
      ? `REQUIRED SECTIONS: At the very end of this section (which ends the article), include a "Frequently Asked Questions (FAQs)" section with 3-5 relevant questions and their answers. Format this as H2 "FAQs" followed by H3 questions.`
      : '';
    
    const tableInstruction = options.useTables
      ? `FORMATTING: You MUST use Markdown tables where appropriate for comparing data, features, or presenting structured information. Ensure at least one table is included if the content allows.`
      : '';

    const quoteInstruction = options.useQuotes
      ? `FORMATTING: You MUST include at least one Blockquote using Markdown syntax (> Quote) to highlight a Key Takeaway, an Expert Opinion, or a critical Insight.`
      : '';

    const aiOverviewInstruction = options.optimizeForAIOverview
      ? `SEO OPTIMIZATION: Structure the content to be easily digestible for Google's AI Overview. Use clear headings, bulleted lists, and concise direct answers to potential questions.`
      : '';

    const wikipediaInstruction = options.addWikipediaLinks
      ? `E-E-A-H ENHANCEMENT: Identify key concepts and embed external links to their corresponding English Wikipedia pages (e.g., [Term](https://en.wikipedia.org/wiki/Term)).`
      : '';

    const internalLinksInstruction = options.internalLinks && options.internalLinks.length > 0
        ? `INTERNAL LINKS (MANDATORY): You MUST naturally integrate the following internal links into the text using Markdown format [Anchor Text](URL):
        ${options.internalLinks.join('\n')}`
        : '';

    const externalLinksInstruction = options.externalLinks && options.externalLinks.length > 0
        ? `EXTERNAL LINKS (MANDATORY): You MUST naturally integrate the following external links into the text using Markdown format [Anchor Text](URL):
        ${options.externalLinks.join('\n')}`
        : '';
    
    const ctaInstruction = ctas.length > 0
        ? `CALL TO ACTION: Distribute these Call-to-Action phrases naturally throughout the section (bolded or italicized): ${ctas.join(' | ')}.`
        : '';


    const contentGapsText = Array.isArray(analysis.contentGaps) ? analysis.contentGaps.join(', ') : (analysis.contentGaps || '');
    const creativeIdeasText = Array.isArray(analysis.creativeIdeas) ? analysis.creativeIdeas.join(', ') : (analysis.creativeIdeas || '');

    let specificInstructions = '';
    if (sectionType === 'part1') {
        specificInstructions = `
        **MANDATORY INTRODUCTION (Sapo):**
        You MUST start the article immediately with this exact text (do not change it):
        ${sapo}
        
        ${ctaInstruction}
        
        Length Goal: Write approximately 500-600 words for this section (Intro + First main points).
        `;
    } else if (sectionType === 'part2') {
        specificInstructions = `
        This is the MIDDLE section of the article (Deep Dive).
        Continue seamlessly from the previous section. Do NOT write a new introduction.
        Focus on deep, detailed analysis of the assigned outline points.
        ${ctaInstruction}
        Length Goal: Write approximately 1000 words for this section.
        `;
    } else {
        specificInstructions = `
        This is the FINAL section of the article (Conclusion & Wrap up).
        Continue seamlessly from the previous section.
        Cover the remaining outline points and provide a strong conclusion.
        ${ctaInstruction}
        ${faqInstruction}
        Length Goal: Write the remaining necessary content to finish the article (approx 500+ words).
        `;
    }

    const prompt = `
    You are an expert content writer and SEO specialist. You are writing **${sectionType.toUpperCase()}** of a comprehensive article in ${lang}.
    The final output should be only the Markdown text for this specific section.

    ---
    ### CORE CONTEXT
    **Article Title:** ${title}
    **Target Persona:** ${persona.summary}
    **Analysis Insights (Integrate these):**
      - **Gaps:** ${contentGapsText}
      - **Ideas:** ${creativeIdeasText}
      - **Breakthroughs:** ${analysis.breakthroughs?.uniqueInsights || ''}.

    ---
    ### SECTION INSTRUCTIONS
    ${specificInstructions}

    ---
    ### GENERAL REQUIREMENTS
    **Content Principles:** Helpful, people-first, high E-E-A-T. Adhere to Google HCU guidelines.
    ${writingStyleInstruction}
    ${invertedPyramidInstruction}
    ${aiOverviewInstruction}
    ${tableInstruction}
    ${quoteInstruction}
    ${wikipediaInstruction}
    ${internalLinksInstruction}
    ${externalLinksInstruction}
    ${imageInstruction}
    
    **FORMATTING RULES:**
    - Use Markdown H2 (##) for main section headings.
    - Use Markdown H3 (###) for subsections.
    - Use Blockquotes (> Text) for quotes/takeaways.
    - Use standard Markdown links [Text](URL).

    ---
    ### OUTLINE FOR THIS SECTION (MANDATORY)
    Strictly follow these points for this section:
    ---
    ${outlineString}
    ---
    `;

    const response = await callGemini(prompt, 'pro', false);
    return response || null;
};

interface EvaluateArticleSeoParams {
  articleContent: string;
  title: string;
  metaDescription: string;
  primaryKeyword: string;
  lsiKeywords: string[];
  objectiveDescriptions: string[];
  writingStyle: WritingStyle;
  options: {
    includeFaq: boolean;
    useTables: boolean;
  };
  language: Language;
}

const evaluateArticleSeo = async (params: EvaluateArticleSeoParams): Promise<SeoChecklistResult | null> => {
    const { articleContent, title, metaDescription, primaryKeyword, lsiKeywords, objectiveDescriptions, writingStyle, options, language } = params;
    const lang = language === 'en' ? 'English' : 'Vietnamese';

    // Optimize content size for prompt if it's too large, preserving start and end where key SEO elements usually live.
    const contentToAnalyze = articleContent.length > 50000 
        ? articleContent.substring(0, 25000) + "\n...[Content Truncated]...\n" + articleContent.substring(articleContent.length - 10000)
        : articleContent;

    const prompt = `
    You are a world-class SEO expert. Analyze the provided article content based on a strict checklist. For each criterion, you must provide a boolean "pass" value (true if it meets the criterion, false otherwise) and a concise "reason" string (max 150 characters) in ${lang} explaining your evaluation.

    **Context:**
    - **Primary Keyword:** ${primaryKeyword}
    - **LSI Keywords:** ${lsiKeywords.slice(0, 10).join(', ')}
    - **Target Objectives:** ${objectiveDescriptions.join('; ')}
    - **Requested Writing Style:** ${writingStyle}
    - **Was "Include FAQs" requested?** ${options.includeFaq}
    - **Was "Use Tables" requested?** ${options.useTables}

    **Content for Analysis:**
    - **Title:** ${title}
    - **Meta Description:** ${metaDescription}
    - **Article Body (Markdown):**
    ---
    ${contentToAnalyze}
    ---

    **Checklist for Evaluation:**

    1.  **primaryKeyword**: Does the primary keyword appear naturally in the title, meta description, and early in the article?
    2.  **title**: Is the title well-written, grammatically correct, contains the primary keyword, and is between 50-60 characters long?
    3.  **metaDescription**: Is the meta description well-written, grammatically correct, contains the primary keyword, and is between 140-160 characters long?
    4.  **sapo**: Is the introduction (Sapo) engaging, contains the primary keyword, and summarizes the value?
    5.  **aiOverview**: Is the content structured with clear, concise answers, lists, and headings, making it suitable for Google's AI Overview/Featured Snippets?
    6.  **h1**: Does the main title (acting as H1) contain the primary keyword?
    7.  **headings**: Are H2-H6 headings used logically to structure the content?
    8.  **writingStyle**: Does the article consistently follow the requested writing style?
    9.  **tables**: If tables were requested, are they present and used appropriately? If not requested, this check should pass.
    10. **trust**: Does the content feel trustworthy? Does it present information in a way that builds confidence (similar to how authoritative sites do)?
    11. **expertise**: Does the article demonstrate expertise on the topic? Is the information accurate, comprehensive, and well-explained?
    12. **images**: Are image placeholders used within the article body (e.g. ![...])?
    13. **faqs**: If FAQs were requested, is there a dedicated FAQ section? If not requested, this check should pass.
    14. **objectives**: Does the article successfully fulfill the target objectives provided?
    15. **creativity**: Does the article show creativity and originality, avoiding generic content?

    The final output MUST be a single, valid JSON object with the exact following structure:
    {
      "primaryKeyword": { "pass": boolean, "reason": "..." },
      "title": { "pass": boolean, "reason": "..." },
      "metaDescription": { "pass": boolean, "reason": "..." },
      "sapo": { "pass": boolean, "reason": "..." },
      "aiOverview": { "pass": boolean, "reason": "..." },
      "h1": { "pass": boolean, "reason": "..." },
      "headings": { "pass": boolean, "reason": "..." },
      "writingStyle": { "pass": boolean, "reason": "..." },
      "tables": { "pass": boolean, "reason": "..." },
      "trust": { "pass": boolean, "reason": "..." },
      "expertise": { "pass": boolean, "reason": "..." },
      "images": { "pass": boolean, "reason": "..." },
      "faqs": { "pass": boolean, "reason": "..." },
      "objectives": { "pass": boolean, "reason": "..." },
      "creativity": { "pass": boolean, "reason": "..." }
    }
    `;

    // Use flashModel for SEO check as it's faster and less prone to strict JSON formatting errors with large context
    const response = await callGemini(prompt, 'flash', true);
    if (!response) return null;
    return safeJsonParse<SeoChecklistResult>(response);
};


export const geminiService = {
    generatePersona,
    generateKeywords,
    analyzeWebForKeywords,
    generateManualAnalysis,
    generateObjectives,
    generateTitles,
    generateMetaDescriptions,
    generateSapos,
    generateCtas,
    generateOutline, // V2.2 updated
    generateImages,
    generateArticleSection, // V2.2 updated
    evaluateArticleSeo, // V2.2 updated
};