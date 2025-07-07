import React, {useEffect} from 'react';
import {Star, Target, TrendingUp, Trophy, X} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';

const MilestoneModal: React.FC = () => {
    // 🔧 FIXED: Use goalProgress instead of progress
    const {modals, closeMilestone, goalProgress} = useAppStore();
    const {milestone} = modals;

    // Trigger confetti when modal opens
    useEffect(() => {
        if (milestone.isOpen && typeof window !== 'undefined' && (window as any).confetti) {
            // Initial burst
            (window as any).confetti({
                particleCount: 100,
                spread: 70,
                origin: {y: 0.6}
            });

            // Secondary burst after delay
            setTimeout(() => {
                (window as any).confetti({
                    particleCount: 50,
                    spread: 50,
                    origin: {y: 0.7}
                });
            }, 500);
        }
    }, [milestone.isOpen]);

    const getMilestoneIcon = (message?: string) => {
        if (!message) return '🏆'; // Default icon
        if (message.includes('50')) return '🎯';
        if (message.includes('100')) return '💯';
        if (message.includes('150')) return '🚀';
        if (message.includes('200')) return '🌟';
        if (message.includes('250')) return '💎';
        if (message.includes('300')) return '👑';
        return '🏆';
    };

    const getMilestoneColor = (message?: string) => {
        if (!message) return 'from-primary-500 to-primary-600'; // Default color
        if (message.includes('50')) return 'from-blue-500 to-blue-600';
        if (message.includes('100')) return 'from-green-500 to-green-600';
        if (message.includes('150')) return 'from-purple-500 to-purple-600';
        if (message.includes('200')) return 'from-yellow-500 to-yellow-600';
        if (message.includes('250')) return 'from-pink-500 to-pink-600';
        if (message.includes('300')) return 'from-indigo-500 to-indigo-600';
        return 'from-primary-500 to-primary-600';
    };

    const getEncouragementMessage = (message?: string) => {
        if (!message) return "Every application brings you closer to your goal!"; // Default message
        if (message.includes('50')) return "You're building great momentum! Keep going!";
        if (message.includes('100')) return "Triple digits! You're showing serious dedication!";
        if (message.includes('150')) return "Incredible persistence! You're unstoppable!";
        if (message.includes('200')) return "Amazing commitment! Your dream job is getting closer!";
        if (message.includes('250')) return "Phenomenal dedication! You're an application machine!";
        if (message.includes('300')) return "Legendary status achieved! You're truly inspiring!";
        return "Every application brings you closer to your goal!";
    };

    const getNextMilestone = (message?: string) => {
        if (!message) return null; // Return null for undefined
        if (message.includes('50')) return 100;
        if (message.includes('100')) return 150;
        if (message.includes('150')) return 200;
        if (message.includes('200')) return 250;
        if (message.includes('250')) return 300;
        if (message.includes('300')) return 500;
        return null;
    };

    if (!milestone.isOpen) return null;

    const nextMilestone = getNextMilestone(milestone.message);
    // 🔧 FIXED: Use goalProgress instead of progress
    const currentCount = goalProgress.totalApplications;
    const progressToNext = nextMilestone ? Math.min((currentCount / nextMilestone) * 100, 100) : 100;

    return (
        <div className="modal-overlay" onClick={closeMilestone}>
            <div className="modal-content max-w-md animate-bounce-subtle" onClick={(e) => e.stopPropagation()}>
                {/* Enhanced Celebration Header */}
                <div
                    className={`bg-gradient-to-r ${getMilestoneColor(milestone.message)} text-white rounded-t-xl p-6 text-center relative overflow-hidden`}>
                    <button
                        onClick={closeMilestone}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20"
                        aria-label="Close celebration"
                    >
                        <X className="h-5 w-5"/>
                    </button>

                    <div className="text-6xl mb-4 animate-float">
                        {getMilestoneIcon(milestone.message)}
                    </div>

                    <Trophy className="h-8 w-8 mx-auto mb-2 animate-pulse"/>

                    <h2 className="text-3xl font-extrabold mb-2 tracking-tight">
                        Milestone Achieved!
                    </h2>

                    <div className="flex items-center justify-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                            <Star
                                key={i}
                                className={`h-4 w-4 ${i < 5 ? 'fill-current' : ''} animate-pulse`}
                                style={{animationDelay: `${i * 0.1}s`}}
                            />
                        ))}
                    </div>
                </div>

                {/* Enhanced Content */}
                <div className="p-6 space-y-6">
                    {/* Enhanced Main Message */}
                    <div className="text-center">
                        <p className="text-xl font-bold text-gradient-static mb-2 tracking-wide">
                            {milestone.message || "Milestone Achieved!"}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                            {getEncouragementMessage(milestone.message)}
                        </p>
                    </div>

                    {/* Enhanced Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass rounded-lg p-4 text-center">
                            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-500"/>
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wide uppercase">Success Rate</p>
                            <p className="text-2xl font-extrabold text-gradient-blue">
                                {Math.round((goalProgress.totalApplications > 0 ? goalProgress.totalApplications / goalProgress.totalApplications * 100 : 0))}%
                            </p>
                        </div>

                        <div className="glass rounded-lg p-4 text-center">
                            <Target className="h-6 w-6 mx-auto mb-2 text-blue-500"/>
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wide uppercase">Goal Progress</p>
                            <p className="text-2xl font-extrabold text-gradient-purple">
                                {goalProgress.totalProgress}%
                            </p>
                        </div>
                    </div>

                    {/* Enhanced Next Milestone */}
                    {nextMilestone && (
                        <div className="glass rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
                                    Next Milestone
                                </span>
                                <span className="text-sm font-extrabold text-gradient-static">
                                    {nextMilestone} applications
                                </span>
                            </div>

                            <div className="progress-container">
                                <div
                                    className={`progress-bar bg-gradient-to-r ${getMilestoneColor(milestone.message)}`}
                                    style={{width: `${progressToNext}%`}}
                                />
                            </div>

                            <div className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
                                <span>{currentCount} applications</span>
                                <span className="font-bold">{nextMilestone - currentCount} to go</span>
                            </div>
                        </div>
                    )}

                    {/* Enhanced Motivational Quote */}
                    <div
                        className="text-center p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border border-primary-200 dark:border-primary-800">
                        <p className="text-sm font-semibold italic text-gray-700 dark:text-gray-300 leading-relaxed">
                            "Success is the sum of small efforts repeated day in and day out."
                        </p>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-1 tracking-wide">
                            — Robert Collier
                        </p>
                    </div>

                    {/* Enhanced Action Button */}
                    <button
                        onClick={closeMilestone}
                        className="w-full btn btn-primary btn-lg font-bold tracking-wide"
                    >
                        <Trophy className="h-4 w-4 mr-2"/>
                        Keep Going Strong!
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MilestoneModal;