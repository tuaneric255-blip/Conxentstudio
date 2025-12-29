
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/Button';

const STEPS = [
    { path: '/', label: 'Product' },
    { path: '/personas', label: 'Persona' },
    { path: '/seo-keywords', label: 'Keywords' },
    { path: '/collect-analyze', label: 'Analyze' },
    { path: '/objectives', label: 'Objectives' },
    { path: '/titles', label: 'Titles' },
    { path: '/meta-description', label: 'Meta' },
    { path: '/sapo', label: 'Sapo' },
    { path: '/cta', label: 'CTA' },
    { path: '/outline', label: 'Outline' },
    { path: '/image-generation', label: 'Images' },
    { path: '/write-publish', label: 'Write' },
    { path: '/seo-checklist', label: 'Checklist' },
    { path: '/library', label: 'Library' },
];

export const PageNavigation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const currentIndex = STEPS.findIndex(step => step.path === location.pathname);
    if (currentIndex === -1) return null;

    const nextStep = currentIndex < STEPS.length - 1 ? STEPS[currentIndex + 1] : null;
    const prevStep = currentIndex > 0 ? STEPS[currentIndex - 1] : null;

    const progress = Math.round(((currentIndex + 1) / STEPS.length) * 100);

    return (
        /* 
           Fixed position: 
           - Mobile: bottom-20 (above BottomNavBar 64px)
           - Desktop: bottom-8
        */
        <div className="fixed bottom-[76px] md:bottom-8 left-1/2 -translate-x-1/2 z-[45] w-[90%] max-w-lg pointer-events-none">
            <div className="bg-panel/80 backdrop-blur-md border border-primary/20 shadow-2xl rounded-full p-2 flex items-center justify-between pointer-events-auto ring-1 ring-black/5">
                
                {/* Previous Button */}
                <div className="w-1/3 flex justify-start">
                    {prevStep ? (
                        <button 
                            onClick={() => navigate(prevStep.path)}
                            className="flex items-center gap-1 pl-2 pr-4 py-2 rounded-full hover:bg-primary/10 text-primary transition-all group"
                            title={prevStep.label}
                        >
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">{prevStep.label}</span>
                        </button>
                    ) : <div className="w-8" />}
                </div>

                {/* Progress Circle & Step Info */}
                <div className="flex flex-col items-center justify-center px-4 border-x border-border/50">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {currentIndex + 1} / {STEPS.length}
                        </span>
                    </div>
                    <p className="text-[9px] font-bold text-muted uppercase tracking-tighter mt-0.5 hidden sm:block">
                        {STEPS[currentIndex].label}
                    </p>
                </div>

                {/* Next Button */}
                <div className="w-1/3 flex justify-end">
                    {nextStep ? (
                        <button 
                            onClick={() => navigate(nextStep.path)}
                            className="flex items-center gap-1 pl-4 pr-2 py-2 rounded-full bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group"
                        >
                            <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">{nextStep.label}</span>
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    ) : (
                        <div className="pr-2">
                             <span className="text-[10px] font-bold text-success uppercase">Finish 🎉</span>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Minimal Progress Bar below the pill */}
            <div className="w-1/2 mx-auto h-1 bg-border/30 rounded-full mt-2 overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-500 ease-out" 
                    style={{ width: `${progress}%` }}
                />
            </div>
        </div>
    );
};
