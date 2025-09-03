import React, { useState } from 'react';
import { CheckCircle, X, Target, BarChart3, Upload, Star, Zap, Shield, Award } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

import ImportModal from '../modals/ImportModal';
import WelcomeTourModal from '../onboarding/WelcomeTourModal';

const HomeTab: React.FC = () => {
  const { setSelectedTab, setShowMarketingPage } = useAppStore();
  const [showImportModal, setShowImportModal] = useState(false);

  const handleOpenApp = () => {
    setShowMarketingPage(false);
    setSelectedTab('applications');
    // Mark that user has visited the site
    localStorage.setItem('applytrak_has_visited', 'true');
  };

  const handleImportApplications = () => {
    setShowImportModal(true);
  };

  const handleImportModalClose = () => {
    setShowImportModal(false);
  };

  const handleStartTour = () => {
    // Open welcome tour modal
    useAppStore.getState().openWelcomeTourModal();
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200/30 dark:border-blue-700/30 relative overflow-hidden">
        {/* Background Logo Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
          <img 
            src="/logo.png" 
            alt="ApplyTrak Logo" 
            className="w-48 h-48"
          />
        </div>
        <div className="text-center py-16 relative z-10">
          {/* New App Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
              <Star className="h-4 w-4 mr-2 fill-current" />
              Professional Job Application Tracker
            </div>
          </div>

          {/* Brand Logo Section */}
          <div className="flex justify-center items-center mb-12">
            <img 
              src="/logo.png" 
              alt="ApplyTrak Logo" 
              className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 transition-transform duration-300 hover:scale-110"
            />
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-6">
            Track Your Job Applications
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            A powerful, professional tool to organize your job search. Track applications, set goals, 
            and stay organized throughout your job hunting journey.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button
              onClick={handleOpenApp}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-lg px-8 py-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Try ApplyTrak
            </button>
            <div className="flex gap-2">
              <button
                onClick={handleImportApplications}
                className="border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-lg px-6 py-4 rounded-lg font-semibold transition-all duration-200"
              >
                Import Data
              </button>
              <button
                onClick={handleStartTour}
                className="border-2 border-green-600 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 text-lg px-6 py-4 rounded-lg font-semibold transition-all duration-200"
              >
                Take Tour
              </button>
            </div>
          </div>
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-lg px-4 py-3">
              <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 flex-shrink-0" />
              <span>Unlimited applications</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-lg px-4 py-3">
              <Zap className="h-5 w-5 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
              <span>Import from CSV/Excel</span>
            </div>
            <div className="flex items-center justify-center gap-3 text-sm text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-lg px-4 py-3">
              <Shield className="h-5 w-5 text-blue-500 dark:text-blue-400 flex-shrink-0" />
              <span>100% private & secure</span>
            </div>
          </div>
        </div>
      </div>

      {/* Problem Section */}
      <div className="glass-card bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200/30 dark:border-red-700/30 mb-12">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            Job Hunting Can Be Overwhelming
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-4xl mx-auto">
            Keeping track of applications, follow-ups, and deadlines shouldn't be a full-time job.
          </p>
        </div>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8">
        <div className="glass-card p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <X className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Scattered Information</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Job details spread across emails, spreadsheets, and sticky notes.
            </p>
          </div>
        </div>
        
        <div className="glass-card p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <X className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">Missed Follow-ups</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Forgetting to follow up on applications or missing important deadlines.
            </p>
          </div>
        </div>
        
        <div className="glass-card p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <X className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">No Progress Tracking</h3>
            <p className="text-gray-600 dark:text-gray-300">
              Hard to see if you're making progress or need to adjust your strategy.
            </p>
          </div>
        </div>
      </div>

      {/* Solution Section */}
      <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200/30 dark:border-blue-700/30 mb-16">
        <div className="text-center py-12">
          <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-100">
            ApplyTrak Makes It Simple
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Everything you need to stay organized and track your job search progress.
          </p>
        </div>
      </div>
      
      <div className="space-y-20">
        {/* Feature 1: Goal Setting */}
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Set Meaningful Goals</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
              Set weekly and monthly application targets to keep yourself motivated and on track. 
              Visual progress bars help you see how close you are to your goals.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Weekly and monthly targets</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Visual progress tracking</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Stay motivated with streaks</span>
              </li>
            </ul>
          </div>
          <div className="lg:w-1/2">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg p-8">
              <div className="text-center mb-4">
                <Target className="h-16 w-16 text-blue-600 dark:text-blue-400 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Goal Progress Tracking</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Weekly Goal</span>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">3/5</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full" style={{width: '60%'}}></div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Monthly Goal</span>
                  <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">12/20</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 dark:bg-purple-400 h-2 rounded-full" style={{width: '60%'}}></div>
                </div>
                <div className="text-center pt-2">
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">🔥 2-week streak!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Feature 2: Analytics */}
        <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
          <div className="lg:w-1/2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Track Your Progress</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
              See your application pipeline at a glance. Track how many applications you've sent, 
              interviews you've had, and offers you've received.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Application status tracking</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Interview and offer tracking</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Simple visual charts</span>
              </li>
            </ul>
          </div>
          <div className="lg:w-1/2">
            <div className="bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 rounded-lg p-8">
              <div className="text-center mb-4">
                <BarChart3 className="h-16 w-16 text-green-600 dark:text-green-400 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Application Overview</h4>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">15</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Total Applications</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Applied</span>
                    <span className="font-semibold text-gray-900 dark:text-gray-100">15</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Interviews</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">3</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Offers</span>
                    <span className="font-semibold text-green-600 dark:text-green-400">1</span>
                  </div>
                </div>
                <div className="text-center pt-2">
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">20% interview rate</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Feature 3: Import */}
        <div className="flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Upload className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Import Your Data</h3>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-lg leading-relaxed">
              Don't start from scratch. Import your existing applications from spreadsheets 
              or other job trackers to get started quickly.
            </p>
            <ul className="space-y-3">
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">CSV and Excel import</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Smart field mapping</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-500 dark:text-green-400 mr-3 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Quick setup process</span>
              </li>
            </ul>
          </div>
          <div className="lg:w-1/2">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg p-8">
              <div className="text-center mb-4">
                <Upload className="h-16 w-16 text-purple-600 dark:text-purple-400 mx-auto mb-3" />
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">Easy Import</h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">CSV Files</span>
                  <span className="text-green-600 dark:text-green-400">✓</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Excel Files</span>
                  <span className="text-green-600 dark:text-green-400">✓</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Smart Mapping</span>
                  <span className="text-green-600 dark:text-green-400">✓</span>
                </div>
                <div className="text-center pt-3">
                  <div className="text-lg font-bold text-purple-600 dark:text-purple-400">Get started in minutes</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">not hours</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose ApplyTrak Section */}
      <div className="glass-card bg-gray-50 dark:bg-gray-800">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Why Choose ApplyTrak?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Professional, focused, and designed specifically for job seekers.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="glass-card p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Secure Cloud Sync</h3>
            <p className="text-gray-600 dark:text-gray-300">Your data syncs securely to the cloud. Access from anywhere, never lose your progress.</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Zap className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Works Offline & Online</h3>
            <p className="text-gray-600 dark:text-gray-300">Use it anywhere. Works offline and syncs when you're back online.</p>
          </div>
          
          <div className="glass-card p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Award className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Professional Quality</h3>
            <p className="text-gray-600 dark:text-gray-300">Built with care and attention to detail for serious job seekers.</p>
          </div>
        </div>
      </div>



      {/* Import Modal */}
      <ImportModal isOpen={showImportModal} onClose={handleImportModalClose} />
      
      {/* Welcome Tour Modal */}
      <WelcomeTourModal />
    </div>
  );
};

export default HomeTab;
