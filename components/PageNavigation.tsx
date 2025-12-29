
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from './ui/Button';

const STEPS = [
    { path: '/', label: 'Product Info' },
    { path: '/personas', label: 'Personas' },
    { path: '/seo-keywords', label: 'SEO Keywords' },
    { path: '/collect-analyze', label: 'Analyze' },
    { path: '/objectives', label: 'Objectives' },
    { path: '/titles', label: 'Titles' },
    { path: '/meta-description', label: 'Meta Description' },
    { path: '/sapo', label: 'Sapo' },
    { path: '/cta', label: 'CTA' },
    { path: '/outline', label: 'Outline' },
    { path: '/image-generation', label: 'Image Gen' },
    { path: '/write-publish', label: 'Write & Publish' },
    { path: '/seo-checklist', label: 'Checklist' },
    { path: '/library', label: 'Library' },
];

export const PageNavigation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const currentIndex = STEPS.findIndex(step => step.path === location.pathname);
    const nextStep = currentIndex < STEPS.length - 1 ? STEPS[currentIndex + 1] : null;
    const prevStep = currentIndex > 0 ? STEPS[currentIndex - 1] : null;

    if (currentIndex === -1) return null;

    return (
        <div className="mt-xl pt-lg border-t border-border flex items-center justify-between">
            <div>
                {prevStep && (
                    <Button variant="secondary" onClick={() => navigate(prevStep.path)}>
                        ← {prevStep.label}
                    </Button>
                )}
            </div>
            <div>
                {nextStep && (
                    <Button onClick={() => navigate(nextStep.path)}>
                        {nextStep.label} →
                    </Button>
                )}
            </div>
        </div>
    );
};
