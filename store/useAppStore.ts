
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppData, ActiveIds, ToastMessage, Language, Theme, ProductInfo, Persona, KeywordSet, Analysis, ObjectiveSet, TitleSet, MetaDescriptionSet, SapoSet, CtaSet, Outline, ImageSet, Article, ID, GoogleConfig } from '../types';
import { uuidv4 } from '../utils';

interface AppState {
  data: AppData;
  activeIds: ActiveIds;
  toasts: ToastMessage[];
  language: Language;
  theme: Theme;
  userName: string;
  geminiApiKey: string;
  googleConfig: GoogleConfig;
  isTourOpen: boolean;
  isSidebarCollapsed: boolean;

  // Actions
  addProduct: (product: Omit<ProductInfo, 'id' | 'createdAt'>) => void;
  addPersona: (persona: Omit<Persona, 'id' | 'createdAt'>) => void;
  addKeywordSet: (keywordSet: Omit<KeywordSet, 'id' | 'createdAt'>) => void;
  addAnalysis: (analysis: Omit<Analysis, 'id' | 'createdAt'>) => void;
  addObjectiveSet: (objectiveSet: Omit<ObjectiveSet, 'id' | 'createdAt'>) => void;
  addTitleSet: (titleSet: Omit<TitleSet, 'id' | 'createdAt'>) => void;
  addMetaDescriptionSet: (mds: Omit<MetaDescriptionSet, 'id' | 'createdAt'>) => void;
  addSapoSet: (sapoSet: Omit<SapoSet, 'id' | 'createdAt'>) => void;
  addCtaSet: (ctaSet: Omit<CtaSet, 'id' | 'createdAt'>) => void;
  addOutline: (outline: Omit<Outline, 'id' | 'createdAt'>) => void;
  addImageSet: (imageSet: Omit<ImageSet, 'id' | 'createdAt'>) => void;
  addArticle: (article: Omit<Article, 'id' | 'createdAt'>) => void;

  setActiveId: <K extends keyof ActiveIds>(key: K, value: ActiveIds[K]) => void;
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  setUserName: (name: string) => void;
  setGeminiApiKey: (key: string) => void;
  setGoogleConfig: (config: GoogleConfig) => void;
  toggleTour: () => void;
  toggleSidebar: () => void;
}

const initialState: { data: AppData; activeIds: ActiveIds; googleConfig: GoogleConfig; geminiApiKey: string; isTourOpen: boolean; isSidebarCollapsed: boolean } = {
    data: {
        products: {},
        personas: {},
        keywordSets: {},
        analyses: {},
        objectiveSets: {},
        titleSets: {},
        metaDescriptionSets: {},
        sapoSets: {},
        ctaSets: {},
        outlines: {},
        imageSets: {},
        articles: {},
    },
    activeIds: {
      keywordIds: [],
      objectiveIds: [],
      ctaIds: [],
      imageIds: [],
    },
    geminiApiKey: '',
    googleConfig: {
        clientId: '',
        apiKey: ''
    },
    isTourOpen: false,
    isSidebarCollapsed: false
};


export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...initialState,
      toasts: [],
      language: 'en',
      theme: 'dark',
      userName: '',

      addProduct: (product) => set(state => {
        const id = uuidv4();
        const newProduct = { ...product, id, createdAt: new Date().toISOString() };
        return { 
            data: { ...state.data, products: { ...state.data.products, [id]: newProduct } },
            activeIds: { ...state.activeIds, productId: id }
        };
      }),

      addPersona: (persona) => set(state => {
        const id = uuidv4();
        const newPersona = { ...persona, id, createdAt: new Date().toISOString() };
        return {
            data: { ...state.data, personas: { ...state.data.personas, [id]: newPersona } },
            activeIds: { ...state.activeIds, personaId: id }
        }
      }),
      
      addKeywordSet: (keywordSet) => set(state => {
        const id = uuidv4();
        const newSet = { ...keywordSet, id, createdAt: new Date().toISOString() };
        return {
            data: { ...state.data, keywordSets: { ...state.data.keywordSets, [id]: newSet } },
            activeIds: { ...state.activeIds, keywordSetId: id, keywordIds: [] }
        }
      }),

      addAnalysis: (analysis) => set(state => {
        const id = uuidv4();
        const newAnalysis = { ...analysis, id, createdAt: new Date().toISOString() };
        return {
            data: { ...state.data, analyses: { ...state.data.analyses, [id]: newAnalysis } },
            activeIds: { ...state.activeIds, analysisId: id }
        }
      }),

      addObjectiveSet: (objectiveSet) => set(state => {
        const id = uuidv4();
        const newSet = { ...objectiveSet, id, createdAt: new Date().toISOString() };
        return {
            data: { ...state.data, objectiveSets: { ...state.data.objectiveSets, [id]: newSet } },
            activeIds: { ...state.activeIds, objectiveSetId: id, objectiveIds: newSet.options.slice(0, 3).map(o => o.id) }
        }
      }),

      addTitleSet: (titleSet) => set(state => {
        const id = uuidv4();
        const newSet = { ...titleSet, id, createdAt: new Date().toISOString() };
        return {
            data: { ...state.data, titleSets: { ...state.data.titleSets, [id]: newSet } },
            activeIds: { ...state.activeIds, titleSetId: id, titleId: newSet.options[0]?.id }
        }
      }),

      addMetaDescriptionSet: (mds) => set(state => {
        const id = uuidv4();
        const newSet = { ...mds, id, createdAt: new Date().toISOString() };
        return {
            data: { ...state.data, metaDescriptionSets: { ...state.data.metaDescriptionSets, [id]: newSet } },
            activeIds: { ...state.activeIds, metaDescriptionSetId: id, metaDescriptionId: newSet.options[0]?.id }
        }
      }),

      addSapoSet: (sapoSet) => set(state => {
        const id = uuidv4();
        const newSet = { ...sapoSet, id, createdAt: new Date().toISOString() };
        return {
            data: { ...state.data, sapoSets: { ...state.data.sapoSets, [id]: newSet } },
            activeIds: { ...state.activeIds, sapoSetId: id, sapoId: newSet.options[0]?.id }
        }
      }),

      addCtaSet: (ctaSet) => set(state => {
        const id = uuidv4();
        const newSet = { ...ctaSet, id, createdAt: new Date().toISOString() };
        return {
            data: { ...state.data, ctaSets: { ...state.data.ctaSets, [id]: newSet } },
            activeIds: { ...state.activeIds, ctaSetId: id, ctaId: newSet.options[0]?.id, ctaIds: [] }
        }
      }),

      addOutline: (outline) => set(state => {
        const id = uuidv4();
        const newOutline = { ...outline, id, createdAt: new Date().toISOString() };
        return {
            data: { ...state.data, outlines: { ...state.data.outlines, [id]: newOutline } },
            activeIds: { ...state.activeIds, outlineId: id }
        }
      }),
      
      addImageSet: (imageSet) => set(state => {
        const id = uuidv4();
        const newSet = { ...imageSet, id, createdAt: new Date().toISOString() };
        return {
            data: { ...state.data, imageSets: { ...state.data.imageSets, [id]: newSet } },
            activeIds: { ...state.activeIds, imageSetId: id, imageIds: newSet.options.map(o => o.id), featureImageId: newSet.options[0]?.id }
        }
      }),
      
      addArticle: (article) => set(state => {
        const id = uuidv4();
        const newArticle = { ...article, id, createdAt: new Date().toISOString() };
        return {
            data: { ...state.data, articles: { ...state.data.articles, [id]: newArticle } },
            activeIds: { ...state.activeIds, activeArticleId: id },
        }
      }),
      
      setActiveId: (key, value) => set(state => {
        const newActiveIds = { ...state.activeIds, [key]: value };
        
        if (key === 'productId') newActiveIds.personaId = undefined;
        if (key === 'productId' || key === 'personaId') {
            newActiveIds.keywordSetId = undefined;
            newActiveIds.keywordIds = [];
        }
        if (key === 'productId' || key === 'personaId' || key === 'keywordSetId' || key === 'keywordIds') {
            newActiveIds.analysisId = undefined;
        }
        if (key === 'productId' || key === 'personaId' || key === 'keywordSetId' || key === 'keywordIds' || key === 'analysisId') {
            newActiveIds.objectiveSetId = undefined;
            newActiveIds.objectiveIds = [];
        }
        if (key === 'productId' || key === 'personaId' || key === 'keywordSetId' || key === 'keywordIds' || key === 'analysisId' || key === 'objectiveIds' || key === 'objectiveSetId') {
             newActiveIds.titleSetId = undefined;
             newActiveIds.titleId = undefined;
        }
        if (key === 'productId' || key === 'personaId' || key === 'keywordSetId' || key === 'keywordIds' || key === 'analysisId' || key === 'objectiveIds' || key === 'objectiveSetId' || key === 'titleId') {
            newActiveIds.metaDescriptionSetId = undefined;
            newActiveIds.metaDescriptionId = undefined;
        }
        if (key === 'productId' || key === 'personaId' || key === 'keywordSetId' || key === 'keywordIds' || key === 'analysisId' || key === 'objectiveIds' || key === 'objectiveSetId' || key === 'titleId' || key === 'metaDescriptionId') {
            newActiveIds.sapoSetId = undefined;
            newActiveIds.sapoId = undefined;
        }
        if (key === 'productId' || key === 'personaId' || key === 'keywordSetId' || key === 'keywordIds' || key === 'analysisId' || key === 'objectiveIds' || key === 'objectiveSetId' || key === 'titleId' || key === 'metaDescriptionId' || key === 'sapoId') {
            newActiveIds.ctaSetId = undefined;
            newActiveIds.ctaId = undefined;
            newActiveIds.ctaIds = [];
        }
         if (key === 'productId' || key === 'personaId' || key === 'keywordSetId' || key === 'keywordIds' || key === 'analysisId' || key === 'objectiveIds' || key === 'objectiveSetId' || key === 'titleId' || key === 'metaDescriptionId' || key === 'sapoId' || key === 'ctaId') {
            newActiveIds.outlineId = undefined;
        }
        if (key === 'productId' || key === 'personaId' || key === 'keywordSetId' || key === 'keywordIds' || key === 'analysisId' || key === 'objectiveIds' || key === 'objectiveSetId' || key === 'titleId' || key === 'metaDescriptionId' || key === 'sapoId' || key === 'ctaId' || key === 'outlineId') {
            newActiveIds.imageSetId = undefined;
            newActiveIds.imageIds = [];
            newActiveIds.featureImageId = undefined;
            newActiveIds.activeArticleId = undefined;
        }

        return { activeIds: newActiveIds };
      }),
      
      addToast: (toast) => {
        const id = uuidv4();
        set(state => ({ toasts: [...state.toasts, { ...toast, id }] }));
        setTimeout(() => get().removeToast(id), 5000);
      },

      removeToast: (id) => set(state => ({
        toasts: state.toasts.filter(t => t.id !== id),
      })),

      setLanguage: (language) => set({ language }),

      setTheme: (theme) => set({ theme }),
      
      setUserName: (name) => set({ userName: name }),
      
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),

      setGoogleConfig: (config) => set({ googleConfig: config }),
      
      toggleTour: () => set(state => ({ isTourOpen: !state.isTourOpen })),

      toggleSidebar: () => set(state => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),

    }),
    {
      name: 'app-storage', 
      storage: createJSONStorage(() => localStorage), 
      partialize: (state) => ({ 
          data: state.data, 
          activeIds: state.activeIds, 
          language: state.language, 
          theme: state.theme, 
          userName: state.userName,
          geminiApiKey: state.geminiApiKey,
          googleConfig: state.googleConfig,
          isSidebarCollapsed: state.isSidebarCollapsed
      }),
    }
  )
);
