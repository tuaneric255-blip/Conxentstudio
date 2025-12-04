
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { useTranslations } from '../i18n';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

export const TourGuide: React.FC = () => {
  const isTourOpen = useAppStore(state => state.isTourOpen);
  const toggleTour = useAppStore(state => state.toggleTour);
  const t = useTranslations();
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const steps = t.tour.steps;

  // Auto-navigate when step changes
  useEffect(() => {
    if (isTourOpen && steps[currentStep] && steps[currentStep].route) {
        navigate(steps[currentStep].route);
    }
  }, [currentStep, isTourOpen, steps, navigate]);

  if (!isTourOpen) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      toggleTour();
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[120] flex items-center justify-center p-md">
      <div className="bg-panel rounded-xl shadow-2xl max-w-md w-full border-2 border-primary relative overflow-hidden animate-fade-in">
        <div className="absolute top-0 left-0 w-full h-1 bg-border">
            <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
        </div>
        
        <div className="p-lg pt-xl text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-md">
                <span className="text-2xl font-bold text-primary">{currentStep + 1}</span>
            </div>
            <h3 className="text-xl font-bold mb-sm">{steps[currentStep].title}</h3>
            <p className="text-muted mb-lg">{steps[currentStep].content}</p>
            
            <div className="flex justify-between items-center mt-lg">
                <Button variant="secondary" onClick={toggleTour} size="sm">{t.tour.skip}</Button>
                <div className="flex gap-sm">
                    {currentStep > 0 && (
                        <Button variant="secondary" onClick={handlePrev}>{t.tour.prev}</Button>
                    )}
                    <Button onClick={handleNext}>
                        {currentStep === steps.length - 1 ? t.tour.finish : t.tour.next}
                    </Button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
