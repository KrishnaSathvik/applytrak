// src/hooks/useWelcomeTour.ts
import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';

export const useWelcomeTour = () => {
  const { openWelcomeTourModal, auth } = useAppStore();

  useEffect(() => {
    // Check if this is the user's first visit
    const hasSeenWelcomeTour = localStorage.getItem('applytrak_welcome_tour_seen');
    const isFirstVisit = !hasSeenWelcomeTour;
    
    // For authenticated users, check if they've seen the tour in this session
    const hasSeenTourThisSession = sessionStorage.getItem('applytrak_tour_seen_this_session');
    
    // Show tour for:
    // 1. First-time visitors (no localStorage)
    // 2. Unauthenticated users who haven't seen it this session
    // 3. Authenticated users who are new (first time with this account)
    const shouldShowTour = isFirstVisit || 
                          (!auth.isAuthenticated && !hasSeenTourThisSession) ||
                          (auth.isAuthenticated && !hasSeenWelcomeTour);

    if (shouldShowTour) {
      // Add a small delay to ensure the app is fully loaded
      const timer = setTimeout(() => {
        openWelcomeTourModal();
        
        // Mark that the user has seen the tour
        localStorage.setItem('applytrak_welcome_tour_seen', 'true');
        sessionStorage.setItem('applytrak_tour_seen_this_session', 'true');
      }, 2000); // 2 second delay

      return () => clearTimeout(timer);
    }
    
    return undefined; // Explicit return for all code paths
  }, [openWelcomeTourModal, auth.isAuthenticated]);

  // Function to manually reset and show the tour again (for testing)
  const resetAndShowTour = () => {
    localStorage.removeItem('applytrak_welcome_tour_seen');
    sessionStorage.removeItem('applytrak_tour_seen_this_session');
    openWelcomeTourModal();
  };

  // Function to show tour for authenticated users who want to see it again
  const showTourForAuthenticatedUser = () => {
    openWelcomeTourModal();
  };

  // Function to show tour at strategic moments (e.g., after adding first application)
  const showStrategicTour = (context: 'first-application' | 'goals-set' | 'analytics-viewed') => {
    const hasSeenContextualTour = localStorage.getItem(`applytrak_contextual_tour_${context}`);
    
    if (!hasSeenContextualTour) {
      // Show a contextual tour based on what the user just did
      openWelcomeTourModal();
      localStorage.setItem(`applytrak_contextual_tour_${context}`, 'true');
    }
  };

  return { 
    resetAndShowTour, 
    showTourForAuthenticatedUser, 
    showStrategicTour 
  };
};
