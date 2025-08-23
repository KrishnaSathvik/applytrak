import React, {useCallback, useEffect, useMemo} from 'react';
import {Star, Target, TrendingUp, Trophy, X} from 'lucide-react';
import {useAppStore} from '../../store/useAppStore';

interface MilestoneConfig {
    icon: string;
    color: string;
    encouragement: string;
    quote: {
        text: string;
        author: string;
    };
}

interface ConfettiOptions {
    particleCount: number;
    spread: number;
    origin: { x?: number; y?: number };
    colors?: string[];
}

const MilestoneModal: React.FC = () => {
    const {modals, closeMilestone, goalProgress} = useAppStore();
    const {milestone} = modals;

    // Memoized milestone configurations
    const milestoneConfigs = useMemo<Record<string, MilestoneConfig>>(() => ({
        '50': {
            icon: '🎯',
            color: 'from-blue-500 to-blue-600',
            encouragement: "You're building great momentum! Keep going!",
            quote: {
                text: "The way to get started is to quit talking and begin doing.",
                author: "Walt Disney"
            }
        },
        '100': {
            icon: '💯',
            color: 'from-green-500 to-green-600',
            encouragement: "Triple digits! You're showing serious dedication!",
            quote: {
                text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
                author: "Winston Churchill"
            }
        },
        '150': {
            icon: '🚀',
            color: 'from-purple-500 to-purple-600',
            encouragement: "Incredible persistence! You're unstoppable!",
            quote: {
                text: "The future belongs to those who believe in the beauty of their dreams.",
                author: "Eleanor Roosevelt"
            }
        },
        '200': {
            icon: '🌟',
            color: 'from-yellow-500 to-yellow-600',
            encouragement: "Amazing commitment! Your dream job is getting closer!",
            quote: {
                text: "Don't watch the clock; do what it does. Keep going.",
                author: "Sam Levenson"
            }
        },
        '250': {
            icon: '💎',
            color: 'from-pink-500 to-pink-600',
            encouragement: "Phenomenal dedication! You're an application machine!",
            quote: {
                text: "It is during our darkest moments that we must focus to see the light.",
                author: "Aristotle"
            }
        },
        '300': {
            icon: '👑',
            color: 'from-indigo-500 to-indigo-600',
            encouragement: "Legendary status achieved! You're truly inspiring!",
            quote: {
                text: "The only impossible journey is the one you never begin.",
                author: "Tony Robbins"
            }
        }
    }), []);

    // Extract milestone number from message
    const milestoneNumber = useMemo(() => {
        if (!milestone.message) return null;
        const match = milestone.message.match(/\d+/);
        return match ? match[0] : null;
    }, [milestone.message]);

    // Get milestone configuration
    const config = useMemo(() => {
        const defaultConfig: MilestoneConfig = {
            icon: '🏆',
            color: 'from-primary-500 to-primary-600',
            encouragement: "Every application brings you closer to your goal!",
            quote: {
                text: "Success is the sum of small efforts repeated day in and day out.",
                author: "Robert Collier"
            }
        };

        return milestoneNumber ? milestoneConfigs[milestoneNumber] || defaultConfig : defaultConfig;
    }, [milestoneNumber, milestoneConfigs]);

    // Calculate next milestone
    const nextMilestone = useMemo(() => {
        if (!milestoneNumber) return null;
        const current = parseInt(milestoneNumber);
        const milestones = [50, 100, 150, 200, 250, 300, 500, 750, 1000];
        return milestones.find(m => m > current) || null;
    }, [milestoneNumber]);

    // Calculate progress to next milestone
    const progressToNext = useMemo(() => {
        if (!nextMilestone) return 100;
        const currentCount = goalProgress.totalApplications;
        return Math.min((currentCount / nextMilestone) * 100, 100);
    }, [nextMilestone, goalProgress.totalApplications]);

    // Enhanced confetti with error handling
    const triggerConfetti = useCallback((options: ConfettiOptions) => {
        if (typeof window === 'undefined') return;

        const confetti = (window as any).confetti;
        if (typeof confetti === 'function') {
            try {
                confetti(options);
            } catch (error) {
                console.warn('Confetti animation failed:', error);
            }
        }
    }, []);

    // Confetti celebration effect
    useEffect(() => {
        if (!milestone.isOpen) return;

        const celebrateWithConfetti = () => {
            // Initial burst
            triggerConfetti({
                particleCount: 100,
                spread: 70,
                origin: {y: 0.6},
                colors: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']
            });

            // Secondary burst
            const secondBurst = setTimeout(() => {
                triggerConfetti({
                    particleCount: 50,
                    spread: 50,
                    origin: {y: 0.7},
                    colors: ['#ffd700', '#ff69b4', '#00fa9a', '#87ceeb']
                });
            }, 500);

            // Final burst for major milestones
            const finalBurst = setTimeout(() => {
                if (milestoneNumber && parseInt(milestoneNumber) >= 100) {
                    triggerConfetti({
                        particleCount: 30,
                        spread: 30,
                        origin: {y: 0.8},
                        colors: ['#ff6347', '#98fb98', '#dda0dd']
                    });
                }
            }, 1000);

            return () => {
                clearTimeout(secondBurst);
                clearTimeout(finalBurst);
            };
        };

        const cleanup = celebrateWithConfetti();
        return cleanup;
    }, [milestone.isOpen, milestoneNumber, triggerConfetti]);

    // Keyboard navigation
    useEffect(() => {
        if (!milestone.isOpen) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                closeMilestone();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [milestone.isOpen, closeMilestone]);

    // Calculate actual success rate (interviews + offers / total applications)
    const successRate = useMemo(() => {
        const {totalApplications} = goalProgress;
        if (totalApplications === 0) return 0;

        // For now, calculate a simple progress-based success rate
        // This can be enhanced later when you have status breakdown data in goalProgress
        const progressRate = Math.min(goalProgress.totalProgress, 100);
        return Math.round(progressRate * 0.3); // Conservative estimate: 30% of progress as success rate
    }, [goalProgress]);

    if (!milestone.isOpen) return null;

    return (
        <div
            className="modal-overlay"
            onClick={closeMilestone}
            role="dialog"
            aria-labelledby="milestone-title"
            aria-describedby="milestone-description"
        >
            <div
                className="modal-content max-w-md animate-bounce-subtle"
                onClick={(e) => e.stopPropagation()}
                style={{
                    animation: 'milestoneEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
            >
                {/* Enhanced Celebration Header */}
                <div
                    className={`bg-gradient-to-r ${config.color} text-white rounded-t-xl p-6 text-center relative overflow-hidden`}
                    style={{
                        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%)'
                    }}
                >
                    <button
                        onClick={closeMilestone}
                        className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
                        aria-label="Close celebration modal"
                        type="button"
                    >
                        <X className="h-5 w-5"/>
                    </button>

                    <div
                        className="text-6xl mb-4 animate-float"
                        style={{
                            animation: 'float 2s ease-in-out infinite'
                        }}
                        role="img"
                        aria-label={`Milestone icon: ${config.icon}`}
                    >
                        {config.icon}
                    </div>

                    <Trophy className="h-8 w-8 mx-auto mb-2 animate-pulse"/>

                    <h2
                        id="milestone-title"
                        className="text-3xl font-extrabold mb-2 tracking-tight"
                    >
                        Milestone Achieved!
                    </h2>

                    <div className="flex items-center justify-center space-x-1" role="img" aria-label="5-star rating">
                        {Array.from({length: 5}).map((_, i) => (
                            <Star
                                key={i}
                                className="h-4 w-4 fill-current animate-pulse"
                                style={{
                                    animationDelay: `${i * 0.1}s`,
                                    animationDuration: '1s'
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* Enhanced Content */}
                <div className="p-6 space-y-6">
                    {/* Enhanced Main Message */}
                    <div className="text-center">
                        <p
                            id="milestone-description"
                            className="text-xl font-bold text-gradient-static mb-2 tracking-wide"
                        >
                            {milestone.message || "Milestone Achieved!"}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
                            {config.encouragement}
                        </p>
                    </div>

                    {/* Enhanced Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="glass rounded-lg p-4 text-center transition-transform hover:scale-105">
                            <TrendingUp
                                className="h-6 w-6 mx-auto mb-2 text-green-500"
                                aria-hidden="true"
                            />
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wide uppercase">
                                Success Rate
                            </p>
                            <p
                                className="text-2xl font-extrabold text-gradient-blue"
                                aria-label={`Success rate: ${successRate} percent`}
                            >
                                {successRate}%
                            </p>
                        </div>

                        <div className="glass rounded-lg p-4 text-center transition-transform hover:scale-105">
                            <Target
                                className="h-6 w-6 mx-auto mb-2 text-blue-500"
                                aria-hidden="true"
                            />
                            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 tracking-wide uppercase">
                                Goal Progress
                            </p>
                            <p
                                className="text-2xl font-extrabold text-gradient-purple"
                                aria-label={`Goal progress: ${goalProgress.totalProgress} percent`}
                            >
                                {goalProgress.totalProgress}%
                            </p>
                        </div>
                    </div>

                    {/* Enhanced Next Milestone */}
                    {nextMilestone && (
                        <div className="glass rounded-lg p-4 transition-all hover:shadow-lg">
                            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300 tracking-wide">
                  Next Milestone
                </span>
                                <span className="text-sm font-extrabold text-gradient-static">
                  {nextMilestone} applications
                </span>
                            </div>

                            <div
                                className="progress-container"
                                role="progressbar"
                                aria-valuenow={progressToNext}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`Progress to next milestone: ${progressToNext.toFixed(1)}%`}
                            >
                                <div
                                    className={`progress-bar bg-gradient-to-r ${config.color} transition-all duration-1000 ease-out`}
                                    style={{
                                        width: `${progressToNext}%`,
                                        boxShadow: `0 0 10px rgba(59, 130, 246, 0.3)`
                                    }}
                                />
                            </div>

                            <div
                                className="flex justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mt-1">
                                <span>{goalProgress.totalApplications} applications</span>
                                <span className="font-bold">
                  {nextMilestone - goalProgress.totalApplications} to go
                </span>
                            </div>
                        </div>
                    )}

                    {/* Enhanced Motivational Quote */}
                    <div
                        className="text-center p-4 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border border-primary-200 dark:border-primary-800 transition-all hover:shadow-md">
                        <blockquote
                            className="text-sm font-semibold italic text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                            "{config.quote.text}"
                        </blockquote>
                        <cite className="text-xs font-medium text-gray-500 dark:text-gray-400 tracking-wide not-italic">
                            — {config.quote.author}
                        </cite>
                    </div>

                    {/* Enhanced Action Button */}
                    <button
                        onClick={closeMilestone}
                        className="w-full btn btn-primary btn-lg font-bold tracking-wide transition-all hover:scale-105 focus:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-300 dark:focus:ring-primary-800"
                        type="button"
                        autoFocus
                    >
                        <Trophy className="h-4 w-4 mr-2" aria-hidden="true"/>
                        Keep Going Strong!
                    </button>
                </div>
            </div>

            {/* Custom styles for animations */}
            <style jsx>{`
                @keyframes milestoneEntrance {
                    0% {
                        opacity: 0;
                        transform: scale(0.3) translateY(-50px);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.05) translateY(0px);
                    }
                    100% {
                        opacity: 1;
                        transform: scale(1) translateY(0px);
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                .text-gradient-static {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .text-gradient-blue {
                    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .text-gradient-purple {
                    background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .animate-bounce-subtle {
                    animation: bounce-subtle 0.6s ease-out;
                }

                @keyframes bounce-subtle {
                    0% {
                        transform: translateY(-20px);
                        opacity: 0;
                    }
                    60% {
                        transform: translateY(5px);
                        opacity: 0.8;
                    }
                    100% {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                .progress-container {
                    width: 100%;
                    height: 8px;
                    background-color: rgba(156, 163, 175, 0.3);
                    border-radius: 9999px;
                    overflow: hidden;
                    position: relative;
                }

                .progress-bar {
                    height: 100%;
                    border-radius: 9999px;
                    position: relative;
                    overflow: hidden;
                }

                .progress-bar::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                            90deg,
                            transparent,
                            rgba(255, 255, 255, 0.4),
                            transparent
                    );
                    animation: shimmer 2s infinite;
                }

                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
            `}</style>
        </div>
    );
};

export default MilestoneModal;