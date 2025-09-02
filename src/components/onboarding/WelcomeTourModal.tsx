// src/components/onboarding/WelcomeTourModal.tsx
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Play, Target, BarChart3, FileText, CheckCircle, Zap, Shield, Star } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useAppStore } from '../../store/useAppStore';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  highlight?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  stats?: {
    value: string;
    label: string;
    icon: React.ReactNode;
  }[];
}

const WelcomeTourModal: React.FC = () => {
  const { modals, closeWelcomeTourModal } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: "Welcome to ApplyTrak! 🚀",
      description: "Your professional job application tracker. Let's get you organized in just 3 minutes.",
      icon: <Play className="h-8 w-8 text-blue-500" />,
      stats: [
        {
          value: "100%",
          label: "Secure",
          icon: <Shield className="h-4 w-4 text-blue-500" />
        },
        {
          value: "Fast",
          label: "Setup",
          icon: <Zap className="h-4 w-4 text-green-500" />
        },
        {
          value: "Pro",
          label: "Quality",
          icon: <Star className="h-4 w-4 text-yellow-500" />
        }
      ]
    },
    {
      id: 'track-everything',
      title: "Track Everything in One Place",
      description: "No more scattered spreadsheets or forgotten applications. Store all your job details together with smart organization.",
      icon: <FileText className="h-8 w-8 text-green-500" />
    },
    {
      id: 'see-progress',
      title: "See Your Progress at a Glance",
      description: "Visual progress bars and simple analytics show how close you are to your goals and help you stay motivated.",
      icon: <BarChart3 className="h-8 w-8 text-purple-500" />
    },
    {
      id: 'stay-organized',
      title: "Never Miss a Follow-up",
      description: "Keep track of application status, follow-ups, and important dates. Stay organized throughout your job search.",
      icon: <Target className="h-8 w-8 text-orange-500" />
    },
    {
      id: 'ready',
      title: "You're All Set! 🎯",
      description: "ApplyTrak is ready to help you stay organized. Start tracking your applications and watch your progress grow!",
      icon: <CheckCircle className="h-8 w-8 text-green-500" />
    }
  ];

  useEffect(() => {
    if (modals.welcomeTour?.isOpen) {
      setCurrentStep(0);
    }
  }, [modals.welcomeTour?.isOpen]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    closeWelcomeTourModal();
  };

  const currentTourStep = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  if (!modals.welcomeTour?.isOpen) return null;

  return (
    <Modal
      isOpen={modals.welcomeTour?.isOpen || false}
      onClose={closeWelcomeTourModal}
      title=""
      size="xl"
    >
      <div className="relative">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200 rounded-t-lg">
          <div 
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-300 rounded-t-lg"
            style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
          />
        </div>

        {/* Content */}
        <div className="pt-8 pb-6 px-8">
          {/* Header Section - Enhanced with better design */}
          <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200/30 dark:border-blue-700/30 mb-8">
            <div className="text-center py-8">
              {/* Step Icon and Title */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 mb-6 shadow-lg">
                {currentTourStep.icon}
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {currentTourStep.title}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                {currentTourStep.description}
              </p>
              
              {/* Stats Section for Welcome Step */}
              {currentTourStep.stats && (
                <div className="grid grid-cols-3 gap-4 mt-8 max-w-md mx-auto">
                  {currentTourStep.stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        {stat.icon}
                      </div>
                      <div className="text-xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-xs text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Step Indicators - Enhanced */}
          <div className="glass-card mb-8">
            <div className="flex justify-center space-x-2 py-6">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    index === currentStep
                      ? 'bg-blue-500 scale-125'
                      : index < currentStep
                      ? 'bg-green-400'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Navigation - Enhanced */}
          <div className="glass-card">
            <div className="flex justify-between items-center py-6">
              <button
                onClick={handleSkip}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium transition-colors"
              >
                Skip Tour
              </button>

              <div className="flex space-x-3">
                <button
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  className={`flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    isFirstStep
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>

                <button
                  onClick={isLastStep ? handleSkip : handleNext}
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  {isLastStep ? 'Get Started' : 'Next'}
                  {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeTourModal;
