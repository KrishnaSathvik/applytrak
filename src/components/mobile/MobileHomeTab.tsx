import React, { useState } from 'react';
import { CheckCircle, X, Target, BarChart3, Upload, Star, Zap, Shield, Award, Trophy } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

import ImportModal from '../modals/ImportModal';
import MobileWelcomeTourModal from './MobileWelcomeTourModal';

const MobileHomeTab: React.FC = () => {
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
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Hero Section - Mobile Optimized */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200/30 dark:border-blue-700/30 relative overflow-hidden">
            {/* Background Logo Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <img 
                src="/logo.png" 
                alt="ApplyTrak Logo" 
                className="w-32 h-32"
              />
            </div>
            <div className="text-center py-8 relative z-10">
              {/* New App Badge */}
              <div className="flex justify-center mb-4">
                <div className="inline-flex items-center px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                  <Star className="h-3 w-3 mr-1.5 fill-current" />
                  Professional Job Application Tracker
                </div>
              </div>

              {/* Brand Logo Section */}
              <div className="flex justify-center items-center mb-8">
                <img 
                  src="/logo.png" 
                  alt="ApplyTrak Logo" 
                  className="w-24 h-24 transition-transform duration-300 hover:scale-110"
                />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent mb-4">
                Track Your Job Applications
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto leading-relaxed">
                A powerful, professional tool to organize your job search. Track applications, set goals, 
                and stay organized throughout your job hunting journey.
              </p>
              
              <div className="flex flex-col gap-3 justify-center mb-6">
                <button
                  onClick={handleOpenApp}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-base px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
                >
                  Try ApplyTrak
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={handleImportApplications}
                    className="flex-1 border-2 border-blue-600 dark:border-blue-400 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-sm px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                  >
                    Import Data
                  </button>
                  <button
                    onClick={handleStartTour}
                    className="flex-1 border-2 border-green-600 dark:border-green-400 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 text-sm px-4 py-2 rounded-lg font-semibold transition-all duration-200"
                  >
                    Take Tour
                  </button>
                </div>
              </div>
              
              {/* Feature Highlights */}
              <div className="grid grid-cols-1 gap-3 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 flex-shrink-0" />
                  <span>Unlimited applications</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                  <Zap className="h-4 w-4 text-yellow-500 dark:text-yellow-400 flex-shrink-0" />
                  <span>Import from CSV/Excel</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-gray-600 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 rounded-lg px-3 py-2">
                  <Shield className="h-4 w-4 text-blue-500 dark:text-blue-400 flex-shrink-0" />
                  <span>100% private & secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section - Mobile Optimized */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200/30 dark:border-red-700/30 mb-8">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                Job Hunting Can Be Overwhelming
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Keeping track of applications, follow-ups, and deadlines shouldn't be a full-time job.
              </p>
            </div>
          </div>
          
          <div className="grid gap-6">
            <div className="glass-card p-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Scattered Information</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Job details spread across emails, spreadsheets, and sticky notes.
                </p>
              </div>
            </div>
            
            <div className="glass-card p-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Missed Follow-ups</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Forgetting to follow up on applications or missing important deadlines.
                </p>
              </div>
            </div>
            
            <div className="glass-card p-4">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-3 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <X className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">No Progress Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Hard to see if you're making progress or need to adjust your strategy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section - Mobile Optimized */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-2 border-blue-200/30 dark:border-blue-700/30 mb-12">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">
                ApplyTrak Makes It Simple
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
                Everything you need to stay organized and track your job search progress.
              </p>
            </div>
          </div>
          
          <div className="space-y-12">
            {/* Feature 1: Goal Setting */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Set Meaningful Goals</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                Set weekly and monthly application targets to keep yourself motivated and on track. 
                Visual progress bars help you see how close you are to your goals.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Weekly and monthly targets</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Visual progress tracking</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Stay motivated with streaks</span>
                </li>
              </ul>
            </div>
            
            {/* Feature 2: Achievement System - NEW! */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Achievement System</h3>
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-2 py-1 rounded-full font-bold animate-pulse">
                    NEW
                  </span>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                Unlock achievements as you progress through your job search journey! Earn XP, level up, and unlock 
                special badges for milestones like applying to FAANG companies, maintaining streaks, and reaching goals.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">26+ achievements to unlock</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">XP & leveling system</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Real-time achievement unlocking</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Special FAANG Hunter achievement</span>
                </li>
              </ul>
            </div>
            
            {/* Feature 3: Analytics */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Track Your Progress</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                See your application pipeline at a glance. Track how many applications you've sent, 
                interviews you've had, and offers you've received.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Application status tracking</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Interview and offer tracking</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Simple visual charts</span>
                </li>
              </ul>
            </div>
            
            {/* Feature 3: Import */}
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Upload className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Import Your Data</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm leading-relaxed">
                Don't start from scratch. Import your existing applications from spreadsheets 
                or other job trackers to get started quickly.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">CSV and Excel import</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Smart field mapping</span>
                </li>
                <li className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 dark:text-green-400 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300">Quick setup process</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose ApplyTrak Section */}
      <section className="py-12 px-4 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Why Choose ApplyTrak?
            </h2>
            <p className="text-base text-gray-600 dark:text-gray-300 max-w-xl mx-auto">
              Professional, focused, and designed specifically for job seekers.
            </p>
          </div>
          
          <div className="grid gap-6">
            <div className="glass-card p-4 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Secure Cloud Sync</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Your data syncs securely to the cloud. Access from anywhere, never lose your progress.</p>
            </div>
            
            <div className="glass-card p-4 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Works Offline & Online</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Use it anywhere. Works offline and syncs when you're back online.</p>
            </div>
            
            <div className="glass-card p-4 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Professional Quality</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">Built with care and attention to detail for serious job seekers.</p>
            </div>
          </div>
        </div>
      </section>



      {/* Import Modal */}
      <ImportModal isOpen={showImportModal} onClose={handleImportModalClose} />
      
      {/* Welcome Tour Modal */}
      <MobileWelcomeTourModal />
    </div>
  );
};

export default MobileHomeTab;
