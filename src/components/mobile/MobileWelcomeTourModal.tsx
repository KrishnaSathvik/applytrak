import React, { useState } from 'react';
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  FileText, 
  Target, 
  BarChart3, 
  User, 
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

const MobileWelcomeTourModal: React.FC = () => {
  const { modals, setSelectedTab, closeWelcomeTourModal } = useAppStore();
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps: TourStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to ApplyTrak!',
      description: 'Your personal job application tracker. Let\'s take a quick tour to get you started.',
      icon: Sparkles,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30'
    },
    {
      id: 'applications',
      title: 'Track Applications',
      description: 'Add and manage all your job applications in one place. Keep track of status, dates, and important details.',
      icon: FileText,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/30'
    },
    {
      id: 'goals',
      title: 'Set Goals',
      description: 'Set weekly, monthly, and total goals to stay motivated and track your progress.',
      icon: Target,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30'
    },
    {
      id: 'analytics',
      title: 'View Analytics',
      description: 'See your application progress, success rates, and insights to improve your job search.',
      icon: BarChart3,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30'
    },
    {
      id: 'profile',
      title: 'Manage Profile',
      description: 'Customize your account, manage settings, and export your data whenever you need it.',
      icon: User,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30'
    },
    {
      id: 'features',
      title: 'Explore Features',
      description: 'Discover all the powerful features ApplyTrak offers to supercharge your job search.',
      icon: Star,
      color: 'text-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30'
    }
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
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

  const handleFinish = () => {
    closeWelcomeTourModal();
    // Optionally navigate to applications tab
    setSelectedTab('applications');
  };

  const handleTryFeature = () => {
    const currentStepData = tourSteps[currentStep];
    switch (currentStepData.id) {
      case 'applications':
        setSelectedTab('applications');
        break;
      case 'goals':
        setSelectedTab('goals');
        break;
      case 'analytics':
        setSelectedTab('analytics');
        break;
      case 'profile':
        setSelectedTab('profile');
        break;
      case 'features':
        setSelectedTab('features');
        break;
    }
    closeWelcomeTourModal();
  };

  const currentStepData = tourSteps[currentStep];
  const Icon = currentStepData.icon;

  if (!modals?.welcomeTour?.isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm">
      <div className="fixed inset-0 flex items-end justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-t-2xl shadow-2xl">
          {/* Header */}
          <div className="relative p-6 pb-4">
            <button
              onClick={handleSkip}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            
            {/* Progress Indicator */}
            <div className="flex justify-center mb-6">
              <div className="flex space-x-2">
                {tourSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentStep
                        ? 'bg-blue-600'
                        : index < currentStep
                        ? 'bg-blue-300'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Step Content */}
            <div className="text-center">
              <div className={`w-16 h-16 ${currentStepData.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <Icon className={`h-8 w-8 ${currentStepData.color}`} />
              </div>
              
              <h2 className="mobile-text-xl mobile-font-bold text-gray-900 dark:text-gray-100 mb-3">
                {currentStepData.title}
              </h2>
              
              <p className="mobile-text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {currentStepData.description}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 pt-4">
            <div className="mobile-space-y-3">
              {/* Try Feature Button (for feature steps) */}
              {currentStepData.id !== 'welcome' && (
                <button
                  onClick={handleTryFeature}
                  className="w-full btn btn-primary mobile-flex mobile-items-center mobile-justify-center mobile-gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  Try This Feature
                </button>
              )}

              {/* Navigation Buttons */}
              <div className="mobile-flex mobile-gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="flex-1 btn btn-secondary mobile-flex mobile-items-center mobile-justify-center mobile-gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                )}
                
                <button
                  onClick={handleNext}
                  className={`flex-1 btn ${
                    currentStep === tourSteps.length - 1 ? 'btn-primary' : 'btn-secondary'
                  } mobile-flex mobile-items-center mobile-justify-center mobile-gap-2`}
                >
                  {currentStep === tourSteps.length - 1 ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Get Started
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Skip Button */}
              <button
                onClick={handleSkip}
                className="w-full mobile-text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Skip Tour
              </button>
            </div>
          </div>

          {/* Step Counter */}
          <div className="px-6 pb-6">
            <div className="text-center">
              <span className="mobile-text-xs text-gray-500">
                Step {currentStep + 1} of {tourSteps.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileWelcomeTourModal;
