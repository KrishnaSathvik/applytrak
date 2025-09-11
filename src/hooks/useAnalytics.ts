// src/hooks/useAnalytics.ts - Custom hook for analytics
import { useCallback } from 'react';
import { 
  trackEvent, 
  trackUserInteraction, 
  trackConversion, 
  trackUserJourney,
  trackEcommerce 
} from '../services/googleAnalyticsService';

export const useAnalytics = () => {
  // Basic event tracking
  const track = useCallback((action: string, category: string, label?: string, value?: number) => {
    trackEvent(action, category, label, value);
  }, []);

  // User interaction tracking
  const trackInteraction = useCallback(() => trackUserInteraction, []);

  // Conversion tracking
  const trackConversions = useCallback(() => trackConversion, []);

  // User journey tracking
  const trackJourney = useCallback(() => trackUserJourney, []);

  // Ecommerce tracking
  const trackEcommerceEvents = useCallback(() => trackEcommerce, []);

  return {
    track,
    trackInteraction: trackInteraction(),
    trackConversions: trackConversions(),
    trackJourney: trackJourney(),
    trackEcommerce: trackEcommerceEvents()
  };
};

export default useAnalytics;
